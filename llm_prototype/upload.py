import re
from pathlib import Path
from openai import OpenAI

from bs4 import BeautifulSoup
from flask import Blueprint
from werkzeug.utils import secure_filename

import hashlib

from app import app
from embeddings import create_embeddings
from pdf import *

import json

upload = Blueprint('upload', __name__)
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'html', 'mp3', "wav"}


def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_file_method(files, pdf_extractor, llm, chat_id):
    files_as_dicts = []
    file_as_dict = {}
    files_as_dicts_json = ""
    texts = ""
    single_text = ""
    for file in files:
        if file:
            if allowed_file(file.filename):
                filename = secure_filename(file.filename)
                path = os.path.join(app.root_path, os.path.join(app.config['UPLOAD_FOLDER'], filename))
                mimetype = file.content_type
                file.save(path)
                clean_filename_str = clean_filename(Path(path).stem)
                if mimetype == "audio/mpeg":
                    texts += "Content of Audio File: " + clean_filename_str + ": "
                    client = OpenAI()
                    audio_file = open(path, "rb")
                    transcription = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="verbose_json"
                    )
                    texts += transcription.text
                    single_text = transcription.text


                elif mimetype == 'application/pdf':
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
                    with open(path, 'r', encoding="utf-8") as file:
                        contents = file.read()
                        soup = BeautifulSoup(contents)
                        texts += soup.get_text()
                        single_text = soup.get_text()
                elif mimetype == "text/plain":
                    texts = "Content of Text File: " + clean_filename_str + ": "
                    with open(path, 'r', encoding="utf-8") as file:
                        contents = file.read()
                        texts += contents
                        single_text = contents
                
                file_as_dict = {
                    "filename": filename,
                    "mimetype": mimetype,
                    "content": single_text,
                }
                
                create_embeddings(single_text, llm, filename,chat_id)
        files_as_dicts.append(file_as_dict)
        files_as_dicts_json = json.dumps(files_as_dicts, ensure_ascii=False)
            
    return files_as_dicts_json


def clean_filename(filepath):
    # Get the filename without the path
    filename = os.path.basename(filepath)
    # Replace disallowed special characters with blanks
    clean_name = re.sub(r'[^a-zA-Z0-9]', ' ', filename)
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
    hash_file_path = os.path.join(app.config['UPLOAD_FOLDER'], "hashvalues.txt")
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
