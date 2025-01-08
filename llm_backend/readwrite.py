import json
import os
import shutil

from app import app


# write content to a file
def write_to_file(hash, content):
    # create directory if does not exist
    dir_path = os.path.join(app.root_path, "temp", hash)
    os.makedirs(dir_path, exist_ok=True)  # Erstellt das Verzeichnis, falls nötig

    #delete temp file to rewrite
    if os.path.exists(dir_path):
        os.rmdir(dir_path)
        os.mkdir(dir_path)

    # file path
    file_path = os.path.join(dir_path, f"{hash}.json")
    try:
        # write file
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(content)
        return file_path
    except Exception as e:
        print(f"Ein Fehler ist aufgetreten: {e}")
        return None

# delete temp folder
def delete_temp_folder(hash):
    dir_path = os.path.join(app.root_path, "temp", hash)
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
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
        return content
    except FileNotFoundError:
        print(f"Die Datei '{file_path}' wurde nicht gefunden.")
        return None
    except Exception as e:
        print(f"Ein Fehler ist aufgetreten: {e}")
        return None

# text to dict
def text_to_dict(json_text):
    try:
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        print(f"Fehler beim Parsen von JSON: {e}")
        return None
