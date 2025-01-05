from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
import os

app = Flask(__name__)
CORS(app)
app.secret_key = "super secret key"
app.config["SECRET_KEY"] = "super secret key"
socketio = SocketIO(app)
app.config["UPLOAD_FOLDER"] = "upload"


upload_folder = os.path.join(app.root_path, "upload")
temp_folder = os.path.join(app.root_path, "temp")
qdrant_folder = os.path.join(app.root_path, "qdrantdb")

if not os.path.exists(upload_folder):
    os.makedirs(upload_folder)
if not os.path.exists(temp_folder):
    os.makedirs(temp_folder)
if not os.path.exists(qdrant_folder):
    os.makedirs(qdrant_folder)