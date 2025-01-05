import os
import json
import mimetypes
import pdfplumber
from openai import AzureOpenAI
import re
from dotenv import load_dotenv

from webdav import check_if_cached,download_file_webdav, download_cache
from upload import upload_file_method_production
from readwrite import read_from_file


load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_GPT = os.getenv("AZURE_DEPLOYMENT_GPT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
AZURE_DEPLOYMENT_WHISPER = os.getenv("AZURE_DEPLOYMENT_WHISPER")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")


def process_attachment(file):
    mimetype = file["mimetype"]
    filepath = file["filepath"]
    filehash = file["filehash"]
    file_id = file["id"] if "id" in file else file["file_id"]
    filename = file["filename"]

    path = download_cache(filehash)
    content_of_file = read_from_file(path)

    file_dict1 = json.loads(file_json)



    if "audio" in mimetype:
        file_dict = {
            "type": "audio",
            "content": transcription,
        }
    elif "application/pdf" in mimetype:

        file_dict = {
            "type": "pdf",
            "content": text,
        }
    elif "text/html" in mimetype:
        file_dict = {
            "type": "html",
            "content": None,
        }
    elif "text/plain" in mimetype:
        file_dict = {
            "type": "text",
            "content": contents,
        }
        

    file_dict["file_id"] = file_id
    file_dict["filename"] = filename
    file_dict["filepath"] = filepath
    file_dict["filehash"] = filehash
    file_dict["chunks"] = chunk_text(file_dict["content"])

    return file_dict


def process_pdf(filepath):
    """
    Process a PDF file and extract its text content as a list of pages.
    
    Args:
        filepath (str): The path to the PDF file.
    
    Returns:
        list: A list of text content for each page.
    """
    try:
        with pdfplumber.open(filepath) as pdf:
            pages = [page.extract_text() for page in pdf.pages]
        return pages
    except Exception as e:
        print(f"Error processing PDF file: {e}")
        return None


def chunk_text(text, chunk_size=2000, overlap=700):
    """
    Chunk the input text into smaller pieces with a specified chunk size and overlap,
    ensuring that chunks do not end in the middle of a sentence.
    
    Args:
        text (str): The input text to chunk.
        chunk_size (int): The size of each chunk.
        overlap (int): The number of overlapping characters between chunks.
    
    Returns:
        list: A list of text chunks.
    """

    def find_sentence_end(text, start, end):
        sentence_endings = list(re.finditer(r'[.!?]', text[start:end]))
        if sentence_endings:
            return sentence_endings[-1].end() + start
        return end

    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = min(start + chunk_size, text_length)
        end = find_sentence_end(text, start, end)
        chunks.append(text[start:end].strip())
        start = end - overlap
        if end == text_length:
            break
    
    return chunks
