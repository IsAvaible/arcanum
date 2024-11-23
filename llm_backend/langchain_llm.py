from dotenv import load_dotenv

import json
import os

from flask import jsonify, Blueprint, session
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

from app import socketio
from prompts import get_system_prompt
from session import add_value_to_session_list
from upload import upload_file_method

from langchain_core.output_parsers import JsonOutputParser
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from pydantic import ValidationError
from langchain_core.prompts import MessagesPlaceholder
from langchain_openai import AzureChatOpenAI

# Load environment variables from .env file
load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT_GPT")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")

vector_store = None
openai_models = ['gpt-4o-mini', 'gpt-3.5-turbo-0125', 'gpt-3.5-turbo-1106']
llm = Blueprint('llm', __name__)


# defining the desired output of the llm
class Case(BaseModel):
    title: str = Field(...,description="A short, clear summary of the case. This should provide a concise idea of the issue at hand.")
    description: str = Field(...,description="A detailed explanation of the case, including relevant background information and context necessary for understanding the problem. This field should focus on the issue itself and should not include the solution.")
    solution: str = Field(...,description="A proposed or implemented solution to address the case. If not yet resolved, this can include potential steps or approaches to consider.")
    assignee: list[str] = Field(...,description="The name or identifier of the person responsible for handling or resolving the case.")
    status: str = Field(...,description="The current state of the case, such as 'open', 'in progress' or 'resolved' to track its progression.")


class CaseArray(BaseModel):
    cases: list[Case] = Field(...,description="A list of one or multiple cases.")

def check_if_output_is_valid(chain_output):
    try:
        # This will validate the output and raise an error if any required field is missing
        CaseArray.model_validate(chain_output)

        return True
    except ValidationError as e:
        print("Validation error", e.json())

        return False

def start_quering_llm(invokedPrompt,llm,parser,max_tries=3) -> dict :
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
    for try_number in range(1,max_tries+1):
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
        print(f"Generated valid ouput with {try_number} tries: {chain_output}")

    return chain_output


def generate_case_langchain(request):
    if request.method == 'POST':
        files = request.files.getlist("file")
        model = request.form.get("model")
        prompt = request.form.get("prompt")
        chat_counter = request.form.get("chat_counter")
        pdf_extractor = request.form.get("pdf_extractor")

        llm = AzureChatOpenAI(
            azure_endpoint=AZURE_ENDPOINT,
            azure_deployment=AZURE_DEPLOYMENT,
            openai_api_version=OPENAI_API_VERSION,
            temperature=0,
            max_tokens=None,
            timeout=None,
            max_retries=2,
            streaming=False
        )
        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400
        
        # Kontext sammeln und in der Session speichern
        session_key = f"context{chat_counter}"
        old_messages_key = f"old_messages{chat_counter}"
        if files:
            context = upload_file_method(files, pdf_extractor, chat_counter)
            session[session_key] = session.get(session_key, "") + context
        else:
            context = session.get(f"context{chat_counter}", "")

        history = []
        if session.get(old_messages_key):
            for msg in session.get(old_messages_key):
                history.append(msg)

        system_prompt_langchain_parser = get_system_prompt("langchain_parser")
        # Set up a parser + inject instructions into the prompt template.
        case_parser_json = JsonOutputParser(pydantic_object=CaseArray)
        messages = [
            ("system","{system_prompt}\n{format_instructions}"),
            MessagesPlaceholder("history"),
            ("human", "CONTEXT: {context}\n\nQUERY: {query}")
        ]
        promptLangchain = ChatPromptTemplate.from_messages(messages).partial(system_prompt=system_prompt_langchain_parser,format_instructions=case_parser_json.get_format_instructions())
        promptLangchainInvoked = promptLangchain.invoke({"context": context, "query": prompt, "history":history})
        print(promptLangchainInvoked)

        response_dict = start_quering_llm(promptLangchainInvoked,llm,case_parser_json,max_tries=3)
        response_json_string = json.dumps(response_dict, indent=2, ensure_ascii=False) # makes the dict print out more readable for the user

        
        add_value_to_session_list(old_messages_key,("human", prompt))
        add_value_to_session_list(old_messages_key,("assistant", response_json_string))

        old_messages_json_key = f"old_messages_json_{chat_counter}"
        add_value_to_session_list(old_messages_json_key, chat_message_to_json(("human", prompt)))
        add_value_to_session_list(old_messages_json_key, chat_message_to_json(("assistant", response_json_string)))

        return response_json_string, 200

def chat(request):
    if request.method == 'POST':
        model = request.form.get("model")
        prompt = request.form.get("prompt")

        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400

        chat_counter = request.form.get("chat_counter")

        llm = ChatOpenAI(
            model=model,
            temperature=0,
            max_tokens=None,
            timeout=None,
            streaming=True
        )

        embedding_function = OpenAIEmbeddings(model='text-embedding-3-large')
        vector_store = Chroma(
            persist_directory=".chromadb/",
            embedding_function=embedding_function
        )
        # GET OLD MSGS
        old_messages_key = f"old_messages{chat_counter}"
        old_messages_json_key = f"old_messages_json_{chat_counter}"
        old_messages = session.get(old_messages_key)

        if old_messages:
            all_msgs = "\n".join(x[1] for x in old_messages)
            old_msgs = [("system", get_system_prompt("old_msgs")),("human", all_msgs + "That is the latest user query: " + prompt)]
            new_prompt = llm.invoke(old_msgs).content
            embedding_vector = embedding_function.embed_query(new_prompt)
        else:
            new_prompt = prompt
            embedding_vector = embedding_function.embed_query(new_prompt)
        matched_docs = vector_store.similarity_search_by_vector(embedding_vector)
        unique_metadata = set()

        for doc in matched_docs:
            case_id = doc.metadata.get("case_id")
            filename = doc.metadata.get("filename")

            # Erstelle ein Tuple aus case_id und filename, um Duplikate zu erkennen
            metadata_tuple = (case_id, filename)

            # Wenn diese Kombination noch nicht gesehen wurde, füge das Dokument zur Liste hinzu
            if metadata_tuple not in unique_metadata:
                unique_metadata.add(metadata_tuple)

        context = ""
        for result in matched_docs:
            context += f"Document Case-ID: {result.metadata.get('case_id')} Filename: {result.metadata.get('filename')} : {result.page_content}\n\n"

        # Alte Nachrichten sammeln und in der Session speichern

        human_query_tup_without_context = ("human", new_prompt)
        human_query_tup_with_context = ("human", "Please take this as input data: " + context)


        messages = [
            ("system", get_system_prompt("chat")),
        ]
        # Alle Nachrichten hinzufügen
        if old_messages:
            for msg in old_messages:
                messages.append(msg)

        messages.append(human_query_tup_with_context)
        messages.append(human_query_tup_without_context)

        add_value_to_session_list(old_messages_key, human_query_tup_without_context)
        # LLM-Response streamen
        result = ""
        response_generator = llm.stream(messages)
        socketio.emit(f"stream{chat_counter}", {'content': "START_LLM_MESSAGE"})

        for response_chunk in response_generator:
            result_chunk = response_chunk.content
            result += result_chunk
            socketio.emit(f"stream{chat_counter}", {'content': result_chunk})


        socketio.emit(f"stream{chat_counter}", {'content': "END_LLM_MESSAGE"})

        add_value_to_session_list(old_messages_key, ("assistant", result))

        old_msgs = session[old_messages_key]
        session[old_messages_key] = []
        for msg in old_msgs:
            add_value_to_session_list(old_messages_json_key, chat_message_to_json(msg))

        return '', 200



def format_chat_messages(messages):
    formatted_messages = []
    for role, content in messages:
        formatted_messages.append(f"{role.capitalize()}: {content}")
    return "\n------------------------------------------------\n".join(formatted_messages)


def chat_messages_to_json(messages):
    messages_list = []
    for role, content in messages:
        messages_list.append({
            "role": role,
            "content": content
        })
    return json.dumps(messages_list, indent=4)

def chat_message_to_json(message):
    role, content = message
    content = content.strip('"')
    msg = {
            "role": role,
            "content": content
        }
    return msg