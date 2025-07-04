import os

from langchain_openai import AzureChatOpenAI
from openai import AzureOpenAI


# Getting all Env Variables
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_GPT = os.getenv("AZURE_DEPLOYMENT_GPT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
AZURE_DEPLOYMENT_WHISPER = os.getenv("AZURE_DEPLOYMENT_WHISPER")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")

# Define LLM Instance
llm = AzureChatOpenAI(
    azure_endpoint=AZURE_ENDPOINT,
    azure_deployment=AZURE_DEPLOYMENT_GPT,
    openai_api_version=OPENAI_API_VERSION,
    temperature=0.1,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    streaming=False,
)

# Define Whisper Instance
client = AzureOpenAI(azure_endpoint=AZURE_ENDPOINT,
                     api_version=OPENAI_API_VERSION,
                     api_key=AZURE_OPENAI_API_KEY)

embeddings = AzureOpenAI(
    azure_endpoint=AZURE_ENDPOINT,
    azure_deployment=AZURE_DEPLOYMENT_EMBEDDING,
    api_version=OPENAI_API_VERSION,
)

def get_llm():
    return llm

def get_llm_custom(temperature, max_tokens, timeout, max_retries, streaming):
    return AzureChatOpenAI(
        azure_endpoint=AZURE_ENDPOINT,
        azure_deployment=AZURE_DEPLOYMENT_GPT,
        openai_api_version=OPENAI_API_VERSION,
        temperature=temperature,
        max_tokens=max_tokens,
        timeout=timeout,
        max_retries=max_retries,
        streaming=streaming,
    )

def get_embeddings():
    return embeddings


def get_whisper(audio_file, whisper_prompt):
    response = client.audio.transcriptions.create(
        file=audio_file,
        model=AZURE_DEPLOYMENT_WHISPER,
        response_format="verbose_json",
        prompt=whisper_prompt,
        timestamp_granularities=["segment"]
    )
    return response
