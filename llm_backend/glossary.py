import os

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureChatOpenAI

from prompts import get_system_prompt


load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_GPT = os.getenv("AZURE_DEPLOYMENT_GPT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT_WHISPER")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")


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


def generate_glossary_terms(content):
    system_prompt_langchain_parser = get_system_prompt("models")
    messages = [
        ("system", "{system_prompt}"),
        ("human", "CONTEXT: {context}"),
    ]
    promptLangchain = ChatPromptTemplate.from_messages(messages).partial(
        system_prompt=system_prompt_langchain_parser
    )
    promptLangchainInvoked = promptLangchain.invoke(
        {"context": content, "query": "Please give me the list back!"}
    )
    chain = llm
    response = chain.invoke(promptLangchainInvoked)
    comma_seperated = response.content
    return comma_to_list(comma_seperated)


# creates a python list out of a string
def comma_to_list(text):
    return [item.strip() for item in text.split(",")]


def list_to_comma(list):
    return ", ".join(map(str, list))