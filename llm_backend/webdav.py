###
import os
from dotenv import load_dotenv
from app import app
from webdav3.client import Client

load_dotenv()

options = {
    'webdav_hostname': os.getenv("WEBDAV_HOSTNAME"),
    'webdav_login':    os.getenv("WEBDAV_LOGIN"),
    'webdav_password': os.getenv("WEBDAV_PASSWORD"),
    'webdav_timeout': 30
}

client = Client(options)
client.verify = True

def download_file_webdav(filepath, filename):
    path = os.path.join(app.root_path, os.path.join(app.config['UPLOAD_FOLDER'], filename))
    client.download_sync(remote_path=filepath, local_path=path)
    return path

def download_folder_webdav(filepath):
    path = os.path.join(app.root_path, os.path.join(app.config['UPLOAD_FOLDER']), filepath)
    client.download_sync(remote_path=filepath, local_path=path)
    return path


