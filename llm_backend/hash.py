import hashlib

def generate_sha256_hash(file_path):
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as file:
            # Datei in Blöcken lesen, um große Dateien zu unterstützen
            for block in iter(lambda: file.read(4096), b""):
                sha256_hash.update(block)
        return sha256_hash.hexdigest()
    except FileNotFoundError:
        print(f"Die Datei '{file_path}' wurde nicht gefunden.")
        return None
    except Exception as e:
        print(f"Ein Fehler ist aufgetreten: {e}")
        return None