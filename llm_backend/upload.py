import json
import mimetypes
import os
import time

from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI

from app import socketio
from image import encode_image, image_to_openai
from pdf import create_text_chunks_pdfplumber
from readwrite import write_to_file, read_from_file, text_to_dict, delete_temp_folder
from video import process_segments, extract_data_from_video, get_all_frames_in_dir
from webdav import check_if_cached, download_cache, upload_cache_file, download_file_webdav
from whisper import transcribe

ALLOWED_EXTENSIONS = {"txt", "pdf", "html", "mp3", "wav", "png", "jpg", "jpeg", "gif", "bmp", "mp4"}

load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_GPT = os.getenv("AZURE_DEPLOYMENT_GPT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT_WHISPER")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def sort_attachments(item):
    if item["mimetype"] == "application/pdf":
        return 0
    elif item["mimetype"] == "audio/mpeg":
        return 2
    return 1


llm = AzureChatOpenAI(
    azure_endpoint=AZURE_ENDPOINT,
    azure_deployment=AZURE_DEPLOYMENT_GPT,
    openai_api_version=OPENAI_API_VERSION,
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    streaming=False,
)


def upload_file_method_production(files, socket_id):
    files_as_dicts = []
    single_dict = {}
    files_as_dicts_json = ""
    texts = ""
    single_text = None
    whisper_prompt = ""
    # SET TRUE IF CACHING SHOULD BE ACTIVATED -> FALSE IF NOT
    USE_CACHE = True

    for file in files:
        print(file)
        filepath = file["filepath"]
        mimetype = mimetypes.guess_type(filepath)
        file["mimetype"] = mimetype[0]

    # sort attachments so audio comes last
    sorted_attachments = sorted(files, key=sort_attachments)

    for file in sorted_attachments:

        filepath = file["filepath"]
        filehash = file["filehash"]
        file_id = file["id"] if "id" in file else file["file_id"]
        filename = file["filename"]
        # download file to temp folder
        path = download_file_webdav(filepath, filename)
        mimetype = file["mimetype"]
        is_cached = check_if_cached(filehash)

        socketio.emit('case_generation', {'message': f'Analyzing "{filename}"'}, to=socket_id)

        if allowed_file(filename) and (not is_cached or not USE_CACHE):
            if "audio" in mimetype:
                socketio.emit('case_generation', {'message': f'Transcribing Audio File ({filename})'}, to=socket_id)
                transcription = transcribe(file, texts, llm, path, filename, whisper_prompt)
                single_dict = transcription
                texts += "  " + json.dumps(single_text, ensure_ascii=False)
            elif "pdf" in mimetype:
                socketio.emit('case_generation', {'message': f'Analyzing PDF File ({filename})'}, to=socket_id)
                texts += f" Content of PDF File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                single_text = create_text_chunks_pdfplumber(path)
                single_dict = {
                    "type": "pdf",
                    "content": single_text
                }
                texts += " " + single_text
            elif "html" in mimetype:
                socketio.emit('case_generation', {'message': f'Analyzing HTML File ({filename})'}, to=socket_id)
                texts += f" Content of HTML File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                with open(path, "r", encoding="utf-8") as file:
                    contents = file.read()
                    soup = BeautifulSoup(contents)
                    texts += soup.get_text()
                    single_text = soup.get_text()
                single_dict = {
                    "type": "html",
                    "content": single_text
                }
            elif mimetype == "text/plain":
                socketio.emit('case_generation', {'message': f'Analyzing Text File ({filename})'}, to=socket_id)
                texts += f" Content of Text File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                with open(path, "r", encoding="utf-8") as file:
                    contents = file.read()
                    texts += contents
                    single_text = contents
                single_dict = {
                    "type": "txt",
                    "content": single_text
                }
            elif "image" in mimetype:
                socketio.emit('case_generation', {'message': f'Analyzing Image File ({filename})'}, to=socket_id)
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
                    "type": mimetype,
                    "content": single_text
                }
            elif "video" in mimetype:
                socketio.emit('case_generation', {'message': f'Analyzing Video File ({filename})'}, to=socket_id)
                texts += f" Content of Video File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "

                frame_path, audio_path = extract_data_from_video(path, filehash)
                frames = get_all_frames_in_dir(frame_path)

                transcription = transcribe(file, texts, llm, audio_path, filename, whisper_prompt)
                #texts += "  " + json.dumps(single_text, ensure_ascii=False)
                result_dict = {
                    "video_summary": "",
                    "transcription": [transcription]
                }
                single_dict = process_segments(frames, result_dict)
            else:
                socketio.emit('case_generation', {'message': f'File ({filename}) cannot be processed'}, to=socket_id)

        ### CACHE TO MINIMIZE AZURE API CALLS

        if is_cached and USE_CACHE:
            socketio.emit('case_generation', {'message': f'Found file in cache ({filename})'}, to=socket_id)
            print("USING CACHE")
            cache_path = download_cache(filehash)
            txt = read_from_file(cache_path)
            content_dict = text_to_dict(txt)
        else:
            socketio.emit('case_generation', {'message': f'Saving file in cache ({filename})'}, to=socket_id)
            print("NOT USING CACHE")
            content_dict = single_dict
            file_path = write_to_file(filehash, json.dumps(content_dict, ensure_ascii=False, indent=2))
            upload_cache_file(file_path, filehash)

        file_as_dict = {
            "filename": filename,
            "mimetype": mimetype,
            "filehash": filehash,
            "filepath": filepath,
            "file_id": file_id,
        }

        try:
            file_as_dict.update(content_dict)
        except ValueError:
            file_as_dict["content"] = single_text

        files_as_dicts.append(file_as_dict)
        files_as_dicts_json = json.dumps(files_as_dicts, ensure_ascii=False, indent=2)

        write_to_file(str(time.time()), files_as_dicts_json)

        #delete_temp_folder(filehash)

    return files_as_dicts_json


def merge_two_dicts(x, y):
    z = x.copy()  # start with keys and values of x
    z.update(y)  # modifies z with keys and values of y
    return z


def convert_list_to_dict(lst):
    res_dict = {}
    for i in range(0, len(lst), 2):
        res_dict[lst[i]] = lst[i + 1]
    return res_dict
