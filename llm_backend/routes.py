import json
import os

import requests
from flasgger import swag_from
from flask import render_template, request, Blueprint, session
from app import app

from langchain_llm import openai_models, generate_case_langchain, chat

routes = Blueprint('routes', __name__)


@app.route('/generate', methods=['POST'])
def generate():
    if request.method == 'POST':
        return generate_case_langchain(request)


@app.route('/chat', methods=['POST'])
def chat_langchain():
    if request.method == 'POST':
        return chat(request)


@app.route('/chatbot', methods=['POST'])
def ask_socket():
    if request.method == 'POST':
        return generate_case_langchain(request)


@app.route('/openai', methods=['GET'])
def index_openai():

    old_messages = []
    chat_counter = request.args.get("chat_id")
    if chat_counter is None:
        if "chat_counter" not in session:
            session["chat_counter"] = 0
        else:
            chat_counter = session["chat_counter"]
            session["chat_counter"] = chat_counter+1

    if "old_messages_json_"+str(chat_counter) not in session:
        session["old_messages_json_"+str(chat_counter)] = []
    else:
        old_messages = session["old_messages_json_"+str(chat_counter)]


    if "old_messages"+str(chat_counter) not in session:
        session["old_messages"+str(chat_counter)] = []

    return render_template('chat.html', models=openai_models, old_messages=old_messages, chat_counter=chat_counter)

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')
