import os

from dotenv import load_dotenv
from flask import jsonify
from case import CaseArray, check_if_output_is_valid
from prompts import get_system_prompt
from upload import upload_file_method_production
import json

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureChatOpenAI

load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_GPT = os.getenv("AZURE_DEPLOYMENT_GPT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")



def start_quering_llm(invokedPrompt, llm, parser, max_tries=3) -> dict:
    """
    Queries the LLM with the given prompt template, LLM, and parser to generate a valid case.
    If the output is invalid (i.e., not in JSON format or missing some required parameters),
    the function re-queries the LLM until it gets a valid output or reaches the maximum number of retries.

    Returns:
        dict: The output case formatted as a Python dictionary if valid, otherwise returning an empty dict.
    """
    chain = llm | parser
    chain_output = chain.invoke(invokedPrompt)

    is_valid = False
    for try_number in range(1, max_tries + 1):
        is_valid = check_if_output_is_valid(chain_output)
        if is_valid:
            break
        else:
            llm.temperature += 0.1
            chain_output = chain.invoke(invokedPrompt)
            pass


    if not is_valid:
        print(f"Couldn't get valid output in {try_number} tries")
        return {}
    else:
        print(f"Generated valid ouput with {try_number} tries: {chain_output}")

    return chain_output


def generate_case_langchain_production(request):
    if request.method == "POST":
        json_str = request.get_json(force=True)
        attachments = json_str["attachments"]
        socket_id = json_str["socket_id"]
        prompt = "Please create metadata for a new case based on the Context provided and return them in JSON! Please try include all necessary information that the context has!"

        llm = AzureChatOpenAI(
            azure_endpoint=AZURE_ENDPOINT,
            azure_deployment=AZURE_DEPLOYMENT_GPT,
            openai_api_version=OPENAI_API_VERSION,
            temperature=0,
            max_tokens=None,
            timeout=None,
            max_retries=2,
            streaming=False,
        )

        context = upload_file_method_production(attachments, socket_id)

        system_prompt_langchain_parser = get_system_prompt("langchain_parser")
        case_parser_json = JsonOutputParser(pydantic_object=CaseArray)

        messages = [
            ("system", "{system_prompt}\n{format_instructions}"),
            ("human", "CONTEXT: {context}\n\nQUERY: {query}"),
        ]

        promptLangchain = ChatPromptTemplate.from_messages(messages).partial(
            system_prompt=system_prompt_langchain_parser,
            format_instructions=case_parser_json.get_format_instructions(),
        )
        promptLangchainInvoked = promptLangchain.invoke(
            {"context": context, "query": prompt}
        )

        response_dict = start_quering_llm(
            promptLangchainInvoked, llm, case_parser_json, max_tries=3
        )

        return jsonify(response_dict), 200

from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance
import numpy as np
from qdrant_client.models import PointStruct


def case_to_string(case_dict):
    case_string = ""
    for key in case_dict:
        value = case_dict[key]
        value = str(value)
        case_string += str(key.upper()) + ":\n" + str(value) + "\n\n"

    return case_string


from openai import AzureOpenAI



def vector_db_test(response_dict):
    if response_dict:
        cases_dict = json.loads(response_dict.data)["cases"]

    llm_embeddings = AzureOpenAI(
        azure_endpoint=AZURE_ENDPOINT,
        azure_deployment=AZURE_DEPLOYMENT_EMBEDDING,
        api_version=OPENAI_API_VERSION,
    )

    

    # Initialize Qdrant Client - Adjust with your Qdrant instance details
    client = QdrantClient(path="./test_db_qdrant")

    # Create a new collection
    collection_name = "my_collection"
    if not client.collection_exists(collection_name):
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )

    # Insert Embedding
    for case in cases_dict:
        case_string = case_to_string(case)
        # Generate Embedding
        case_embedding = llm_embeddings.embeddings.create(input=case_string,model="text-embedding-ada-002")
        case_embedding = case_embedding.data[0].embedding
        vector_size = len(case_embedding)

        client.upsert(
            collection_name=collection_name,
            points=[
                PointStruct(
                    vector=case_embedding,
                    payload={"text": case_string}  # Optional: Attach metadata
                )
            ]
        )       


    print("Embedding added to Qdrant collection.")


    return "t", 200