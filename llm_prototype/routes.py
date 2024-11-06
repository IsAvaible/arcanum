import json
import os

import requests
from flask import render_template, request, Blueprint, session
from app import app

from langchain_llm import openai_models, prompt_question_socket_langchain
from llm_prototype.llamaindex_llm import prompt_question_socket_llamaindex

routes = Blueprint('routes', __name__)


@app.route('/promptsocket', methods=['POST'])
def ask_socket():
    if request.method == 'POST':
            llm = request.form.get("llm")
            framework = request.form.get("llm_framework")
            if framework == "langchain":
                return prompt_question_socket_langchain(request, llm)
            if framework == "llamaindex":
                return prompt_question_socket_llamaindex(request, llm)



@app.route('/openai', methods=['GET'])
def index_openai():

    old_messages = []
    chat_counter = request.args.get("chat_id")
    if chat_counter is None:
        if "openai_chat_counter" not in session:
            session["openai_chat_counter"] = 0
        else:
            chat_counter = session["openai_chat_counter"]
            session["openai_chat_counter"] = chat_counter+1

    if "openai_old_messages_json_"+str(chat_counter) not in session:
        session["openai_old_messages_json_"+str(chat_counter)] = []
    else:
        old_messages = session["openai_old_messages_json_"+str(chat_counter)]


    if "openai_old_messages"+str(chat_counter) not in session:
        session["openai_old_messages"+str(chat_counter)] = []

    return render_template('chat.html', models=openai_models, llm="openai", old_messages=old_messages, chat_counter=chat_counter)


@app.route('/ollama', methods=['GET'])
def index_local():
    ollama_models = get_ollama_models()
    old_messages = []
    chat_counter = request.args.get("chat_id")
    if chat_counter is None:
        if "ollama_chat_counter" not in session:
            session["ollama_chat_counter"] = 0
        else:
            chat_counter = session["ollama_chat_counter"]
            session["ollama_chat_counter"] = chat_counter+1

    if "ollama_old_messages_json_"+str(chat_counter) not in session:
        session["ollama_old_messages_json_"+str(chat_counter)] = []
    else:
        old_messages = session["ollama_old_messages_json_"+str(chat_counter)]


    if "ollama_old_messages"+str(chat_counter) not in session:
        session["ollama_old_messages"+str(chat_counter)] = []

    return render_template('chat.html', models=ollama_models, llm="ollama", old_messages=old_messages, chat_counter=chat_counter)


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


def get_ollama_models():
    ollama_models = []
    try:
        url = "http://"+os.getenv("OLLAMA_HOST")+"/api/tags"
        response = requests.get(url)
        if response.status_code == 200:
            ollama_models = [model["name"] for model in response.json()["models"]]
        else:
            ollama_models = []
    except requests.exceptions.RequestException as e:
        ollama_models = []
    return ollama_models