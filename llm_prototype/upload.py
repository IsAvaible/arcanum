import os

from flask import Blueprint
from werkzeug.utils import secure_filename

import hashlib

from app import app
from embeddings import create_embeddings, get_embeddings
from pdf import *

upload = Blueprint('upload', __name__)
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}


def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_file_method(files, pdf_extractor):
    texts = ""
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            path = app.root_path +"\\"+ os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(path)
            mimetype = file.content_type
            if mimetype == 'application/pdf':
                #if store_hash(file) == True:
                if pdf_extractor == "pypdfloader":
                    texts += " " + create_text_chunks_pypdfloader(path)
                if pdf_extractor == "pdfplumber":
                    texts += " " + create_text_chunks_pdfplumber(path)
                if pdf_extractor == "pdfreader":
                    texts += " " + create_text_chunks_pdfreader(path)
                if pdf_extractor == "ocr":
                    texts += " " + create_text_chunks_ocr(path)


    return texts




# ZURZEIT KEINE FUNKTION
def upload_file_method_vectordb(files, pdf_extractor, llm, vector_id):
    texts = ""
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)

            path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(path)
            mimetype = file.content_type
            if mimetype == 'application/pdf':
                if store_hash(file) == True:
                    if pdf_extractor == "pypdfloader":
                        texts = create_text_chunks_pypdfloader(path)
                    if pdf_extractor == "pdfplumber":
                        texts = create_text_chunks_pdfplumber(path)
                    if pdf_extractor == "pdfreader":
                        texts = create_text_chunks_pdfreader(path)
                    if pdf_extractor == "ocr":
                        texts = create_text_chunks_ocr(path)
                    chunks = (process_pdf(texts, llm))
                    return create_embeddings(chunks, llm, vector_id)
                else:
                    return get_embeddings(llm, vector_id)


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
