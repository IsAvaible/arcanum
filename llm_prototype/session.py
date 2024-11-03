from flask import session


def add_value_to_session_list(key, value):
    temp = session[key]
    temp.append(value)
    session[key] = temp