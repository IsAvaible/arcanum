from flasgger import Swagger
from flask import Flask
from flask_session import Session
from flask_socketio import SocketIO

app = Flask(__name__)
swagger = Swagger(app)
app.secret_key = "super secret key"
app.config['SECRET_KEY'] = 'super secret key'
socketio = SocketIO(app)

app.config['UPLOAD_FOLDER'] = 'upload'
app.config["SESSION_PERMANENT"] = True
app.config["SESSION_FILE_DIR"] = ".flask_session"
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

