import base64
import json
import os

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureChatOpenAI
from prompts import get_system_prompt

load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_GPT = os.getenv("AZURE_DEPLOYMENT_GPT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")


def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def image_to_openai(dict):
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
    system_prompt = get_system_prompt("images")
    messages = [
        ("system", "{system_prompt}"),
        ("human", dict),
    ]
    promptLangchain = ChatPromptTemplate.from_messages(messages).partial(
        system_prompt=system_prompt
    )
    promptLangchainInvoked = promptLangchain.invoke(
        {"query": "Please explain me what you see in this picture!"}
    )
    chain = llm
    response = chain.invoke(promptLangchainInvoked)
    vision_prompt = response.content
    return vision_prompt


def video_openai(video_summary, transcription_dict):
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
    system_prompt = get_system_prompt("video")

    messages = [
        ("system", "{system_prompt}"),
        ("human", "Please take the input data and explain the content as detailed as possible. Include all information:\nThis is the video data: {video_summary}\n"),
    ]
    promptLangchain = ChatPromptTemplate.from_messages(messages).partial(
        system_prompt=system_prompt, video_summary=video_summary
    )
    promptLangchainInvoked = promptLangchain.invoke(
         {"video_summary": video_summary, "query": "Please write all information you can find as detailed as possible!"}
    )
    chain = llm
    response = chain.invoke(promptLangchainInvoked)
    vision_prompt = response.content
    return vision_prompt
