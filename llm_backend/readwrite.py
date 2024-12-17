import json
import os
from app import app


def write_to_file(hash, content):
    # Verzeichnis erstellen, falls es nicht existiert
    dir_path = os.path.join(app.root_path, "temp", hash)
    os.makedirs(dir_path, exist_ok=True)  # Erstellt das Verzeichnis, falls nötig

    # Datei-Pfad
    file_path = os.path.join(dir_path, f"{hash}.json")

    try:
        # Datei schreiben
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(content)
        return file_path
    except Exception as e:
        print(f"Ein Fehler ist aufgetreten: {e}")
        return None


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



def text_to_dict(json_text):
    try:
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        print(f"Fehler beim Parsen von JSON: {e}")
        return None