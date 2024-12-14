import subprocess
import os

from app import app

import cv2


def cut_video_segments(input_file, output_dir, segment_duration=120):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    output_pattern = os.path.join(output_dir, "segment_%03d.mp4")

    command = [
        "ffmpeg",
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
        print(f"Video successfully split into segments. Saved in {output_dir}")
    except subprocess.CalledProcessError as e:
        print(f"Error occurred while splitting the video: {e}")

def extract_frames_with_ffmpeg(video_path, filehash):
    # Erstelle den Ausgabeordner, falls er nicht existiert
    path = os.path.join(
        app.root_path, os.path.join("temp", f"{filehash}_frames")
    )
    if not os.path.exists(path):
        os.makedirs(path)
    # Berechne die Skalierung
    cam = cv2.VideoCapture(video_path)
    fps = cam.get(cv2.CAP_PROP_FPS)
    total_frames = int(cam.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps  # Dauer des Videos in Sekunden

    # Maximal 50 Frames extrahieren
    max_frames = 50
    frame_interval = duration / max_frames  # Intervall zwischen Frames in Sekunden

    vf_filter = f"fps=1/{frame_interval} ,scale=320:-1"

    # FFmpeg-Befehl ausführen
    output_pattern = os.path.join(path, f"frame_%04d.jpg")
    command = [
        "ffmpeg",
        "-y",
        "-i", video_path,
        "-vf", vf_filter,
        output_pattern
    ]
    try:
        subprocess.run(command, check=True)
        print(f"Bilder erfolgreich in {path} gespeichert.")
    except subprocess.CalledProcessError as e:
        print(f"Fehler beim Ausführen von FFmpeg: {e}")


    output = os.path.join(path, f"audio.mp3")
    command2 = [
        "ffmpeg",
        "-y",
        "-i", video_path,
        "-vn",
        output
    ]

    try:
        subprocess.run(command2, check=True)
        print(f"Audio erfolgreich in {path} gespeichert.")
    except subprocess.CalledProcessError as e:
        print(f"Fehler beim Ausführen von FFmpeg: {e}")


    return path


def get_all_frames_in_dir(path):
    f = []
    for (dirpath, dirnames, filenames) in os.walk(path):
        for file in filenames:
            f.append(os.path.join(dirpath, file))
    return f