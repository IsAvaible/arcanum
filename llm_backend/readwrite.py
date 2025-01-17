import json
import os
import shutil

from app import app, temp_folder


# write content to a file
def write_to_file(hash, content):
    """
    write content to a local file
    :param hash: filehash of the file
    :param content: content of the file
    :return: file_path to the file
    """
    # create directory if does not exist
    dir_path = os.path.join(app.root_path, temp_folder, hash)
    os.makedirs(dir_path, exist_ok=True)

    # delete temp file to rewrite
    if os.path.exists(dir_path):
        shutil.rmtree(dir_path, ignore_errors=True)
        os.mkdir(dir_path)

    # file path
    file_path = os.path.join(dir_path, f"{hash}.json")
    try:
        # write file
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(content)
        return file_path
    except Exception as e:
        print(f"An error occurred: {e}")
        return None


# delete temp folder
def delete_temp_folder(hash):
    """
    Delete the temp folder of a temp file
    :param hash: file_hash of the file
    :return: if the temp folder was deleted
    """
    dir_path = os.path.join(app.root_path, temp_folder, hash)
    if os.path.exists(dir_path):
        try:
            shutil.rmtree(dir_path)
            return True
        except Exception as e:
            print(f"Error '{dir_path}': {e}")
            return False
    else:
        print(f"Folder '{dir_path}' does not exist.")
        return False


# read file
def read_from_file(file_path):
    """
    Read the content of a local file
    :param file_path: file path to the file
    :return: content of the file
    """
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
        return content
    except FileNotFoundError:
        print(f"File '{file_path}' does not exist.")
        return None
    except Exception as e:
        print(f"An error occured: {e}")
        return None


# text to dict
def text_to_dict(json_text):
    try:
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        print(f"Parsing error: {e}")
        return None
