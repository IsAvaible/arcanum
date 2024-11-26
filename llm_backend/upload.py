import mimetypes
import os
import re
from pathlib import Path

from bs4 import BeautifulSoup
from flask import Blueprint
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureChatOpenAI
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

import hashlib

from app import app
from embeddings import create_embeddings
from llm_backend.pdf import (
    create_text_chunks_pdfplumber,
    create_text_chunks_pypdfloader,
    create_text_chunks_pdfreader,
    create_text_chunks_ocr,
)
from llm_backend.prompts import get_system_prompt
from llm_backend.webdav import download_file_webdav
from langchain_core.documents.base import Blob
from langchain_community.document_loaders.parsers.audio import AzureOpenAIWhisperParser

import json

upload = Blueprint("upload", __name__)
ALLOWED_EXTENSIONS = {"txt", "pdf", "html", "mp3", "wav"}

load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_GPT = os.getenv("AZURE_DEPLOYMENT_GPT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT_WHISPER")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")



def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def sort_attachments(item):
    if item["mimetype"] == "application/pdf":
        return 0
    elif item["mimetype"] == "audio/mpeg":
        return 2
    return 1

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

def upload_file_method_production(files, pdf_extractor):
    files_as_dicts = []
    file_as_dict = {}
    files_as_dicts_json = ""
    texts = ""
    single_text = ""
    whisper_prompt = ""

    for file in files:
        filepath = file["filepath"]
        mimetype = mimetypes.guess_type(filepath)
        file["mimetype"] = mimetype[0]

    sorted_attachments = sorted(files, key=sort_attachments)
    print(sorted_attachments)

    for file in sorted_attachments:
        filepath = file["filepath"]
        filename = file["filename"]
        path = download_file_webdav(filepath, filename)
        mimetype = file["mimetype"]

        if allowed_file(filename):
            if mimetype == "audio/mpeg":
                #texts not empty, try to get model numbers etc.
                if texts != "":
                    system_prompt_langchain_parser = get_system_prompt("models")
                    messages = [
                        ("system", "{system_prompt}"),
                        ("human", "CONTEXT: {context}"),
                    ]
                    promptLangchain = ChatPromptTemplate.from_messages(messages).partial(
                        system_prompt=system_prompt_langchain_parser
                    )
                    promptLangchainInvoked = promptLangchain.invoke(
                        {"context": texts, "query": "Please give me the list back!"}
                    )
                    chain = llm
                    response = chain.invoke(promptLangchainInvoked)
                    whisper_prompt = response.content

                texts += " Content of Audio File: " + filename + ": "
                # audio_file = open(path, "rb")
                audio_blob = Blob(path=path)

                # Set up AzureChatOpenAI with the required configurations
                parser = AzureOpenAIWhisperParser(
                    azure_endpoint=AZURE_ENDPOINT,
                    deployment_name=AZURE_DEPLOYMENT,
                    api_version=OPENAI_API_VERSION,
                    prompt=whisper_prompt
                )
                # Assuming the client has a method to handle audio transcription similar to the OpenAI client
                transcription_documents = parser.parse(blob=audio_blob)
                # texts += transcription['text']
                single_text = transcription_documents[0].page_content
            elif mimetype == "application/pdf":
                # if store_hash(file) == True:
                texts += " Content of PDF File: " + filename + ": "
                single_text = create_text_chunks_pdfplumber(path)
                texts += " " + single_text
            elif mimetype == "text/html":
                texts += " Content of HTML File: " + filename + ": "
                with open(path, "r", encoding="utf-8") as file:
                    contents = file.read()
                    soup = BeautifulSoup(contents)
                    texts += soup.get_text()
                    single_text = soup.get_text()
            elif mimetype == "text/plain":
                texts += " Content of Text File: " + filename + ": "
                with open(path, "r", encoding="utf-8") as file:
                    contents = file.read()
                    texts += contents
                    single_text = contents

            file_as_dict = {
                "filename": filename,
                "mimetype": mimetype,
                "content": single_text,
            }

            # create_embeddings(single_text, filename, 0)
            # HIER: CONTENT VON DATEIEN -> IN DATEI TEMPORÄR SPEICHERN

        files_as_dicts.append(file_as_dict)
        files_as_dicts_json = json.dumps(files_as_dicts, ensure_ascii=False)

    return files_as_dicts_json


def upload_file_method(files, pdf_extractor, chat_id):
    files_as_dicts = []
    file_as_dict = {}
    files_as_dicts_json = ""
    texts = ""
    single_text = ""
    for file in files:
        if file:
            if allowed_file(file.filename):
                filename = secure_filename(file.filename)
                path = os.path.join(
                    app.root_path, os.path.join(app.config["UPLOAD_FOLDER"], filename)
                )
                mimetype = file.content_type
                file.save(path)
                clean_filename_str = clean_filename(Path(path).stem)
                if mimetype == "audio/mpeg":
                    texts += "Content of Audio File: " + clean_filename_str + ": "
                    # audio_file = open(path, "rb")
                    audio_blob = Blob(path=path)

                    # Set up AzureChatOpenAI with the required configurations
                    parser = AzureOpenAIWhisperParser(
                        azure_endpoint=AZURE_ENDPOINT,
                        deployment_name=AZURE_DEPLOYMENT,
                        api_version=OPENAI_API_VERSION,
                    )

                    # Assuming the client has a method to handle audio transcription similar to the OpenAI client
                    transcription_documents = parser.parse(blob=audio_blob)
                    # texts += transcription['text']
                    single_text = transcription_documents[0].page_content

                elif mimetype == "application/pdf":
                    # if store_hash(file) == True:
                    texts = "Content of PDF File: " + clean_filename_str + ": "
                    if pdf_extractor == "pypdfloader":
                        single_text = create_text_chunks_pypdfloader(path)
                        texts += " " + single_text
                    if pdf_extractor == "pdfplumber":
                        single_text = create_text_chunks_pdfplumber(path)
                        texts += " " + single_text
                    if pdf_extractor == "pdfreader":
                        single_text = create_text_chunks_pdfreader(path)
                        texts += " " + single_text
                    if pdf_extractor == "ocr":
                        single_text = create_text_chunks_ocr(path)
                        texts += " " + single_text
                elif mimetype == "text/html":
                    texts = "Content of HTML File: " + clean_filename_str + ": "
                    with open(path, "r", encoding="utf-8") as file:
                        contents = file.read()
                        soup = BeautifulSoup(contents)
                        texts += soup.get_text()
                        single_text = soup.get_text()
                elif mimetype == "text/plain":
                    texts = "Content of Text File: " + clean_filename_str + ": "
                    with open(path, "r", encoding="utf-8") as file:
                        contents = file.read()
                        texts += contents
                        single_text = contents

                file_as_dict = {
                    "filename": filename,
                    "mimetype": mimetype,
                    "content": single_text,
                }

                create_embeddings(single_text, filename, chat_id)
        files_as_dicts.append(file_as_dict)
        files_as_dicts_json = json.dumps(files_as_dicts, ensure_ascii=False)

    return files_as_dicts_json


def clean_filename(filepath):
    # Get the filename without the path
    filename = os.path.basename(filepath)
    # Replace disallowed special characters with blanks
    clean_name = re.sub(r"[^a-zA-Z0-9]", " ", filename)
    return clean_name


### FÜR SPÄTER EVTL
### SORGT DAFÜR DAS DATEIEN NUR EINMAL HOCHGELADEN WERDEN
def generate_file_hash(file_storage):
    """Generate SHA-256 hash for a file uploaded via Flask (FileStorage)."""
    sha256_hash = hashlib.sha256()
    file_storage.stream.seek(0)  # Ensure we're at the start of the file
    for chunk in iter(lambda: file_storage.stream.read(4096), b""):
        sha256_hash.update(chunk)
    file_storage.stream.seek(0)  # Reset stream position after reading
    return sha256_hash.hexdigest()


def store_hash(file_storage):
    """Check if hash exists in file, otherwise add it to the list."""
    hash_value = generate_file_hash(file_storage)
    hash_file_path = os.path.join(app.config["UPLOAD_FOLDER"], "hashvalues.txt")
    # Read existing hashes if the file exists
    try:
        with open(hash_file_path, "r") as hash_file:
            existing_hashes = hash_file.read().splitlines()
    except FileNotFoundError:
        existing_hashes = []

    # Append the new hash if it's not already in the list
    if hash_value not in existing_hashes:
        with open(hash_file_path, "a") as hash_file:
            hash_file.write(f"{hash_value}\n")
        return True
    else:
        return False
