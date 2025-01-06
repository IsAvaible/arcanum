import os

import socketio
from flask import Flask
from flask_cors import CORS

# Init Flask
app = Flask(__name__)
# Add CORS
CORS(app)
# init a secret key
app.secret_key = "super secret key"
app.config["SECRET_KEY"] = "super secret key"
# init SocketIO
sio = socketio.Client()
sio.connect("http://localhost:3000")
# init upload folder
app.config["UPLOAD_FOLDER"] = "upload"


# create directories if not available
upload_folder = os.path.join(app.root_path, "upload")
temp_folder = os.path.join(app.root_path, "temp")

if not os.path.exists(upload_folder):
    os.makedirs(upload_folder)
if not os.path.exists(temp_folder):
    os.makedirs(temp_folder)
