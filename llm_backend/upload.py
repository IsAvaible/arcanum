import json
import mimetypes
import time

from bs4 import BeautifulSoup

from app import sio
from glossary import generate_glossary_terms
from image import encode_image, image_to_openai
from pdf import create_text_chunks_pdfplumber
from readwrite import write_to_file, read_from_file, text_to_dict, delete_temp_folder
from video import process_segments, extract_data_from_video, get_all_frames_in_dir
from webdav import check_if_cached, download_cache, upload_cache_file, download_file_webdav
from whisper import transcribe

# All Allowed Extensions
ALLOWED_EXTENSIONS = {"txt", "pdf", "html", "mp3", "wav", "png", "jpg", "jpeg", "gif", "bmp", "mp4"}


# simple checker if filename is allowed
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


'''
Important Sorting function
If multiple files were uploaded, Textbased files should have a higher priority than audio/video files
Is needed for generating glossary terms out of Text files
'''


def sort_attachments(item):
    if item["mimetype"] == "application/pdf":
        return 0
    elif item["mimetype"] == "audio/mpeg":
        return 2
    return 1


# main upload method
def upload_file(files, socket_id):
    files_as_dicts = []
    single_dict = {}
    files_as_dicts_json = ""
    texts = ""
    single_text = None
    # Set to true if you want to cache files in Sciebo/WebDav
    USE_CACHE = False

    # iterate over all files and add mimetype
    for file in files:
        print(file)
        filepath = file["filepath"]
        mimetype = mimetypes.guess_type(filepath)
        file["mimetype"] = mimetype[0]

    # sort all attachments so textbased files will be analyzed first
    sorted_attachments = sorted(files, key=sort_attachments)

    # iterate over all sorted attachments
    for file in sorted_attachments:
        filepath = file["filepath"]
        filehash = file["filehash"]
        delete_temp_folder(filehash)
        file_id = file["id"] if "id" in file else file["file_id"]
        filename = file["filename"]
        # download file to temp folder
        path = download_file_webdav(filepath, filename)
        mimetype = file["mimetype"]
        # check if file was already analyzed based on filehash
        is_cached = check_if_cached(filehash)

        sio.emit('llm_message', {'message': f'Analyzing "{filename}"', 'socket_id': socket_id})
        # check if file is allowed
        # if file was cached before this if clause will be skipped
        if allowed_file(filename) and (not is_cached or not USE_CACHE):
            # upload audio file
            if "audio" in mimetype:
                sio.emit('llm_message', {'message': f'Transcribing Audio File "{filename}"', 'socket_id': socket_id})
                transcription = transcribe(file, texts, path, filehash, files_as_dicts, socket_id)
                single_dict = transcription
                texts += "  " + json.dumps(single_text, ensure_ascii=False)
            # upload pdf file
            elif "pdf" in mimetype:
                sio.emit('llm_message', {'message': f'Analyzing PDF File "{filename}"', 'socket_id': socket_id})
                texts += f" Content of PDF File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                single_text = create_text_chunks_pdfplumber(path)
                glossary_terms = generate_glossary_terms(single_text)
                single_dict = {
                    "text": single_text,
                    "glossary": glossary_terms
                }
                texts += " " + single_text
            # upload html file
            elif "html" in mimetype:
                sio.emit('llm_message', {'message': f'Analyzing HTML File "{filename}"', 'socket_id': socket_id})
                texts += f" Content of HTML File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                with open(path, "r", encoding="utf-8") as file:
                    contents = file.read()
                    soup = BeautifulSoup(contents)
                    texts += soup.get_text()
                    single_text = soup.get_text()
                    glossary_terms = generate_glossary_terms(single_text)
                single_dict = {
                    "text": single_text,
                    "glossary": glossary_terms
                }
            # upload text file
            elif mimetype == "text/plain":
                sio.emit('llm_message', {'message': f'Analyzing Text File "{filename}"', 'socket_id': socket_id})
                texts += f" Content of Text File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                with open(path, "r", encoding="utf-8") as file:
                    contents = file.read()
                    texts += contents
                    single_text = contents
                    glossary_terms = generate_glossary_terms(single_text)
                single_dict = {
                    "text": single_text,
                    "glossary": glossary_terms
                }
            # upload image file
            elif "image" in mimetype:
                sio.emit('llm_message', {'message': f'Analyzing Image File "{filename}"', 'socket_id': socket_id})
                texts += f" Content of Image File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                encoding = encode_image(path)
                mime_type = mimetypes.guess_type(path)[0]
                prompt_dict = [
                    {
                        "type": "text",
                        "text": "What is this image showing, be as detailed as possible"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{encoding}",
                            "detail": "auto"
                        }
                    }
                ]
                single_text = image_to_openai(prompt_dict)
                single_dict = {
                    "image": single_text
                }
            # upload video file
            elif "video" in mimetype:
                sio.emit('llm_message', {'message': f'Analyzing Video File "{filename}"', 'socket_id': socket_id})
                texts += f" Content of Video File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "

                frame_path, audio_path, duration = extract_data_from_video(path, filehash)
                frames = get_all_frames_in_dir(frame_path)

                transcription = transcribe(file, texts, audio_path, filehash, files_as_dicts, socket_id)
                video_summary = process_segments(frames, transcription, duration, socket_id)
                single_dict = {
                    "transcription": transcription["transcription"],
                    "video_summary": video_summary["video_summary"]
                }
            else:
                sio.emit('llm_message', {'message': f'File "{filename}" cannot be processed', 'socket_id': socket_id})

        # define a dictionary for a file
        file_as_dict = {
            "filename": filename,
            "mimetype": mimetype,
            "filehash": filehash,
            "filepath": filepath,
            "file_id": file_id,
            "content": single_dict
        }
        ### CACHE TO MINIMIZE AZURE API CALLS
        if is_cached and USE_CACHE:
            sio.emit('llm_message', {'message': f'Getting "{filename}" from Cache', 'socket_id': socket_id})
            print("USING CACHE")
            cache_path = download_cache(filehash)  # download cache file
            txt = read_from_file(cache_path)  # read cache file
            file_as_dict = text_to_dict(txt)  # file to dict
        else:
            sio.emit('llm_message', {'message': f'Saving file "{filename}" to Cache', 'socket_id': socket_id})
            print("NOT USING CACHE")
            file_path = write_to_file(filehash, json.dumps(file_as_dict, ensure_ascii=False, indent=2))
            upload_cache_file(file_path, filehash)

        files_as_dicts.append(file_as_dict)
        files_as_dicts_json = json.dumps(files_as_dicts, ensure_ascii=False, indent=2)

        # debug
        write_to_file(str(time.time()), files_as_dicts_json)
        # delete temp folder
        delete_temp_folder(filehash)

    return files_as_dicts_json
