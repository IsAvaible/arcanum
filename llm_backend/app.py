from flask import Flask
from flask_socketio import SocketIO
import os

if not os.path.exists("llm_backend/temp"):
    os.makedirs("llm_backend/temp")
if not os.path.exists("llm_backend/upload"):
    os.makedirs("llm_backend/upload")

app = Flask(__name__)
app.secret_key = "super secret key"
app.config["SECRET_KEY"] = "super secret key"
socketio = SocketIO(app)
app.config["UPLOAD_FOLDER"] = "upload"