import os
from pathlib import Path

import numpy as np
from pydub import AudioSegment
from scipy.io import wavfile
import noisereduce as nr
from app import app
import whisper



### LOCAL OPENAI WHISPER
# https://github.com/openai/whisper for more information

def whisper_local(path):
    model = whisper.load_model("large", device="cuda")

    audio = whisper.load_audio(path)

    result = model.transcribe(audio, fp16=False)

    print(result)
    return result["text"]


### ZUM REDUZIEREN DES RAUSCHENS ABER NUTZLOS WEIL DANACH ZU LEISE UND UNVERSTÄNDLICH


def convert_mp3_to_wav(file, filename):
    sound = AudioSegment.from_mp3(file)
    filename = Path(file).stem + ".wav"
    path = os.path.join(app.root_path, os.path.join(app.config['UPLOAD_FOLDER'], filename))
    sound.export(path, format="wav")
    return path


def reduce_noise(file, filename):
    audio = AudioSegment.from_file(file)
    samples = np.array(audio.get_array_of_samples())
    reduced_noise = nr.reduce_noise(samples, sr=audio.frame_rate)
    reduced_audio = AudioSegment(
        reduced_noise.tobytes(),
        frame_rate=audio.frame_rate,
        sample_width=audio.sample_width,
        channels=audio.channels
    )

    # Save reduced audio to file
    reduced_audio.export(os.path.join(app.root_path, os.path.join(app.config['UPLOAD_FOLDER'], filename+"reduced_noise.wav")), format="wav")

    return os.path.join(app.root_path, os.path.join(app.config['UPLOAD_FOLDER'], filename+"reduced_noise.wav"))

