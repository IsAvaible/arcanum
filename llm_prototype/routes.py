from flask import render_template, request, Blueprint

from app import app
from ollama_local import ollama_models, prompt_question_ollama
from openai_api import openai_models, prompt_question_openai

routes = Blueprint('routes', __name__)


@app.route('/prompt', methods=['POST'])
def ask():
    if request.method == 'POST':
        if request.form.get("llm") == "openai":
            return prompt_question_openai(request)
        elif request.form.get("llm") == "ollama":
            return prompt_question_ollama(request)


@app.route('/openai', methods=['GET'])
def index_openai():
    return render_template('chat.html', models=openai_models, llm="openai")


@app.route('/ollama', methods=['GET'])
def index_local():
    return render_template('chat.html', models=ollama_models, llm="ollama")


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')
