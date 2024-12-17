from flask import request, Blueprint

from app import app
from chat import chat
from generate import (
    generate,
)

routes = Blueprint("routes", __name__)


@app.route("/generate_case", methods=["POST"])
def generate_case():
    if request.method == "POST":
        return generate(request)


@app.route("/chat", methods=["POST"])
def chat_langchain():
    if request.method == "POST":
        return chat(request)
