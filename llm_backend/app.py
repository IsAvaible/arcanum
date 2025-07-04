import os
import time

import socketio
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


load_dotenv()

app = Flask(__name__)
CORS(app)
app.secret_key = "super secret key"
app.config["SECRET_KEY"] = "super secret key"


# create directories if not available
upload_folder = os.path.join(app.root_path, "upload")
temp_folder = os.path.join(app.root_path, "temp")

if not os.path.exists(upload_folder):
    os.makedirs(upload_folder)
if not os.path.exists(temp_folder):
    os.makedirs(temp_folder)


# init socket connection
sio = socketio.Client(engineio_logger=False, logger=False, ssl_verify=False)

connected = False
while not connected:
    try:
        sio.connect("https://node_backend:3000")
        print("Socket established")
        connected = True
    except Exception as ex:
        print("Failed to establish initial connnection to server:", type(ex).__name__)
        time.sleep(2)

@sio.event
def connect():
    print('Successfully connected to websocket server.')