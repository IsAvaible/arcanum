from langchain_chroma.vectorstores import Chroma
from langchain_ollama.embeddings import OllamaEmbeddings
from langchain_openai import OpenAIEmbeddings


def create_embeddings(texts, llm, vector_id):
    vector_store = None
    print(llm)
    if llm == "openai":
        vector_store = Chroma(
            persist_directory=".chromadb/",
            collection_name=vector_id,
            embedding_function=OpenAIEmbeddings(model='text-embedding-3-large'),
        )
    elif llm == "ollama":
        vector_store = Chroma(
            persist_directory=".chromadb/",
            collection_name=vector_id,
            embedding_function=OllamaEmbeddings(model='mxbai-embed-large'),
        )

    print(f"Added {len(texts)} texts to the vector store.")
    print(texts[0])
    if texts:
        vector_store.add_texts(texts)
    return vector_store


def get_embeddings(llm, vector_id):
    if llm == "openai":
        vector_store = Chroma(
            persist_directory=".chromadb/",
            collection_name=vector_id,
            embedding_function=OpenAIEmbeddings(model='text-embedding-3-large'),
        )
        return vector_store
    elif llm == "ollama":
        vector_store = Chroma(
            persist_directory=".chromadb/",
            collection_name=vector_id,
            embedding_function=OllamaEmbeddings(model='mxbai-embed-large'),
        )
        return vector_store
