import re

from flask import jsonify

from azure import get_llm
from app import sio


def ask_question(request, vectorstore):
    json_str = request.get_json(force=True)
    socket_id = json_str["socketId"]
    messages = json_str["context"]
    latest_user_message = json_str["message"]

    messages_only_role_content = transform_messages_for_llm(messages)

    if not latest_user_message:
        return jsonify({"error": "No user message found"}), 400

    standalone_question = transform_to_standalone_question(json.dumps(messages_only_role_content))
    relevant_vectors = vectorstore.search_from_query(standalone_question)

    replacement_dict = {}
    context = ""
    doc_number = 1
    for vector in relevant_vectors:
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

    user_query = f"{latest_user_message}"

    llm = get_llm()

    # Use the history from json_str
    prompt_messages = [
        {"role": "system",
         "content": "You are a helpful assistant. Answer user questions based solely on the provided context. "
                    "This context includes machine problem cases and their solutions, manuals, notes, transcribed and textualized video, audio, and image content, and other related documents. "
                    "Always respond in the same language as the user."
                    "Cite the context in your response using the format '[doc_number:number]', where 'number' is the document number provided in the context and 'doc_number' remaining constant for proper identification. "
                    "Do not combine citations from multiple documents (e.g., DO NOT write [doc_number:1:2]). Only one number per reference is allowed. Adhere to the specified citing format regardless of previous responses."
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
    return [{'role': message['role'], 'content': message['content']} for message in messages[:-1]]



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
