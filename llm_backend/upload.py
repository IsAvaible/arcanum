import base64
import math
import mimetypes
import os

from bs4 import BeautifulSoup
from langchain_openai import AzureChatOpenAI
from dotenv import load_dotenv

from image import encode_image, image_to_openai
from video import extract_frames_with_ffmpeg, get_all_frames_in_dir
from readwrite import write_to_file, read_from_file, text_to_dict
from webdav import check_if_cached, download_cache, upload_cache_file
from whisper import transcribe
from pdf import (
    create_text_chunks_pdfplumber,
)
from webdav import download_file_webdav

import json

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


def upload_file_method_production(files, pdf_extractor):
    files_as_dicts = []
    single_dict = {}
    files_as_dicts_json = ""
    texts = ""
    single_text = None
    whisper_prompt = ""
    # SET TRUE IF CACHING SHOULD BE ACTIVATED -> FALSE IF NOT
    USE_CACHE = False

    for file in files:
        print(file)
        filepath = file["filepath"]
        mimetype = mimetypes.guess_type(filepath)
        file["mimetype"] = mimetype[0]

    # sort attachments so audio come last
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
        print(mimetype)
        if allowed_file(filename) and (not is_cached or not USE_CACHE):
            if "audio" in mimetype:
                transcription = transcribe(file, texts, llm, path, filename, whisper_prompt)
                single_dict = transcription
                texts += "  " + json.dumps(single_text, ensure_ascii=False)
            elif mimetype == "application/pdf":
                texts += f" Content of PDF File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                single_text = create_text_chunks_pdfplumber(path)
                single_dict = {
                    "type": "pdf",
                    "text": single_text
                }
                texts += " " + single_text
            elif mimetype == "text/html":
                texts += f" Content of HTML File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                with open(path, "r", encoding="utf-8") as file:
                    contents = file.read()
                    soup = BeautifulSoup(contents)
                    texts += soup.get_text()
                    single_text = soup.get_text()
                single_dict = {
                    "type": "html",
                    "text": single_text
                }
            elif mimetype == "text/plain":
                texts += f" Content of Text File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "
                with open(path, "r", encoding="utf-8") as file:
                    contents = file.read()
                    texts += contents
                    single_text = contents
                single_dict = {
                    "type": "txt",
                    "text": single_text
                }
            elif mimetype == "image/png" or mimetype == "image/jpeg":
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
                    "text": single_text
                }
            elif mimetype == "video/mp4":
                print("VIDEO")
                texts += f" Content of Video File - File ID: {file_id} - Filename: '{filename}' - Filepath: {filepath} - FileHash: {filehash} -> CONTENT OF FILE: "

                frame_path, audio_path = extract_frames_with_ffmpeg(path, filehash)
                frames = get_all_frames_in_dir(frame_path)
                print("FRAMES COUNT: "+ str(len(frames)))

                segments = math.floor(len(frames) / 50)

                print("SEGMENTS COUNT: "+ str(segments))
                transcription = transcribe(file, texts, llm, audio_path, filename, whisper_prompt)
                texts += "  " + json.dumps(single_text, ensure_ascii=False)

                result_dict = {
                    "video_content" : [],
                    "transcription" : [transcription]
                }

                if segments > 1:
                    prompt_dict = []
                    for i in range(0,segments):
                        print("SEGMENT #" + str(i))
                        prompt_dict.clear()
                        prompt_dict = [
                            {
                                "type": "text",
                                "text": "What are all frames showing, be as detailed as possible but please combine everything in a normal text"
                            }
                        ]
                        for j in range(0+(50*i),50*(i+1)):

                            print("FRAME #" + str(j))
                            encoding = encode_image(frames[j])
                            base64_image = {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{encoding}",
                                    "detail": "auto"
                                }
                            }
                            prompt_dict.append(base64_image)
                        print("LENGTH"+str(len(prompt_dict)))
                        single_text = image_to_openai(prompt_dict)
                        video_dict = {
                            "type": mimetype,
                            "text": single_text
                        }
                        result_dict["video_content"].append(video_dict)
                    single_dict = result_dict
                else:
                    prompt_dict = []
                    prompt_dict.clear()
                    prompt_dict = [
                        {
                            "type": "text",
                            "text": "What are all frames showing, be as detailed as possible but please combine everything in a normal text"
                        }
                    ]
                    for j in range(0,len(frames)):
                        encoding = encode_image(frames[j])
                        base64_image = {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{encoding}",
                                "detail": "auto"
                            }
                        }
                        prompt_dict.append(base64_image)
                    print("LENGTH"+str(len(prompt_dict)))
                    single_text = image_to_openai(prompt_dict)
                    video_dict = {
                        "type": mimetype,
                        "text": single_text
                    }
                    result_dict["video_content"].append(video_dict)
                    single_dict = result_dict

        print(single_dict)
        ### CACHE TO MINIMIZE AZURE API CALLS
        if is_cached and USE_CACHE:
            print("USING CACHE")
            cache_path = download_cache(filehash)  # download cache file
            txt = read_from_file(cache_path)  # read cache file
            content_dict = text_to_dict(txt)  # file to dict
        else:
            print("NOT USING CACHE")
            # content_dict = {"content": single_dict}
            content_dict = single_dict
            # write file to cache
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
        files_as_dicts_json = json.dumps(files_as_dicts, ensure_ascii=False,indent=2)

        print(files_as_dicts_json)
    return files_as_dicts_json

def merge_two_dicts(x, y):
    z = x.copy()   # start with keys and values of x
    z.update(y)    # modifies z with keys and values of y
    return z

def convert_list_to_dict(lst):
    res_dict = {}
    for i in range(0, len(lst), 2):
        res_dict[lst[i]] = lst[i + 1]
    return res_dict
