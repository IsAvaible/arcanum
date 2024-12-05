import mimetypes
import os

from bs4 import BeautifulSoup
from langchain_openai import AzureChatOpenAI
from dotenv import load_dotenv

from readwrite import write_to_file, read_from_file, text_to_dict
from webdav import check_if_cached, download_cache, upload_cache_file
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
    single_dict = {}
    files_as_dicts_json = ""
    texts = ""
    single_text = None
    whisper_prompt = ""
    # SET TRUE IF CACHING SHOULD BE ACTIVATED -> FALSE IF NOT
    USE_CACHE = True

    for file in files:
        print (file)
        filepath = file["filepath"]
        mimetype = mimetypes.guess_type(filepath)
        file["mimetype"] = mimetype[0]


    #sort attachments so audio come last
    sorted_attachments = sorted(files, key=sort_attachments)

    for file in sorted_attachments:
        filepath = file["filepath"]
        filehash = file["filehash"]
        file_id = file["id"] if "id" in file else file["file_id"]
        filename = file["filename"]
        # download file to temp folder
        path = download_file_webdav(filepath, filename)
        mimetype = file["mimetype"]

        is_cached = check_if_cached(filehash)

        if allowed_file(filename) and (not is_cached or not USE_CACHE):
            if "audio" in mimetype:
                transcription = transcribe(file, texts, llm, path, filename, whisper_prompt)
                single_dict = transcription
                texts += "  " + json.dumps(single_text, ensure_ascii=False)
            elif mimetype == "application/pdf":
                texts += f" Content of PDF File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                single_text = create_text_chunks_pdfplumber(path)
                single_dict = {
                    "type": "pdf",
                    "text": single_text
                }
                texts += " " + single_text
            elif mimetype == "text/html":
                texts += f" Content of HTML File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                with open(path, "r", encoding="utf-8") as file:
                    contents = file.read()
                    soup = BeautifulSoup(contents)
                    texts += soup.get_text()
                    single_text = soup.get_text()
                single_dict = {
                    "type": "html",
                    "text": single_text
                }
            elif mimetype == "text/plain":
                texts += f" Content of Text File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                with open(path, "r", encoding="utf-8") as file:
                    contents = file.read()
                    texts += contents
                    single_text = contents
                single_dict = {
                    "type": "txt",
                    "text": single_text
                }

        ### CACHE TO MINIMIZE AZURE API CALLS
        if is_cached and USE_CACHE:
            print("USING CACHE")
            cache_path = download_cache(filehash) # download cache file
            txt = read_from_file(cache_path) # read cache file
            content_dict = text_to_dict(txt) # file to dict
        else:
            print("NOT USING CACHE")
            #content_dict = {"content": single_dict}
            content_dict = single_dict
            # write file to cache
            file_path = write_to_file(filehash, json.dumps(content_dict, ensure_ascii=False, indent=2))
            upload_cache_file(file_path, filehash)


        file_as_dict = {
            "filename": filename,
            "mimetype": mimetype,
            "filehash": filehash,
            "filepath": filepath,
            "file_id": file_id,
        }

        try:
            file_as_dict.update(content_dict)
        except ValueError:
            file_as_dict["content"] = single_text

        files_as_dicts.append(file_as_dict)
        files_as_dicts_json = json.dumps(files_as_dicts, ensure_ascii=False)

        print("file_as_dict")
        print(files_as_dicts_json)
        print("file_as_dict END")
    return files_as_dicts_json


