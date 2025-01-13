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

USE_CACHE = False


def upload_file(files, socket_id):
    """
    Upload method
    :param files: all attachments
    :param socket_id: socket id to send messages
    :return: all generated cases
    """
    attachments = []
    single_file = {}
    files_json = ""

    # sort all attachments so textbased files will be analyzed first
    sorted_attachments = sorted(files, key=sort_attachments)

    # iterate over all sorted attachments
    for file in sorted_attachments:
        file_mimetype = file["mimetype"]
        file_id = file["id"]
        file_name = file["filename"]
        file_path = file["filepath"]
        file_hash = file["filehash"]

        delete_temp_folder(file_hash)
        path = download_file_webdav(file_path, file_name)
        is_cached = check_if_cached(file_hash)

        sio.emit('llm_message', {'message': f'Analyzing "{file_name}"', 'socket_id': socket_id})

        if not is_cached or not USE_CACHE:
            # upload audio file
            if "audio" in file_mimetype:
                sio.emit('llm_message', {'message': f'Transcribing Audio File "{file_name}"', 'socket_id': socket_id})
                transcription = transcribe(path, file_hash, attachments, socket_id)
                single_file = transcription
            # upload pdf file
            elif "pdf" in file_mimetype:
                sio.emit('llm_message', {'message': f'Analyzing PDF File "{file_name}"', 'socket_id': socket_id})
                single_text = create_text_chunks_pdfplumber(path)
                glossary_terms = generate_glossary_terms(single_text)
                single_file = {
                    "text": single_text,
                    "glossary": glossary_terms
                }
            # upload html file
            elif "html" in file_mimetype:
                sio.emit('llm_message', {'message': f'Analyzing HTML File "{file_name}"', 'socket_id': socket_id})
                with open(path, "r", encoding="utf-8") as f:
                    contents = f.read()
                    soup = BeautifulSoup(contents)
                    single_text = soup.get_text()
                    glossary_terms = generate_glossary_terms(single_text)
                single_file = {
                    "text": single_text,
                    "glossary": glossary_terms
                }
            # upload text file
            elif file_mimetype == "text/plain":
                sio.emit('llm_message', {'message': f'Analyzing Text File "{file_name}"', 'socket_id': socket_id})
                with open(path, "r", encoding="utf-8") as f:
                    contents = f.read()
                    single_text = contents
                    glossary_terms = generate_glossary_terms(single_text)
                single_file = {
                    "text": single_text,
                    "glossary": glossary_terms
                }
            # upload image file
            elif "image" in file_mimetype:
                sio.emit('llm_message', {'message': f'Analyzing Image File "{file_name}"', 'socket_id': socket_id})
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
                single_file = {
                    "image": single_text
                }
            # upload video file
            elif "video" in file_mimetype:
                sio.emit('llm_message', {'message': f'Analyzing Video File "{file_name}"', 'socket_id': socket_id})

                frame_path, audio_path, duration = extract_data_from_video(path, file_hash)
                frames = get_all_frames_in_dir(frame_path)

                transcription = transcribe(audio_path, file_hash, attachments, socket_id)
                video_summary = process_segments(frames, transcription, duration, socket_id)
                single_file = {
                    "transcription": transcription["transcription"],
                    "video_summary": video_summary["video_summary"]
                }
            else:
                sio.emit('llm_message', {'message': f'File "{file_name}" cannot be processed', 'socket_id': socket_id})

        # define a dictionary for a file
        file_as_dict = {
            "filename": file_name,
            "mimetype": file_mimetype,
            "filehash": file_hash,
            "filepath": file_path,
            "file_id": file_id,
            "content": single_file
        }
        ### CACHE TO MINIMIZE AZURE API CALLS
        if is_cached and USE_CACHE:
            sio.emit('llm_message', {'message': f'Getting "{file_name}" from Cache', 'socket_id': socket_id})
            print("USING CACHE")
            cache_path = download_cache(file_hash)  # download cache file
            txt = read_from_file(cache_path)  # read cache file
            file_as_dict = text_to_dict(txt)  # file to dict
        else:
            sio.emit('llm_message', {'message': f'Saving file "{file_name}" to Cache', 'socket_id': socket_id})
            print("NOT USING CACHE")
            file_path = write_to_file(file_hash, json.dumps(file_as_dict, ensure_ascii=False, indent=2))
            upload_cache_file(file_path, file_hash)

        attachments.append(file_as_dict)
        files_json = json.dumps(attachments, ensure_ascii=False, indent=2)

        # debug
        write_to_file(str(time.time()), files_json)
        # delete temp folder
        delete_temp_folder(file_hash)

    return files_json


def sort_attachments(item):
    '''
    If multiple files were uploaded, Textbased files should have a higher priority than audio/video files
    Is needed for generating glossary terms out of Text files
    '''
    if item["mimetype"] == "application/pdf":
        return 0
    elif item["mimetype"] == "audio/mpeg":
        return 2
    return 1
