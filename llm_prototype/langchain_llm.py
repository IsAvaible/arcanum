import json
import os

from flask import jsonify, Blueprint, session
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI

from app import app, socketio
from debug import save_debug
from prompts import get_system_prompt, get_human_prompt
from session import add_value_to_session_list
from upload import upload_file_method

vector_store = None
openai_models = ['gpt-3.5-turbo-0125', 'gpt-4o-mini', 'gpt-3.5-turbo-1106']
llm = Blueprint('llm', __name__)


def prompt_question_socket_langchain(request, llm_selection):
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
            context = upload_file_method(files, pdf_extractor, whisper)
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