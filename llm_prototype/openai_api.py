from flask import jsonify, Blueprint, render_template, session
from langchain_chroma.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI

from config import system_prompt_json, system_prompt_normal, get_system_prompt, get_human_prompt
from text import *
from upload import upload_file_method

vector_store = None
openai_models = ['gpt-3.5-turbo-0125', 'gpt-4o-mini', 'gpt-3.5-turbo-1106', 'gpt-4o']

openai = Blueprint('gpt', __name__)

llm_selection = "gpt"


def prompt_question_openai(request):


    if request.method == 'POST':
        files = request.files.getlist("file")
        model = request.form.get("model")
        vector_id = request.form.get("vector_id")
        session["vector_id"] = vector_id
        system_prompt = request.form.get("system_prompt")

        if vector_id not in session:
            session[vector_id] = ""

        llm = ChatOpenAI(
            model=model,
            temperature=0,
            max_tokens=None,
            timeout=None,
            max_retries=2,
        )

        pdf_extractor = request.form.get("pdf_extractor")
        if files:
            vector_store = upload_file_method(files, pdf_extractor, "openai", vector_id)

        prompt = request.form['prompt']
        session[vector_id] += prompt + ". "
        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400
        else:
            if vector_store is None:
                vector_store = Chroma(
                    persist_directory=".chromadb/",
                    collection_name=vector_id,
                    embedding_function=OpenAIEmbeddings(model='text-embedding-3-large'),
                )

            embedding_model = OpenAIEmbeddings(model='text-embedding-3-large')
            query_embedding = embedding_model.embed_query(prompt)
            similar_texts = vector_store.similarity_search_by_vector(embedding=query_embedding, k=30)
            context = "\n".join([text.page_content for text in similar_texts])

            old_data = " "+session[vector_id]+". "

            print(old_data)

            system_prompt = get_system_prompt(system_prompt)
            human_query = get_human_prompt(old_data, prompt, context)

            print("HUMAN:" + human_query)

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
            print(response.content)
            result = replace_triple_quotes_with_pre(response.content)
            result = replace_one_quote_with_pre(result)
            #session[vector_id] += response.content
            return result, 200
    elif request.method == 'GET':
        return render_template('chat.html', models=openai_models)
