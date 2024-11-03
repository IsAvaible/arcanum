import re


def replace_triple_quotes_with_pre(text):
    # Regex-Muster für dreifache Hochkommata, die paarweise auftreten
    pattern = r"```(.*?)```"

    # Ersetze die dreifachen Hochkommata mit <pre> und </pre>
    replaced_text = re.sub(pattern, r"<pre>\1</pre>", text, flags=re.DOTALL)

    return replaced_text


def replace_one_quote_with_pre(text):
    # Regex-Muster für dreifache Hochkommata, die paarweise auftreten
    pattern = r"`(.*?)`"

    # Ersetze die dreifachen Hochkommata mit <pre> und </pre>
    replaced_text = re.sub(pattern, r"<pre>\1</pre>", text, flags=re.DOTALL)

    return replaced_text
