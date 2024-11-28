from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__)
app.secret_key = "super secret key"
app.config["SECRET_KEY"] = "super secret key"
socketio = SocketIO(app)

app.config["UPLOAD_FOLDER"] = "upload"