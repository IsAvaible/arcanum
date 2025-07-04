import json

from flask import jsonify, abort
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app import sio
from azure import get_llm
from case import CaseArray, check_if_output_is_valid
from prompts import system_prompt_case_generation
from upload import upload_file


def start_quering_llm(invokedPrompt, llm, parser, max_tries=3) -> dict:
    """
    Queries the LLM with the given prompt template, LLM, and parser to generate a valid case.
    If the output is invalid (i.e., not in JSON format or missing some required parameters),
    the function re-queries the LLM until it gets a valid output or reaches the maximum number of retries.

    Returns:
        dict: The output case formatted as a Python dictionary if valid, otherwise returning an empty dict.
    """
    chain = llm | parser
    chain_output = chain.invoke(invokedPrompt)
    is_valid = False
    for try_number in range(1, max_tries + 1):
        is_valid = check_if_output_is_valid(chain_output)
        if is_valid:
            break
        else:
            llm.temperature += 0.1
            chain_output = chain.invoke(invokedPrompt)
            pass

    if not is_valid:
        print(f"Couldn't get valid output in {try_number} tries")
        return {}
    else:
        print(f"Generated valid output with {try_number} tries")

    return chain_output


# Method to generate one or more Cases
def generate(request):
    if request.method == "POST":
        json_str = request.get_json(force=True)
        # gets all attachments sent by user
        attachments = json_str["attachments"]
        # gets socket_id to send message to frontend
        socket_id = json_str["socket_id"]

        sio.emit('llm_message', {'message': 'Starting Case Generation...', 'socket_id': socket_id})

        # Prompt for generating JSON and including all context
        prompt = "Please create metadata for a new case based on the Context provided and return them in JSON! Please try include all necessary information that the context has!"

        # Instantiating AzureOpenAI object for making prompts
        llm = get_llm()

        # Upload File method converts into Context (Text)
        context = upload_file(attachments, socket_id)
        sio.emit('llm_message', {'message': 'Finalizing Case Generation...', 'socket_id': socket_id})
        # validate json for multiple cases
        case_parser_json = JsonOutputParser(pydantic_object=CaseArray)

        # set system prompt and context for LLM
        messages = [
            ("system", "{system_prompt}\n{format_instructions}"),
            ("human", "CONTEXT: {context}\n\nQUERY: {query}"),
        ]

        # replace system prompt and format instructions for LLM
        promptLangchain = ChatPromptTemplate.from_messages(messages).partial(
            system_prompt=system_prompt_case_generation,
            format_instructions=case_parser_json.get_format_instructions(),
        )

        # invoke prompt to get an answer
        promptLangchainInvoked = promptLangchain.invoke(
            {"context": context, "query": prompt}
        )

        # get response
        response_dict = start_quering_llm(
            promptLangchainInvoked, llm, case_parser_json, max_tries=3
        )

        if "cases" in response_dict:
            cases = response_dict["cases"]
            attachment_files = json.loads(context)
            add_glossary(cases, attachment_files)

            # return case json
            return jsonify(response_dict), 200
        else:
            abort(500, description="Couldn't get valid case output. Please add more data before trying again.")




def add_glossary(cases, attachment_files):

    glossary_terms = []
    # add glossary from analyzed file to response (attachments)
    for case in cases:
        for att in case["attachments"]:
            for file in attachment_files:
                att_id = att["id"]
                file_id = file["file_id"]
                if att_id == file_id:
                    if "glossary" in file["content"]:
                        for term in file["content"]["glossary"]:
                            if "glossary" not in case:
                                att["glossary"] = []
                            if term not in att["glossary"]:
                                att["glossary"].append(term)
                            if term not in glossary_terms:
                                glossary_terms.append(term)

    # check if glossary term was mentioned in solution, title or description
    # if yes add to glossary of the case
    for case in cases:
        for term in glossary_terms:
            if term in case["solution"] or term in case["title"] or term in case["description"]:
                if "glossary" not in case:
                    case["glossary"] = []
                if term not in case["glossary"]:
                    case["glossary"].append(term)

    for case in cases:
        for att in case["attachments"]:
            for file in attachment_files:
                for term in glossary_terms:
                    att_id = att["id"]
                    file_id = file["file_id"]
                    if att_id == file_id:
                        if term in json.dumps(file, ensure_ascii=False, indent=2):
                            if "glossary" not in att:
                                att["glossary"] = []
                            if term not in att["glossary"]:
                                att["glossary"].append(term)
