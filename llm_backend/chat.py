import json
import re
import os

from flask import jsonify
from azure import get_llm, get_llm_custom
from app import sio
from sentence_transformers import CrossEncoder
import concurrent.futures
import time
import threading

from case import Case
from langchain_core.output_parsers import JsonOutputParser

cross_encoder = CrossEncoder('cross-encoder/msmarco-MiniLM-L6-en-de-v1', max_length=512)

def get_cross_encoder():
    return cross_encoder

def unique_contexts(contexts):
    unique_contexts = []
    unique_texts = []
    for context in contexts:
        if context.payload["text"] not in unique_texts:
            unique_contexts.append(context)
            unique_texts.append(context.payload["text"])
    return unique_contexts

def rerank_contexts(contexts, user_query, cross_encoder_model):
    sentence_pairs = [[user_query, hit.payload["text"]] for hit in contexts]
    similarity_scores = cross_encoder_model.predict(sentence_pairs)
    
    for idx in range(len(contexts)):
        contexts[idx].score = float(similarity_scores[idx])

    # Sort list by CrossEncoder scores in descending order
    contexts = sorted(contexts, key=lambda x: x.score, reverse=True)

    return contexts

def query_hyde(query, vectorstore):
    TIMEOUT_QUERY_HYDE = int(os.environ.get("TIMEOUT_QUERY_HYDE"))
    
    case_parser_json = JsonOutputParser(pydantic_object=Case)
    format_instructions = case_parser_json.get_format_instructions()
    prompt = "Generate a hypothetical document that thoroughly addresses or explains the following query or problem. The document should include relevant details, examples, and potential solutions to provide a comprehensive response:" \
            "If the answer is not known or clear, confidently create a plausible and logical response based on the context. The document must always provide an answer." \
            "Do not include any additional information, commentary, or explanations outside of the hypothetical document. Ensure the document is precise, well-structured, and complete." \
            "In the follwing user example you need to create a hypothetical case. A case is a problem someone had, that already has been solved." \
            f"{format_instructions}" \
            "MAKE YOUR ANSWER AS SHORT AS POSSIBLE" \
            "USE SAME LANGUAGE AS THE USER QUERY LANGUAGE"
    

    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": query}
    ]

    llm = get_llm_custom(temperature=0, max_tokens=300, timeout=4, max_retries=2, streaming=True)

    response_content = []
    stop_event = threading.Event()

    def stream_response():
        stream = llm.stream(messages)
        concatenated_tokens = ""
        for stream_token in stream:
            if stop_event.is_set():
                break  # Beendet den Thread sicher, wenn das Event gesetzt ist
            token = stream_token.content
            concatenated_tokens += token
            response_content.append(token)

    thread = threading.Thread(target=stream_response)
    thread.start()
    thread.join(timeout=TIMEOUT_QUERY_HYDE)  # Warte maximal TIMEOUT_QUERY_HYDE Sekunden auf den Thread # Wird verwendet, um den user nicht zu lange auf eine antwort warten zu lassen

    if thread.is_alive():
        stop_event.set()  # Signalisiert dem Thread, dass er stoppen soll
        thread.join()  # Warte darauf, dass der Thread sauber beendet wird

    response_text = ''.join(response_content)
    relevant_vectors = vectorstore.search_from_query(response_text, limit=5)
    return relevant_vectors

def query_multiple(query, vectorstore):
    prompt = "You are an AI language model assistant. Your task is to generate three different versions of the given user question to retrieve relevant documents from a vector database." \
            "By generating multiple perspectives on the user question, your goal is to help the user overcome some of the limitations of the distance-based similarity search." \
            "Provide these alternative questions separated by newlines." \
            "Original question: {question}"  

    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": query}
    ]

    llm = get_llm()
    response = llm(messages).content

    queries = response.split("\n")

    relevant_vectors = []
    for query in queries:
        relevant_vectors.extend(vectorstore.search_from_query(query, limit=2))
    return relevant_vectors

def query_standard(query, vectorstore):
    relevant_vectors = vectorstore.search_from_query(query, limit=5)
    return relevant_vectors

def timed(func):
    def _w(*a, **k):
        then = time.time()
        res = func(*a, **k)
        elapsed = time.time() - then
        return elapsed, res
    return _w

def ask_question(request, vectorstore):
    cross_encoder = get_cross_encoder()
    AMOUNT_DOCUMENTS_LLM = int(os.environ.get("AMOUNT_DOCUMENTS_LLM"))

    json_str = request.get_json(force=True)
    socket_id = json_str["socketId"]
    messages = json_str["context"]
    latest_user_message = json_str["message"]

    sio.emit('llm_message', {'message': 'Searching for relevant files...', 'socket_id': socket_id})

    messages.append({'role': 'user', 'content': latest_user_message})

    messages_only_role_content = transform_messages_for_llm(messages)

    if not latest_user_message:
        return jsonify({"error": "No user message found"}), 400

    standalone_question = transform_to_standalone_question(json.dumps(messages_only_role_content))

    relevant_vectors = []
    start_time_futures = time.time()
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_hyde = executor.submit(timed(query_hyde), standalone_question, vectorstore)
        future_multiple = executor.submit(timed(query_multiple), standalone_question, vectorstore)
        future_standard = executor.submit(timed(query_standard), standalone_question, vectorstore)        

        time_standard, relevant_vectors_standard = future_standard.result()
        time_hyde, relevant_vectors_hyde = future_hyde.result()
        time_multiple, relevant_vectors_multiple = future_multiple.result()
        print(f"Time for future_standard: {time_standard} seconds")
        print(f"Time for future_hyde: {time_hyde} seconds")
        print(f"Time for future_multiple: {time_multiple} seconds")

        relevant_vectors.extend(relevant_vectors_standard)
        relevant_vectors.extend(relevant_vectors_hyde)
        relevant_vectors.extend(relevant_vectors_multiple)

    print(f"Time for futures: {time.time() - start_time_futures} seconds")

    start_time_rerank = time.time()
    relevant_vectors = unique_contexts(relevant_vectors)
    reranked_vectors = rerank_contexts(relevant_vectors, standalone_question, cross_encoder)
    end_time_rerank = time.time()
    print(f"Time for reranking: {end_time_rerank - start_time_rerank} seconds")
    
    # only get the specified amount of documents
    contexts_for_llm = reranked_vectors[:AMOUNT_DOCUMENTS_LLM]

    replacement_dict = {}
    context = ""
    doc_number = 1
    for vector in contexts_for_llm:
        doc = vector.payload
        text = doc["text"]
        metadata = doc["metadata"]

        if metadata["inserttype"] == "case":
            text = f"Case content [doc_number:{doc_number}]:\n" + text
            replacement_dict[doc_number] = "case:" + str(metadata["case_id"])
        elif metadata["inserttype"] == "attachment-chunk":
            text = metadata["filename"] + f" [doc_number:{doc_number}]:\n" + text
            replacement_dict[doc_number] = "file:" + str(metadata["file_id"])

        doc_number += 1

        text += "\n\n---\n\n"

        context += text

    #print(f"Context: {context}")

    user_query = f"{latest_user_message}"

    llm = get_llm()

    prompt_messages = [
        {"role": "system",
         "content": "You are a helpful assistant. Answer user questions based solely on the provided context. "
                    "This context includes machine problem cases and their solutions, manuals, notes, transcribed and textualized video, audio, and image content, and other related documents. "
                    "Always respond in the same language as the user."
                    "Cite the context in your response using the format '[doc_number:number]', where 'number' is the document number provided in the context and 'doc_number' remaining constant for proper identification. "
                    "Do not combine citations from multiple documents (e.g., DO NOT write [doc_number:1:2]). Only one number per reference is allowed. Adhere to the specified citing format regardless of previous responses."
                    "Your primary goal is to provide the user the most relevant files so they can solve their problem."
                    "Prefer providing the user with relevant cases instead of attachments. If there are no relevant cases, provide the user with the relevant attachment(s)."
         },
        *messages_only_role_content,
        {"role": "system", "content": f"CONTEXT for next query: {context}"},
        {"role": "user", "content": user_query},
    ]
    stream = llm.stream(prompt_messages)

    concatenated_tokens = ""
    for stream_token in stream:
        token = stream_token.content
        concatenated_tokens += token
        edited_reponse = replace_doc_number(concatenated_tokens, replacement_dict)
        sio.emit('llm_message', {'message': edited_reponse, 'socket_id': socket_id})

    ai_message = replace_doc_number(edited_reponse, replacement_dict)
    sio.emit('llm_end', {'message': ai_message, 'socket_id': socket_id})

    msg = {
        "message": ai_message
    }
    return jsonify(msg), 200

def transform_to_standalone_question(chat_history):
    system_prompt = """
        You are an AI assistant. Your task is to transform the latest human message in the chat history into a standalone question that can be understood without the previous context and in the same language it is written in.
        
        For example, if the AI says "I am feeling tired" and the human says "Why", the question "Why" wouldn't be understandable without the context. It should be transformed to "Why are you feeling tired?".
        
        Here is the chat history:
        {chat_history}
        
        Please provide the standalone question based on the latest human message. DO NOT include anything else.
    """

    llm = get_llm()

    prompt = system_prompt.format(chat_history=chat_history)
    response = llm([{"role": "system", "content": prompt}]).content

    return response

def transform_messages_for_llm(messages):
    return [{'role': message['role'], 'content': message['content']} for message in messages]

def replace_doc_number(input_string, replacement_dict):
    # Define the regex pattern to match [doc_number:number]
    pattern = r'\[doc_number:(\d+)\]'

    # Function to determine the replacement string based on the number
    def replacement_function(match):
        number = match.group(1)
        return f"[{replacement_dict[int(number)]}]"

    # Use re.sub with a function to replace the pattern with the appropriate string
    result = re.sub(pattern, replacement_function, input_string)

    return result
