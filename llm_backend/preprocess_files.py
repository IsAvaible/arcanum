import json
import re

import pdfplumber

from readwrite import read_from_file
from webdav import download_cache


def process_attachment(file):
    mimetype = file["mimetype"]
    filehash = file["filehash"]
    file_id = file["id"] if "id" in file else file["file_id"]

    path = download_cache(filehash)
    content_of_file = read_from_file(path)
    file_dict = json.loads(content_of_file)
    file_dict["file_id"] = file_id

    if "audio" in mimetype:
        text = ""
        for segment in file_dict["content"]["transcription"]["segments"]:
            text += segment["transcription_text"]
        file_dict["vectorstore-text"] = text

    elif "image" in mimetype:
        file_dict["vectorstore-text"] = file_dict["content"]["image"]

    elif "video" in mimetype:
        text = "TRANSCRIPTION: "
        for segment in file_dict["content"]["transcription"]["segments"]:
            text += segment["transcription_text"]
        text += "VIDEO DESCRIPTION: "
        for segment in file_dict["content"]["video_summary"]["segments"]:
            text += segment["content"]
        file_dict["vectorstore-text"] = text

    elif "pdf" in mimetype:
        file_dict["vectorstore-text"] = file_dict["content"]["text"]

    elif "html" in mimetype:
        file_dict["vectorstore-text"] = file_dict["content"]["text"]

    elif "plain" in mimetype:
        file_dict["vectorstore-text"] = file_dict["content"]["text"]

    file_dict["chunks"] = chunk_text(file_dict["vectorstore-text"])

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
        if end == text_length:
            chunks.append(text[start:end].strip())
            break
        end = find_sentence_end(text, start, end)
        chunks.append(text[start:end].strip())
        start = end - overlap

    return chunks
