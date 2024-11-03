import os

from flask import jsonify, Blueprint, render_template, session
from langchain_chroma.vectorstores import Chroma
from langchain_ollama import ChatOllama
from langchain_openai import OpenAIEmbeddings, ChatOpenAI

from llm_prototype.app import app
from llm_prototype.debug import save_debug
from prompts import system_prompt_json, system_prompt_normal, get_system_prompt, get_human_prompt
from llm_prototype.session import add_value_to_session_list
from text import *
from upload import upload_file_method_vectordb, upload_file_method

vector_store = None
openai_models = ['gpt-3.5-turbo-0125', 'gpt-4o-mini', 'gpt-3.5-turbo-1106', 'gpt-4o']

llm = Blueprint('llm', __name__)


def prompt_question(request, llm_selection):
    if request.method == 'POST':
        llm = None
        # form values
        files = request.files.getlist("file")
        model = request.form.get("model")
        prompt = request.form.get("prompt")


        chat_counter = request.form.get("chat_counter")
        system_prompt = request.form.get("system_prompt")
        pdf_extractor = request.form.get("pdf_extractor")

        if llm_selection == "openai":
            llm = ChatOpenAI(
                model=model,
                temperature=0,
                max_tokens=None,
                timeout=None,
                max_retries=2,
            )
        elif llm_selection == llm_selection+"":
            llm = ChatOllama(
                model=model,
                num_threads=20,
                temperature=0.2,
                num_predict=4096,
            )

        if files:
            context = upload_file_method(files, pdf_extractor)
            if llm_selection+"_context"+str(chat_counter) not in session:
                session[llm_selection+"_context"+str(chat_counter)] = context
            else:
                session[llm_selection+"_context"+str(chat_counter)] += context
        else:
            print("NOFILES")
            context = session[llm_selection+"_context"+str(chat_counter)]


        old_messages = session[llm_selection+"_old_messages"+str(chat_counter)]
        old_messages_string = '\n'.join(old_messages)

        add_value_to_session_list(llm_selection+"_old_messages" + str(chat_counter), prompt)

        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400
        else:

            system_prompt = get_system_prompt(system_prompt)

            human_query = get_human_prompt(old_messages_string, prompt, context)
            print("HUMAN_QUERY "+human_query)
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
            add_value_to_session_list(llm_selection+"_old_messages" + str(chat_counter), result)

            ## DEBUG
            debug = {
                "context": context,
                "old_messages": session[llm_selection+"_old_messages" + str(chat_counter)],
                "human_query": human_query,
            }
            path = app.root_path +"\\"+ os.path.join("debug", llm_selection+"_chat_"+str(chat_counter)+".txt")
            save_debug(path, debug)


            return result, 200
