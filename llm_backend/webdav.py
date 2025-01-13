import os
import easywebdav2
from dotenv import load_dotenv

from app import app, temp_folder, upload_folder

load_dotenv()

client = easywebdav2.connect("fh-aachen.sciebo.de",path="remote.php/webdav/",port=443, protocol="https", username=os.getenv("NEXTCLOUD_USERNAME"), password=os.getenv("NEXTCLOUD_PASSWORD"))

llm_cache = "/IP_WKS/LLM_CACHE/"


# download file from webday
def download_file_webdav(filepath, filename):
    path = os.path.join(str(app.root_path), str(os.path.join(upload_folder, filename)))
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    client.download(filepath,path)
    return path


# download complete folder
def download_folder_webdav(filepath):
    path = os.path.join(str(app.root_path), str(os.path.join(upload_folder)), filepath)
    client.download(remote_path=filepath, local_path_or_fileobj=path)
    return path


# upload file to cache
def upload_cache_file(file_path, hash):
    client.upload(remote_path=f"{llm_cache}{hash}", local_path_or_fileobj=file_path)


# check if file already cached
def check_if_cached(hash):
    return client.exists(remote_path=f"{llm_cache}{hash}")


# download cache file
def download_cache(hash):
    download_path = os.path.join(
        app.root_path, os.path.join(temp_folder, f"{hash}")
    )

    if not os.path.exists(download_path):
        os.makedirs(download_path)

    download_file = os.path.join(app.root_path, os.path.join(download_path, "cache.json"))
    remote_path = f"{llm_cache}{hash}"
    client.download(remote_path=remote_path, local_path_or_fileobj=download_file)
    return download_file
