import json
import os
import time
import re

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureChatOpenAI

from app import sio
from dotenv import load_dotenv
from flask import jsonify
from case import CaseArray, check_if_output_is_valid
from prompts import get_system_prompt
from upload import upload_file_method_production
from vectorstore import QdrantVectorstore
from readwrite import write_to_file

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
        print(f"Generated valid output with {try_number} tries")

    return chain_output


# Method to generate one or more Cases
def generate(request):
    if request.method == "POST":
        json_str = request.get_json(force=True)
        # gets all attachments sent by user
        attachments = json_str["attachments"]
        # gets socket_id to send message to frontend
        socket_id = json_str["socket_id"]

        sio.emit('llm_message', {'message': 'Starting Case Generation...', 'socket_id': socket_id})

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
        data = json.loads(context)
        formatted_json_string = json.dumps(data, ensure_ascii=False, indent=2)
        print(formatted_json_string)
        print("ALL ATTACHMENTS ANALYZED")

        sio.emit('llm_message', {'message': 'Finalizing Case Generation...', 'socket_id': socket_id})
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

        cases = response_dict["cases"]
        attachment_files = json.loads(context)
        glossary_terms = []

        # add glossary from analyzed file to response (attachments)
        for case in cases:
            for att in case["attachments"]:
                for file in attachment_files:
                    att_id = att["id"]
                    file_id = file["file_id"]
                    if att_id == file_id:
                        if "glossary" in file["content"]:
                            for term in file["content"]["glossary"]:
                                if "glossary" not in case:
                                    att["glossary"] = []
                                if term not in att["glossary"]:
                                    att["glossary"].append(term)
                                if term not in glossary_terms:
                                    glossary_terms.append(term)

        # check if glossary term was mentioned in solution, title or description
        # if yes add to glossary of the case
        for case in cases:
            for term in glossary_terms:
                if term in case["solution"] or term in case["title"] or term in case["description"]:
                    if "glossary" not in case:
                        case["glossary"] = []
                    if term not in case["glossary"]:
                        case["glossary"].append(term)


        for case in cases:
            for att in case["attachments"]:
                for file in attachment_files:
                    for term in glossary_terms:
                        att_id = att["id"]
                        file_id = file["file_id"]
                        if att_id == file_id:
                            if term in json.dumps(file, ensure_ascii=False, indent=2):
                                if "glossary" not in att:
                                    att["glossary"] = []
                                if term not in att["glossary"]:
                                    att["glossary"].append(term)

        # debug
        write_to_file(str(time.time()), cases)

        print(json.dumps(response_dict, ensure_ascii=False, indent=2))
        # return case json
        return jsonify(response_dict), 200


def vector_db_save_cases(request):
    case = request.get_json(force=True)
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
    socket_id = json_str["socketId"]
    messages = json_str["context"]
    latest_user_message = json_str["message"]

    messages_only_role_content = transform_messages_for_llm(messages)

    # Extract the latest user message
    # latest_user_message = next(
    #     (message["content"] for message in reversed(messages) if message["role"] == "user"), None
    # )

    if not latest_user_message:
        return jsonify({"error": "No user message found"}), 400

    vectorstore = QdrantVectorstore()

    standalone_question = transform_to_standalone_question(json.dumps(messages_only_role_content))
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
        streaming=True,
    )

    # Use the history from json_str
    prompt_messages = [
        {"role": "system", "content": "You are a helpful assistant. Answer user questions based only on the provided context, which includes cases of problems with machines and their solutions, manuals, notes, transcribed and textualized video, audio, and image content, and other related documents. Always respond in the same language as the user. Cite the context in your response by writing '[doc_number:number]' and replacing number with the actual number of the document and doc_number staying the same for the program to correctly identify your citing. Ignore if previous responses used different citing formats. Just stick to the describe citing format."},
        *messages_only_role_content,
        {"role": "system", "content": f"CONTEXT for next query: {context}"},
        {"role": "user", "content": user_query},
    ]
    stream = llm.stream(prompt_messages)

    concatenated_tokens = ""
    for stream_token in stream:
        token = stream_token.content
        concatenated_tokens += token
        edited_reponse = replace_doc_number(concatenated_tokens, replacement_dict)
        sio.emit('llm_message', {'message': edited_reponse, 'socket_id': socket_id})
    
    ai_message = replace_doc_number(edited_reponse, replacement_dict)
    sio.emit('llm_end', {'message': ai_message, 'socket_id': socket_id})

    return jsonify(ai_message), 200

        


