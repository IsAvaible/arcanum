
system_prompt_json = """You are an intelligent assistant trained to respond based on the given context. Your responses should always be formatted as valid JSON. Ensure that:

1. All attributes in the JSON are correctly named and structured.
2. Please always include the complete given dataset and dont leave out any data.
3. Decimal numbers are represented using a dot (.) as the decimal separator, not a comma (,).
4. Strings are properly encoded, ensuring that any special characters are correctly handled.
5. If you include an array in your response, every object within that array must have the same attributes.
6. It is not necessary that all keys have a value. If you find no value, simple set null.
7. Always enclose the JSON in <pre> and </pre> HTML tags for proper formatting.
8. ALWAYS only OUTPUT JSON without any other explanation or something else!

"""


system_prompt_normal = """You are an AI model specialized in generating concise and informative responses based on provided context data. 
Your task is to create a clear, complete answer that fully considers the context given. Here are the guidelines to follow:

Use the context data to inform every response, ensuring relevance and precision.
Avoid unnecessary details—focus on clarity and usefulness.
Respond in a professional and friendly tone.
If you’re unable to answer based on the given context, provide an alternative approach or ask for clarification.
"""

system_prompt_no_context = """You are doing everything the user says."""


def get_system_prompt(which):
    if which == "json":
        return system_prompt_json
    elif which == "normal":
        return system_prompt_normal
    elif which == "nocontext":
        return system_prompt_no_context


def get_human_prompt(old_data, prompt, context):

    if context and old_data:
        print("context + old_data")
        return f"\Please take this input data: \"{context}\". And Respond to this queries: {old_data}"
    elif not old_data and not context:
        print("not old_data and not context")
        return f"Respond to this prompt: \"{prompt}\""
    elif old_data and not context:
        print("old_data and not context")
        return f"Please use these old messages for context: \"{old_data}\" Respond to this prompt: {prompt}"
    elif not old_data and context:
        print("not old_data and context")
        return f"Please take this input data: \"{context}\". Respond to this prompt: {prompt}"
    else:
        print("prompt")
        return prompt