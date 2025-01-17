import hashlib


def generate_sha256_hash(file_path):
    """
    generates a sha256 hash from the given file path
    :param file_path: path to the file to hash
    :return: sha256 hash of the file
    """
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as file:
            # read file in blocks
            for block in iter(lambda: file.read(4096), b""):
                sha256_hash.update(block)
        return sha256_hash.hexdigest()
    except FileNotFoundError:
        print(f"File '{file_path}' not found.")
        return None
    except Exception as e:
        print(f"Error occured: {e}")
        return None
