from flask import Flask

app = Flask(__name__)
app.secret_key = "super secret key"
app.config['UPLOAD_FOLDER'] = 'upload'
app.config["SESSION_PERMANENT"] = True
app.config["SESSION_TYPE"] = "filesystem"