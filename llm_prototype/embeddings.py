from langchain_chroma.vectorstores import Chroma
from langchain_ollama.embeddings import OllamaEmbeddings
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from regex import split
from langchain.docstore.document import Document
from sqlalchemy.testing.suite.test_reflection import metadata


def split_texts(content, llm):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
    texts = text_splitter.split_text(content)

    return texts

def create_embeddings(texts, llm, filename, id):
    texts = split_texts(texts, llm)
    i = 0
    docs = []
    for text in texts:
        if text:
            print("embeddings:" + str(i) + "/" + str(len(texts)))
            i = i + 1
            metadata_doc = {"case_id": id, "filename": filename}
            doc = Document(page_content=text, metadata=metadata_doc)
            docs.append(doc)
    Chroma.from_documents(docs, OpenAIEmbeddings(model='text-embedding-3-large'), persist_directory=".chromadb/")
    return

