from dotenv import load_dotenv

import os
from langchain_chroma.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain_openai import AzureOpenAIEmbeddings

# Load environment variables from .env file
load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")

embedding_model = AzureOpenAIEmbeddings(
    azure_endpoint=AZURE_ENDPOINT,
    azure_deployment=AZURE_DEPLOYMENT_EMBEDDING,
    api_version=OPENAI_API_VERSION)

def split_texts(content):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=500,
        separators=["\n\n", "\n", ".", "?", "!"])
    texts = text_splitter.split_text(content)

    return texts

def create_embeddings(texts, filename, id):
    texts = split_texts(texts)
    i = 0
    docs = []
    for text in texts:
        if text:
            print("embeddings:" + str(i) + "/" + str(len(texts)))
            i = i + 1
            metadata_doc = {"case_id": id, "filename": filename}
            doc = Document(page_content=text, metadata=metadata_doc)
            docs.append(doc)
    
    Chroma.from_documents(docs, embedding_model, persist_directory=".chromadb/")
    return

