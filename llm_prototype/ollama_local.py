import os

import requests
from flask import jsonify, Blueprint, session, render_template
from langchain_chroma.vectorstores import Chroma
from langchain_ollama import ChatOllama
from langchain_ollama.embeddings import OllamaEmbeddings
from config import system_prompt_json, system_prompt_normal, get_system_prompt, get_human_prompt
from text import *
from upload import upload_file_method

ollama = Blueprint('ollama', __name__)

vector_store = None
ollama_models = []
try:
    url = "http://"+os.environ.get("OLLAMA_HOST")+"/api/tags"
    response = requests.get(url)
    if response.status_code == 200:
        ollama_models = [model["name"] for model in response.json()["models"]]
    else:
        ollama_models = []
except requests.exceptions.RequestException as e:
    ollama_models = []
    print(e)


def prompt_question_ollama(request):
    if request.method == 'POST':
        files = request.files.getlist("file")
        model = request.form.get("model")
        #vector_id = request.form.get("vector_id")
        #session["vector_id"] = vector_id
        system_prompt = request.form.get("system_prompt")

        #if vector_id not in session:
        #    session[vector_id] = ""

        llm = ChatOllama(
            model=model,
            num_threads=20,
            temperature=0.7,
            num_predict=4096,
        )
        pdf_extractor = request.form.get("pdf_extractor")
        if files:
            vector_store = upload_file_method(files, pdf_extractor, "ollama", vector_id)

        prompt = request.form['prompt']
        session[vector_id] += prompt
        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400
        else:
            if vector_store is None:
                vector_store = Chroma(
                    persist_directory=".chromadb/",
                    collection_name=vector_id,
                    embedding_function=OllamaEmbeddings(model='mxbai-embed-large'),
                )

            embedding_model = OllamaEmbeddings(model='mxbai-embed-large')
            query_embedding = embedding_model.embed_query(prompt)
            similar_texts = vector_store.similarity_search_by_vector(embedding=query_embedding, k=20)
            context = "\n".join([text.page_content for text in similar_texts])

            old_data = session[vector_id]


            system_prompt = get_system_prompt(system_prompt)
            human_query = get_human_prompt(old_data, prompt, context)

            messages = [
                (
                    "system",
                    system_prompt
                ),
                (
                    "human",
                    human_query
                ),
            ]

            response = llm.invoke(messages)
            result = replace_triple_quotes_with_pre(response.content)
            result = replace_one_quote_with_pre(result)
            session[vector_id] += response.content
            return result, 200

    elif request.method == 'GET':
        return render_template('chat.html', models=ollama_models)