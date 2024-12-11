import subprocess
import os

from app import app


def extract_frames_with_ffmpeg(video_path, filehash ,scale=0.5):
    interval = 2
    # Erstelle den Ausgabeordner, falls er nicht existiert
    path = os.path.join(
        app.root_path, os.path.join(app.config["UPLOAD_FOLDER"], f"temp/{filehash}_frames")
    )

    # Berechne die Skalierung
    scale_filter = f"scale=iw*{scale}:ih*{scale}" if scale != 1 else ""
    vf_filter = f"fps=1/{interval}" + (f",{scale_filter}" if scale_filter else "")

    # FFmpeg-Befehl ausführen
    output_pattern = os.path.join(path, f"frame_%04d.jpg")
    command = [
        "ffmpeg",
        "-i", video_path,
        "-vf", vf_filter,
        "-q:v", "2",
        output_pattern
    ]

    try:
        subprocess.run(command, check=True)
        print(f"Bilder erfolgreich in {path} gespeichert.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Fehler beim Ausführen von FFmpeg: {e}")


def get_all_frames_in_dir(path):
    f = []
    for (dirpath, dirnames, filenames) in os.walk(path):
        f.extend(filenames)
        break
    return f