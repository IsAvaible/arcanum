from langchain_core.prompts import ChatPromptTemplate

from azure import get_llm
from prompts import system_prompt_glossary


def generate_glossary_terms(content):
    """
    generate glossary terms of a text string
    :param content: content of a file
    :return: glossary terms as a list
    """
    messages = [
        ("system", "{system_prompt}"),
        ("human", "CONTEXT: {context}"),
    ]
    promptLangchain = ChatPromptTemplate.from_messages(messages).partial(
        system_prompt=system_prompt_glossary
    )
    promptLangchainInvoked = promptLangchain.invoke(
        {"context": content, "query": "Please give me the list back!"}
    )
    chain = get_llm()
    response = chain.invoke(promptLangchainInvoked)
    comma_seperated = response.content
    return comma_to_list(comma_seperated)



def comma_to_list(text):
    """
    seperate a comma seperated string into a list
    :param text: comma seperated string
    :return: list of strings
    """
    return [item.strip() for item in text.split(",")]


def list_to_comma(list):
    """
    convert a list of items to a comma separated list
    :param list: list of words
    :return: comma separated list (string)
    """
    return ", ".join(map(str, list))
