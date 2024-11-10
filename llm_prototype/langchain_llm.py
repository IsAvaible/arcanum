import json
import os

from flask import jsonify, Blueprint, session
from langchain_chroma import Chroma
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app import app, socketio
from debug import save_debug
from prompts import get_system_prompt
from session import add_value_to_session_list
from upload import upload_file_method

vector_store = None
openai_models = ['gpt-3.5-turbo-0125', 'gpt-4o-mini', 'gpt-3.5-turbo-1106']
llm = Blueprint('llm', __name__)


def generate_case_langchain(request, llm_selection):
    if request.method == 'POST':
        files = request.files.getlist("file")
        model = request.form.get("model")
        prompt = request.form.get("prompt")
        chat_counter = request.form.get("chat_counter")
        system_prompt = request.form.get("system_prompt")
        pdf_extractor = request.form.get("pdf_extractor")
        whisper = request.form.get("whisper")

        # Initialisiere das LLM
        llm = None
        if llm_selection == "openai":
            llm = ChatOpenAI(
                model=model,
                temperature=0.3,
                max_tokens=None,
                timeout=None,
                max_retries=2,
                streaming=True
            )
        elif llm_selection == llm_selection:
            llm = ChatOllama(
                model=model,
                temperature=0,
                num_predict=-1,
                streaming=True
            )

        # Kontext sammeln und in der Session speichern
        if files:
            context = upload_file_method(files, pdf_extractor, whisper, llm_selection, chat_counter)
            session_key = f"{llm_selection}_context{chat_counter}"
            session[session_key] = session.get(session_key, "") + context
        else:
            context = session.get(f"{llm_selection}_context{chat_counter}", "")


        # Alte Nachrichten sammeln und in der Session speichern
        old_messages_key = f"{llm_selection}_old_messages{chat_counter}"
        old_messages_json_key = f"{llm_selection}_old_messages_json_{chat_counter}"
        human_query_tup_with_context = ("human", "Please take this as input data: " + context)
        human_query_tup_without_context = ("human", prompt)

        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400

        # System- und Human-Prompt generieren und alte Nachrichten dranhängen
        system_prompt = get_system_prompt(system_prompt)
        messages = [
            ("system", system_prompt),
            human_query_tup_with_context
        ]
        # Alle Nachrichten hinzufügen
        if not session.get(old_messages_key):
            for msg in session.get(old_messages_key):
                messages.append(msg)

        messages.append(human_query_tup_without_context)
        add_value_to_session_list(old_messages_key, human_query_tup_without_context)
        # LLM-Response streamen
        result = ""
        response_generator = llm.stream(messages)
        socketio.emit(f"{llm_selection}_stream{chat_counter}", {'content': "START_LLM_MESSAGE"})

        for response_chunk in response_generator:
            result_chunk = response_chunk.content
            result += result_chunk
            socketio.emit(f"{llm_selection}_stream{chat_counter}", {'content': result_chunk})

        socketio.emit(f"{llm_selection}_stream{chat_counter}", {'content': "END_LLM_MESSAGE"})

        add_value_to_session_list(old_messages_key, ("assistant", result))

        for msg in session.get(old_messages_key):
            add_value_to_session_list(old_messages_json_key, chat_message_to_json(msg))

        debug = {
            "messages": format_chat_messages(session.get(old_messages_key)),
            "context": context,
        }

        debug_path = os.path.join(app.root_path, "debug", f"{llm_selection}_chat_{chat_counter}.txt")
        save_debug(debug_path, debug)

        return '', 200


def chat(request, llm_selection):
    if request.method == 'POST':
        model = request.form.get("model")
        prompt = request.form.get("prompt")
        chat_counter = request.form.get("chat_counter")

        # Initialisiere das LLM
        llm = None
        if llm_selection == "openai":
            llm = ChatOpenAI(
                model=model,
                temperature=0,
                max_tokens=None,
                timeout=None,
                max_retries=2,
                streaming=True
            )
        elif llm_selection == llm_selection:
            llm = ChatOllama(
                model=model,
                temperature=0,
                num_predict=-1,
                streaming=True
            )

        embedding_function = OpenAIEmbeddings(model='text-embedding-3-large')
        vector_store = Chroma(
            persist_directory=".chromadb/",
            embedding_function=embedding_function
        )
        old_messages_key = f"{llm_selection}_old_messages{chat_counter}"
        if session.get(old_messages_key):
            all_msgs = "\n".join(x[1] for x in session.get(old_messages_key))
            embedding_vector = embedding_function.embed_query(all_msgs)
        else:
            embedding_vector = embedding_function.embed_query(prompt)
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

        print(unique_metadata)

        context = ""
        for result in matched_docs:
            context += f"Document Case-ID: {result.metadata.get('case_id')} Filename: {result.metadata.get('filename')} : {result.page_content}\n\n"

        # Alte Nachrichten sammeln und in der Session speichern

        old_messages_json_key = f"{llm_selection}_old_messages_json_{chat_counter}"
        human_query_tup_without_context = ("human", prompt)
        human_query_tup_with_context = ("human", "Please take this as input data: " + context)

        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400

        # System- und Human-Prompt generieren und alte Nachrichten dranhängen
        system_prompt = get_system_prompt("chat")
        messages = [
            ("system", system_prompt),
            human_query_tup_with_context
        ]
        # Alle Nachrichten hinzufügen
        if not session.get(old_messages_key):
            for msg in session.get(old_messages_key):
                messages.append(msg)

        messages.append(human_query_tup_without_context)
        add_value_to_session_list(old_messages_key, human_query_tup_without_context)
        # LLM-Response streamen
        result = ""
        response_generator = llm.stream(messages)
        socketio.emit(f"{llm_selection}_stream{chat_counter}", {'content': "START_LLM_MESSAGE"})

        for response_chunk in response_generator:
            result_chunk = response_chunk.content
            result += result_chunk
            socketio.emit(f"{llm_selection}_stream{chat_counter}", {'content': result_chunk})


        socketio.emit(f"{llm_selection}_stream{chat_counter}", {'content': "END_LLM_MESSAGE"})

        add_value_to_session_list(old_messages_key, ("assistant", result))

        for msg in session.get(old_messages_key):
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