import os

from app import app
from ollama_local import ollama
from openai_api import openai
from routes import routes
from upload import upload

def init_flask():
    # start flask and make it available to the local network
    os.environ['OLLAMA_HOST'] = os.environ.get("OLLAMA_HOST")
    app.register_blueprint(routes)
    app.register_blueprint(upload)
    app.register_blueprint(ollama)
    app.register_blueprint(openai)
    app.run(debug=True)
    app.run(host='0.0.0.0')


if __name__ == '__main__':
    init_flask()
