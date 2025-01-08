import os

from dotenv import load_dotenv
from flask import jsonify
from case import CaseArray, check_if_output_is_valid
from prompts import get_system_prompt
from upload import upload_file_method_production
from vectorstore import QdrantVectorstore
import json
import re

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureChatOpenAI

from app import socketio
from case import CaseArray, check_if_output_is_valid
from prompts import get_system_prompt
from upload import upload_file_method_production

load_dotenv()

# Getting all Env Variables
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_GPT = os.getenv("AZURE_DEPLOYMENT_GPT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")

def start_quering_llm(invokedPrompt, llm, parser, max_tries=3) -> dict:
    """
    Queries the LLM with the given prompt template, LLM, and parser to generate a valid case.
    If the output is invalid (i.e., not in JSON format or missing some required parameters),
    the function re-queries the LLM until it gets a valid output or reaches the maximum number of retries.

    Returns:
        dict: The output case formatted as a Python dictionary if valid, otherwise returning an empty dict.
    """
    chain = llm | parser
    chain_output = chain.invoke(invokedPrompt)
    is_valid = False
    for try_number in range(1, max_tries + 1):
        is_valid = check_if_output_is_valid(chain_output)
        if is_valid:
            break
        else:
            llm.temperature += 0.1
            chain_output = chain.invoke(invokedPrompt)
            pass

    if not is_valid:
        print(f"Couldn't get valid output in {try_number} tries")
        return {}
    else:
        print(f"Generated valid output with {try_number} tries: {chain_output}")

    return chain_output


# Method to generate one or more Cases
def generate(request):
    if request.method == "POST":
        json_str = request.get_json(force=True)
        # gets all attachments sent by user
        attachments = json_str["attachments"]
        # gets socket_id to send message to frontend
        socket_id = json_str["socket_id"]

        socketio.emit('case_generation', {'message': 'Starting Case Generation...'}, to=socket_id)

        # Prompt for generating JSON and including all context
        prompt = "Please create metadata for a new case based on the Context provided and return them in JSON! Please try include all necessary information that the context has!"

        # Instantiating AzureOpenAI object for making prompts
        llm = AzureChatOpenAI(
            azure_endpoint=AZURE_ENDPOINT,
            azure_deployment=AZURE_DEPLOYMENT_GPT,
            openai_api_version=OPENAI_API_VERSION,
            temperature=0,
            max_tokens=None,
            timeout=None,
            max_retries=2,
            streaming=False,
        )

        # Upload File method converts into Context (Text)
        context = upload_file_method_production(attachments, socket_id)

        socketio.emit('case_generation', {'message': 'Finalizing Case Generation...'}, to=socket_id)

        # get system prompt for case generation
        system_prompt_langchain_parser = get_system_prompt("langchain_parser")
        # validate json for multiple cases
        case_parser_json = JsonOutputParser(pydantic_object=CaseArray)

        # set system prompt and context for LLM
        messages = [
            ("system", "{system_prompt}\n{format_instructions}"),
            ("human", "CONTEXT: {context}\n\nQUERY: {query}"),
        ]

        # replace system prompt and format instructions for LLM
        promptLangchain = ChatPromptTemplate.from_messages(messages).partial(
            system_prompt=system_prompt_langchain_parser,
            format_instructions=case_parser_json.get_format_instructions(),
        )

        # invoke prompt to get an answer
        promptLangchainInvoked = promptLangchain.invoke(
            {"context": context, "query": prompt}
        )

        # get response
        response_dict = start_quering_llm(
            promptLangchainInvoked, llm, case_parser_json, max_tries=3
        )

        # return case json
        return jsonify(response_dict), 200


def vector_db_save_cases(request):
    response_dict, code = generate_case_langchain_production(request)
    if response_dict:
        cases_dict = json.loads(response_dict.data)["cases"]

    json_str = request.get_json(force=True)
    attachments = json_str["attachments"]

    vectorstore = QdrantVectorstore()

    for attachment in attachments:
        vectorstore.insert_attachment(attachment)
    for case in cases_dict:
        vectorstore.insert_case(case)
        
    return "Cases Saved Successfully", 200

def vector_db_save_cases_backend(request):
    json_str = request.get_json(force=True)
    for case in json_str:
        attachments = case["attachments"]
        case["attachments"] = [attachment["id"] for attachment in attachments]

        vectorstore = QdrantVectorstore()
        vectorstore.insert_case(case, id=case["id"])

        for attachment in attachments:
            vectorstore.insert_attachment(attachment)

    return "Cases Saved Successfully", 200

def transform_to_standalone_question(chat_history):
    system_prompt = """
        You are an AI assistant. Your task is to transform the latest human message in the chat history into a standalone question that can be understood without the previous context and in the same language it is written in.
        
        For example, if the AI says "I am feeling tired" and the human says "Why", the question "Why" wouldn't be understandable without the context. It should be transformed to "Why are you feeling tired?".
        
        Here is the chat history:
        {chat_history}
        
        Please provide the standalone question based on the latest human message. DO NOT include anything else.
    """

    llm = AzureChatOpenAI(
        azure_endpoint=AZURE_ENDPOINT,
        azure_deployment=AZURE_DEPLOYMENT_GPT,
        openai_api_version=OPENAI_API_VERSION,
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
        streaming=False,
    )

    prompt = system_prompt.format(chat_history=chat_history)
    response = llm([{"role": "system", "content": prompt}]).content

    return response

def replace_doc_number(input_string, replacement_dict):
    # Define the regex pattern to match [doc_number:number]
    pattern = r'\[doc_number:(\d+)\]'
    
    # Function to determine the replacement string based on the number
    def replacement_function(match):
        number = match.group(1)
        return f"[{replacement_dict[int(number)]}]"
    
    # Use re.sub with a function to replace the pattern with the appropriate string
    result = re.sub(pattern, replacement_function, input_string)
    
    return result

def transform_messages_for_llm(messages):
    return [{'role': message['role'], 'content': message['content']} for message in messages[:-1]]


def ask_question(request):
    json_str = request.get_json(force=True)
    messages = json_str

    massages_only_role_content = transform_messages_for_llm(messages)

    # Extract the latest user message
    latest_user_message = next(
        (message["content"] for message in reversed(messages) if message["role"] == "user"), None
    )

    if not latest_user_message:
        return jsonify({"error": "No user message found"}), 400

    vectorstore = QdrantVectorstore()

    standalone_question = transform_to_standalone_question(json.dumps(massages_only_role_content))
    relevant_vectors = vectorstore.search_from_query(standalone_question)

    replacement_dict = {}
    context = ""
    doc_number = 1
    for vector in relevant_vectors:
        doc = vector.payload
        text = doc["text"]
        metadata = doc["metadata"]

        if metadata["inserttype"] == "case":
            text = f"Case content [doc_number:{doc_number}]:\n" + text
            replacement_dict[doc_number] = "case:"+str(metadata["case_id"])
        elif metadata["inserttype"] == "attachment-chunk":
            text = metadata["filename"] + f" [doc_number:{doc_number}]:\n" + text
            replacement_dict[doc_number] = "file:"+str(metadata["file_id"])

        doc_number += 1

        text += "\n\n---\n\n"

        context += text

    user_query = f"{latest_user_message}"

    llm = AzureChatOpenAI(
        azure_endpoint=AZURE_ENDPOINT,
        azure_deployment=AZURE_DEPLOYMENT_GPT,
        openai_api_version=OPENAI_API_VERSION,
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
        streaming=False,
    )

    # Use the history from json_str
    messages = [
        {"role": "system", "content": "You are a helpful assistant. Answer user questions based only on the provided context, which includes cases of problems with machines and their solutions, manuals, notes, transcribed and textualized video, audio, and image content, and other related documents. Always respond in the same language as the user. Cite the context in your response by writing '[doc_number:number]' and replacing number with the actual number of the document and doc_number staying the same for the program to correctly identify your citing. Ignore if previous responses used different citing formats. Just stick to the describe citing format."},
        *massages_only_role_content,
        {"role": "system", "content": f"CONTEXT for next query: {context}"},
        {"role": "user", "content": user_query},
    ]
    response = llm(messages).content

    response = replace_doc_number(response, replacement_dict)

    return jsonify({"response": response}), 200

        


