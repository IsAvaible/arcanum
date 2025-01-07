import os

from dotenv import load_dotenv
from flask import jsonify
from langchain_chroma import Chroma
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings

from prompts import get_system_prompt

load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_GPT = os.getenv("AZURE_DEPLOYMENT_GPT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")


def chat(request):
    if request.method == "POST":
        prompt = request.form.get("prompt")

        if not prompt:
            return jsonify({"error": "No prompt provided"}), 400

        #chat_counter = request.form.get("chat_counter")

        llm = AzureChatOpenAI(
            azure_endpoint=AZURE_ENDPOINT,
            azure_deployment=AZURE_DEPLOYMENT_GPT,
            openai_api_version=OPENAI_API_VERSION,
            temperature=0,
            max_tokens=None,
            timeout=None,
            max_retries=2,
            streaming=True,
        )

        embedding_function = AzureOpenAIEmbeddings(
            azure_endpoint=AZURE_ENDPOINT,
            azure_deployment=AZURE_DEPLOYMENT_EMBEDDING,
            api_version=OPENAI_API_VERSION,
        )
        vector_store = Chroma(
            persist_directory=".chromadb/", embedding_function=embedding_function
        )
        # GET OLD MSGS
        old_messages = []  ## from backend

        if old_messages:
            all_msgs = "\n".join(x[1] for x in old_messages)
            old_msgs = [
                ("system", get_system_prompt("old_msgs")),
                ("human", all_msgs + "That is the latest user query: " + prompt),
            ]
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
        human_query_tup_with_context = (
            "human",
            "Please take this as input data: " + context,
        )

        messages = [
            ("system", get_system_prompt("chat")),
        ]
        # Alle Nachrichten hinzufügen
        if old_messages:
            for msg in old_messages:
                messages.append(msg)

        messages.append(human_query_tup_with_context)
        messages.append(human_query_tup_without_context)

        # LLM-Response streamen
        result = ""
        response_generator = llm.stream(messages)

        for response_chunk in response_generator:
            result_chunk = response_chunk.content
            result += result_chunk


        return "", 200


def chat_message_to_json(message):
    role, content = message
    content = content.strip('"')
    msg = {"role": role, "content": content}
    return msg
