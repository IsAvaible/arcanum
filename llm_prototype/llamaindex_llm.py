import json
import os

from flask import jsonify, Blueprint, render_template, session
from llama_index.core.base.llms.types import ChatMessage

from llama_index.legacy.llms import Ollama

from app import app, socketio
from debug import save_debug
from prompts import system_prompt_json, system_prompt_normal, get_system_prompt, get_human_prompt
from session import add_value_to_session_list
from upload import upload_file_method_vectordb, upload_file_method
from llama_index.llms.openai import OpenAI
from llama_index.core import Settings

vector_store = None
openai_models = ['gpt-3.5-turbo-0125', 'gpt-4o-mini', 'gpt-3.5-turbo-1106']

llm = Blueprint('llm', __name__)


def prompt_question_socket_llamaindex(request, llm_selection):
    if request.method == 'POST':
        files = request.files.getlist("file")
        model = request.form.get("model")
        prompt = request.form.get("prompt")
        chat_counter = request.form.get("chat_counter")
        system_prompt = request.form.get("system_prompt")
        pdf_extractor = request.form.get("pdf_extractor")

        # Initialisiere das LLM
        llm = None
        query_engine = None
        if llm_selection == "openai":

            llm = OpenAI(model=model,temperature=0,streaming=True)

        elif llm_selection == llm_selection:
            llm = Ollama(
                model=model,
                temperature=0,
                max_tokens=None,
                max_retries=2,
                streaming=True
            )

        # Kontext sammeln und in der Session speichern
        if files:
            context = upload_file_method(files, pdf_extractor)
            session_key = f"{llm_selection}_context{chat_counter}"
            session[session_key] = session.get(session_key, "") + context
        else:
            context = session.get(f"{llm_selection}_context{chat_counter}", "")

        # Alte Nachrichten sammeln und in der Session speichern
        old_messages_key = f"{llm_selection}_old_messages{chat_counter}"
        old_messages_json_key = f"{llm_selection}_old_messages_json_{chat_counter}"

        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400

        # System- und Human-Prompt generieren
        system_prompt = get_system_prompt(system_prompt)
        human_query = get_human_prompt(prompt, context)
        human_msg = ChatMessage(role="user", content=human_query)
        add_value_to_session_list(old_messages_key, human_msg)
        messages = [
            ChatMessage(role="system", content=system_prompt),
        ]
        for msg in session.get(old_messages_key):
            messages.append(msg)

    # LLM-Response streamen
        result = ""
        response_generator = llm.stream_chat(messages)
        socketio.emit(f"{llm_selection}_stream{chat_counter}", {'content': "START_LLM_MESSAGE"})
        for response_chunk in response_generator:
            content = response_chunk.message.content
            result_chunk = content
            result = result_chunk
            socketio.emit(f"{llm_selection}_stream{chat_counter}", {'content': result_chunk})

        socketio.emit(f"{llm_selection}_stream{chat_counter}", {'content': "END_LLM_MESSAGE"})
        add_value_to_session_list(old_messages_key, ChatMessage(role="assistant", content=result))
        for msg in session.get(old_messages_key):
            add_value_to_session_list(old_messages_json_key, chat_message_to_json(msg))

        debug = {
            "messages": format_chat_messages(messages),
            "context": context,
        }

        debug_path = os.path.join(app.root_path, "debug", f"{llm_selection}_chat_{chat_counter}.txt")
        save_debug(debug_path, debug)

        return '', 200


def format_chat_messages(messages):
    formatted_messages = []
    for msg in messages:
        role = msg.role.value  # Zugriff auf den Rollenwert
        content = msg.content  # Zugriff auf den Nachrichteninhalt
        formatted_messages.append(f"{role.capitalize()}: {content}")
    return "\n------------------------------------------\n".join(formatted_messages)

def chat_messages_to_json(messages):
    messages_list = []
    for msg in messages:
        messages_list.append({
            "role": msg.role.value,
            "content": msg.content
        })
    return json.dumps(messages_list, indent=4)  # Ausgabe als JSON-String mit Einrückung für bessere Lesbarkeit

def chat_message_to_json(message):
    role, content = message
    msg = {
        "role": role,
        "content": content
    }
    return msg
