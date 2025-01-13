import base64

from langchain_core.prompts import ChatPromptTemplate

from azure import get_llm
from prompts import system_prompt_video, system_prompt_image


# Encode Image to Base64
def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


# Prompt images to Azure OpenAI
def image_to_openai(dict):
    # get LLM
    llm = get_llm()

    # define messages
    messages = [
        ("system", "{system_prompt}"),
        ("human", dict),
    ]

    # define prompt
    promptLangchain = ChatPromptTemplate.from_messages(messages).partial(
        system_prompt=system_prompt_image
    )

    # replace vars with values
    promptLangchainInvoked = promptLangchain.invoke(
        {"query": "Please explain me what you see in this picture!"}
    )

    # define chain
    chain = llm

    # do prompt
    response = chain.invoke(promptLangchainInvoked)
    vision_prompt = response.content
    return vision_prompt


# Video to OpenAI (UNUSED)
def video_openai(video_summary, transcription_dict):
    """
    :param video_summary:
    :param transcription_dict:
    :return:
    """

    llm = get_llm()

    # define messages
    messages = [
        ("system", "{system_prompt}"),
        ("human",
         "Please take the input data and explain the content as detailed as possible. Include all information:\nThis is the video data: {video_summary}\n"),
    ]

    # define prompt
    promptLangchain = ChatPromptTemplate.from_messages(messages).partial(
        system_prompt=system_prompt_video, video_summary=video_summary
    )

    # replace vars with values
    promptLangchainInvoked = promptLangchain.invoke(
        {"system_prompt": system_prompt_video, "video_summary": video_summary,
         "query": "Please write all information you can find as detailed as possible!"}
    )

    # define chain
    chain = llm

    # do prompt
    response = chain.invoke(promptLangchainInvoked)
    vision_prompt = response.content
    return vision_prompt
