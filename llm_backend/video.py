import math
import os
import subprocess

import cv2

from app import app
from image import encode_image, image_to_openai


def cut_video_segments(input_file, filehash, segment_duration=100):
    output_path = os.path.join(
        app.root_path, os.path.join(f"temp/{filehash}/", "video_segments")
    )
    if not os.path.exists(output_path):
        os.makedirs(output_path)

    output_pattern = os.path.join(output_path, "videos_%04d.mp4")

    command = [
        "ffmpeg",
        "-v", "quiet",
        "-i", input_file,  # Input file
        "-c", "copy",  # Copy codec to avoid re-encoding
        "-map", "0",  # Map all streams
        "-f", "segment",  # Segment format
        "-segment_time", str(segment_duration),  # Duration of each segment
        "-reset_timestamps", "1",  # Reset timestamps for each segment
        output_pattern  # Output file pattern
    ]

    try:
        subprocess.run(command, check=True)
        return output_path
    except subprocess.CalledProcessError as e:
        print(f"Error occurred while splitting the video: {e}")


def extract_data_from_video(video_path, filehash):
    # Erstelle den Ausgabeordner, falls er nicht existiert
    single_video = video_path

    frames_path = os.path.join(
        app.root_path, os.path.join(f"temp/{filehash}/", "frames")
    )

    if not os.path.exists(frames_path):
        os.makedirs(frames_path)

    # Berechne die Skalierung
    cam = cv2.VideoCapture(single_video)
    fps = cam.get(cv2.CAP_PROP_FPS)
    total_frames = int(cam.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps  # Dauer des Videos in Sekunden

    if (duration > 120):
        segments_path = cut_video_segments(single_video, filehash)
        segments = get_all_video_segments_in_dir(segments_path)
    else:
        segments = [single_video]

    i = 1
    for video in segments:

        vf_filter = "fps=0.2 ,scale=320:-1"

        # FFmpeg-Befehl ausführen
        output_pattern = os.path.join(frames_path, "frame_%04d.jpg")
        counter = sum(1 for item in os.listdir(frames_path) if os.path.isfile(os.path.join(frames_path, item)))

        command = [
            "ffmpeg",
            "-v", "quiet",
            "-y",
            "-i", video,
            "-vf", vf_filter,
            "-start_number", str(counter),
            output_pattern
        ]

        try:
            subprocess.run(command, check=True)
            i = i + 1
            print(f"Saved frames: {output_pattern} ")
        except subprocess.CalledProcessError as e:
            print(f"Error FFMPEG (Frame Extraction): {e}")

    audio_path = os.path.join(
        app.root_path, os.path.join(f"temp/{filehash}/", "audio")
    )

    if not os.path.exists(audio_path):
        os.makedirs(audio_path)
    audio_output = os.path.join(audio_path, "audio.mp3")
    command = [
        "ffmpeg",
        "-v", "quiet",
        "-y",
        "-i", single_video,
        "-vn",
        audio_output
    ]

    try:
        subprocess.run(command, check=True)
        print(f"Saved Audio in {audio_output}")
    except subprocess.CalledProcessError as e:
        print(f"Error FFMPEG (Audio Extraction): {e}")

    return frames_path, audio_output


# todo bereits zusammengefasste frames hinzufügen und transcription
def process_segments(frames, result_dict, transcription):
    print(len(frames))
    frame_segments = math.floor(len(frames) / 49)
    print(f"segments: {frame_segments}")

    video_summary = ""
    if frame_segments > 0:
        prompt_dict = []
        for i in range(0, frame_segments):
            prompt_dict.clear()
            prompt_dict = [
                {
                    "type": "text",
                    "text": f"Here is part {i} of {frame_segments}. What are all frames showing, be as detailed as possible but please combine everything in a normal text"
                }
            ]
            print("range - " + str(0 + (50 * i)) + " - " + str(49 * (i + 1)))
            for j in range(0 + (50 * i), 49 * (i + 1)):
                encoding = encode_image(frames[j])
                base64_image = {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{encoding}",
                        "detail": "auto"
                    }
                }
                prompt_dict.append(base64_image)
            video_summary = image_to_openai(prompt_dict)
            print(video_summary)
            # append
            video_summary = video_summary + " "
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
        for j in range(0, len(frames)):
            encoding = encode_image(frames[j])
            base64_image = {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{encoding}",
                    "detail": "auto"
                }
            }
            prompt_dict.append(base64_image)
        video_summary = image_to_openai(prompt_dict)



    single_dict = result_dict
    return single_dict


def get_all_frames_in_dir(path):
    f = []
    for (dirpath, dirnames, filenames) in os.walk(path):
        for file in filenames:
            f.append(os.path.join(dirpath, file))
    return f


def get_all_video_segments_in_dir(path):
    f = []
    for (dirpath, dirnames, filenames) in os.walk(path):
        for file in filenames:
            f.append(os.path.join(dirpath, file))
    return f
