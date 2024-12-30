from flask import request, Blueprint
from app import app

from generate import (
    generate_case_langchain_production,
    vector_db_test
)
from chat import chat

routes = Blueprint("routes", __name__)


@app.route("/generate_case", methods=["POST"])
def generate_case():
    if request.method == "POST":
        return generate_case_langchain_production(request)


@app.route("/chat", methods=["POST"])
def chat_langchain():
    if request.method == "POST":
        return chat(request)

@app.route("/save_to_vector", methods=["POST"])
def save_to_vector():
    if request.method == "POST":
        # response_dict = None
        response_dict, code = generate_case_langchain_production(request)
        return vector_db_test(response_dict)