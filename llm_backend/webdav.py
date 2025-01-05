import os

from dotenv import load_dotenv
from webdav3.client import Client

from app import app

load_dotenv()

options = {
    "webdav_hostname": os.getenv("NEXTCLOUD_URL"),
    "webdav_login": os.getenv("NEXTCLOUD_USERNAME"),
    "webdav_password": os.getenv("NEXTCLOUD_PASSWORD"),
    "webdav_timeout": 30,
}

client = Client(options)
client.verify = True


# download file from webday
def download_file_webdav(filepath, filename):
    path = os.path.join(
        app.root_path, os.path.join(app.config["UPLOAD_FOLDER"], filename)
    )
    upload_path = os.path.join(app.root_path, os.path.join(app.config["UPLOAD_FOLDER"]))
    if not os.path.exists(upload_path):
        os.makedirs(upload_path)
    client.download_sync(remote_path=filepath, local_path=path)
    return path

# download complete folder
def download_folder_webdav(filepath):
    path = os.path.join(
        app.root_path, os.path.join(app.config["UPLOAD_FOLDER"]), filepath
    )
    client.download_sync(remote_path=filepath, local_path=path)
    return path

# upload file to cache
def upload_cache_file(file_path, hash):
    client.upload_sync(remote_path=f"/IP_WKS/LLM_CACHE/{hash}", local_path=file_path)

# check if file already cached
def check_if_cached(hash):
    return client.check(f"/IP_WKS/LLM_CACHE/{hash}")

# download cache file
def download_cache(hash):
    download_path = os.path.join(
        app.root_path, os.path.join("temp/", f"{hash}")
    )
    if not os.path.exists(download_path):
        os.makedirs(download_path)

    download_file = os.path.join(
        app.root_path, os.path.join(download_path, "cache.json")
    )
    remote_path = f"/IP_WKS/LLM_CACHE/{hash}"
    client.download_sync(remote_path=remote_path, local_path=download_file)
    return download_file
