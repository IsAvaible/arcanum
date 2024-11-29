import mimetypes
import os
import re

from bs4 import BeautifulSoup
from langchain_openai import AzureChatOpenAI
from dotenv import load_dotenv

import hashlib

from app import app
from whisper import transcribe
from pdf import (
    create_text_chunks_pdfplumber,
)
from webdav import download_file_webdav

import json

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
    single_text = None
    whisper_prompt = ""


    for file in files:
        filepath = file["filepath"]
        mimetype = mimetypes.guess_type(filepath)
        file["mimetype"] = mimetype[0]


    #sort attachments so audio come last
    sorted_attachments = sorted(files, key=sort_attachments)

    for file in sorted_attachments:
        filepath = file["filepath"]
        filehash = file["filehash"]
        file_id = file["file_id"]
        filename = file["filename"]
        # download file to temp folder
        path = download_file_webdav(filepath, filename)
        mimetype = file["mimetype"]

        if allowed_file(filename):
            if "audio" in mimetype:
                transcription = transcribe(file, texts, llm, path, filename, whisper_prompt)
                single_text = transcription
                texts += "  " + single_text
            elif mimetype == "application/pdf":
                texts += f" Content of PDF File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                single_text = create_text_chunks_pdfplumber(path)
                texts += " " + single_text
            elif mimetype == "text/html":
                texts += f" Content of HTML File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                with open(path, "r", encoding="utf-8") as file:
                    contents = file.read()
                    soup = BeautifulSoup(contents)
                    texts += soup.get_text()
                    single_text = soup.get_text()
            elif mimetype == "text/plain":
                texts += f" Content of Text File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                with open(path, "r", encoding="utf-8") as file:
                    contents = file.read()
                    texts += contents
                    single_text = contents


            file_as_dict = {
                "filename": filename,
                "mimetype": mimetype,
                "filehash": filehash,
                "filepath": filepath,
                "file_id": file_id,
            }


            try:
                #transcription as json
                json_dict = json.loads(single_text)
                file_as_dict.update(json_dict)
            except ValueError:
                #if var is not json, append as text
                file_as_dict["content"] = single_text

            # HIER: CONTENT VON DATEIEN -> IN DATEI TEMPORÄR SPEICHERN

        files_as_dicts.append(file_as_dict)
        files_as_dicts_json = json.dumps(files_as_dicts, ensure_ascii=False)

        print(files_as_dicts_json)
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
