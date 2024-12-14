import subprocess
import os
from pathlib import Path

from app import app

import cv2


def cut_video_segments(input_file, filehash, segment_duration=100):

    output_path = os.path.join(
        app.root_path, os.path.join("temp/video_segments/", f"{filehash}")
    )
    if not os.path.exists(output_path):
        os.makedirs(output_path)

    output_pattern = os.path.join(output_path, f"videos_%04d.mp4")

    command = [
        "ffmpeg",
        "-v","quiet",
        "-i", input_file,                # Input file
        "-c", "copy",                    # Copy codec to avoid re-encoding
        "-map", "0",                     # Map all streams
        "-f", "segment",                 # Segment format
        "-segment_time", str(segment_duration), # Duration of each segment
        "-reset_timestamps", "1",        # Reset timestamps for each segment
        output_pattern                   # Output file pattern
    ]

    try:
        subprocess.run(command, check=True)
        return output_path
    except subprocess.CalledProcessError as e:
        print(f"Error occurred while splitting the video: {e}")

def extract_frames_with_ffmpeg(video_path, filehash):
    # Erstelle den Ausgabeordner, falls er nicht existiert
    single_video = video_path

    frames_path = os.path.join(
        app.root_path, os.path.join("temp/frames/", f"{filehash}")
    )

    if not os.path.exists(frames_path):
        os.makedirs(frames_path)

    # Berechne die Skalierung
    cam = cv2.VideoCapture(single_video)
    fps = cam.get(cv2.CAP_PROP_FPS)
    total_frames = int(cam.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps  # Dauer des Videos in Sekunden

    if(duration > 120):
        segments_path = cut_video_segments(single_video, filehash)
        segments = get_all_video_segments_in_dir(segments_path)
    else:
        segments = [single_video]

    i = 1
    for video in segments:

        vf_filter = f"fps=0.2 ,scale=320:-1"

        # FFmpeg-Befehl ausführen
        output_pattern = os.path.join(frames_path, f"frame_%04d.jpg")
        counter = str(((i-1)*50)+1)
        command = [
            "ffmpeg",
            "-v","quiet",
            "-y",
            "-i", video,
            "-vf", vf_filter,
            "-start_number", counter,
            output_pattern
        ]

        try:
            subprocess.run(command, check=True)
            i = i+1
            print(f"Saved frames: {output_pattern} ")
        except subprocess.CalledProcessError as e:
            print(f"Error FFMPEG (Frame Extraction): {e}")


    audio_path = os.path.join(
        app.root_path, os.path.join("temp/audio/", f"{filehash}")
    )

    if not os.path.exists(audio_path):
        os.makedirs(audio_path)
    audio_output = os.path.join(audio_path, f"audio.mp3")
    command = [
        "ffmpeg",
        "-v","quiet",
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