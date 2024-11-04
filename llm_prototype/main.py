import os

from dotenv import load_dotenv
from flask import sessions

from app import app
from llm import llm
from routes import routes
from upload import upload

def init_flask():
    # start flask and make it available to the local network
    load_dotenv()
    app.register_blueprint(routes)
    app.register_blueprint(upload)
    app.register_blueprint(llm)
    app.run(host='0.0.0.0', port=5000, debug=True)


if __name__ == '__main__':
    init_flask()
