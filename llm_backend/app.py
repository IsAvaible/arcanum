import os
import time

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


sio = socketio.Client(engineio_logger=True, logger=True, ssl_verify=False)
connected = False
while not connected:
    try:
        sio.connect("https://node_backend:3000")
        print("Socket established")
        connected = True
    except Exception as ex:
        print("Failed to establish initial connnection to server:", type(ex).__name__)
        time.sleep(2)
# init upload folder
app.config["UPLOAD_FOLDER"] = "upload"
@sio.event
def connect():
    print('Successfully connected to websocket server.')



# create directories if not available
upload_folder = os.path.join(app.root_path, "upload")
temp_folder = os.path.join(app.root_path, "temp")

if not os.path.exists(upload_folder):
    os.makedirs(upload_folder)
if not os.path.exists(temp_folder):
    os.makedirs(temp_folder)
