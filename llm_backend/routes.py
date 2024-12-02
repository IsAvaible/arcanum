from flask import request, Blueprint
from app import app

from generate import (
    generate_case_langchain_production,
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

