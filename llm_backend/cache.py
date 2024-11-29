import hashlib

from llm_backend import webdav


def cache_file(file):
    new_filename = sha256_hash_file(file)
    webdav.upload_file(file, new_filename)
    return

def check_if_file_cached():
    return

def get_cached_file():
    return



def sha256_hash_file(file_path):
    # Erstelle ein SHA256 Hash-Objekt
    sha256_hash = hashlib.sha256()

    # Öffne die Datei im Binärmodus
    with open(file_path, "rb") as f:
        # Lese die Datei in Blöcken und aktualisiere den Hash
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)

    # Gib den Hash in Hexadezimalform zurück
    return sha256_hash.hexdigest()