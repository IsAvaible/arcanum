import os
import subprocess
from itertools import islice

from flask import abort

from app import app, sio
from audio import split_audio_with_overlap
from azure import get_whisper
from glossary import list_to_comma
from app import temp_folder

split_length_ms = 300000
split_length_s = split_length_ms / 1000


class Segment:
    """
    A segment is used for the transcription of the audio file.
    It contains a start and end timestamp and the transcription text.
    """
    def __init__(self, start, end, text):
        self.start = start
        self.end = end
        self.text = text

    def __repr__(self):
        return f"({self.start}, {self.end}, {self.text})"


def transcribe(path, filehash, file_as_dicts, socket_id):
    """
    Transcribe a file using Azure Whisper
    :param file: audio file to transcribe
    :param texts: all content already analyzed
    :param path: path to file
    :param filehash: sha256 hash of file
    :param file_as_dicts: all attachments that already have been analyzed
    :param socket_id: to send socket messages to the frontend
    :return: dictionary that contains the transcription
    """
    if os.path.isfile(path) is True:

        glossary_terms = []
        for dict in file_as_dicts:
            if "content" in dict:
                if "glossary" in dict["content"]:
                    if dict["content"]["glossary"] is not None:
                        for term in dict["content"]["glossary"]:
                            glossary_terms.append(term)

        whisper_prompt = list_to_comma(glossary_terms)

        # define new dict for transcription
        data = {
            "transcription": {
                "segments": []
            }
        }

        sio.emit('llm_message', {'message': f'Converting Audio to MP3', 'socket_id': socket_id})
        path = convert_to_mp3(filehash, path)

        # check file size because only 25Mb/request are allowed for Whisper transcription
        file_size_mb = os.stat(path).st_size / (1024 * 1024)

        # if file greater 24Mb we need to split this file into multiple segments
        if float(file_size_mb) > 24.0:
            # get multiple split segments
            sio.emit('llm_message', {'message': 'Splitting Audio in multiple chunks...', 'socket_id': socket_id})
            chunks = split_audio_with_overlap(path, segment_length_ms=split_length_ms, overlap_ms=500)
            for idx, segment in enumerate(chunks):
                sio.emit('llm_message',
                         {'message': f'Transcribing Audio Chunk {idx + 1}/{len(chunks)}', 'socket_id': socket_id})
                dir = os.path.join(app.root_path, os.path.join(f"{temp_folder}/{filehash}/audio"))
                if not os.path.exists(dir):
                    os.makedirs(dir)
                path = os.path.join(app.root_path, os.path.join(f"{temp_folder}/{filehash}/audio", f"audio_{idx}.mp3"))
                # save to mp3 format in temp folder
                segment.export(path, format="mp3")

                # Set up AzureChatOpenAI with the required configurations
                audio_file = open(path, "rb")
                response = get_whisper(audio_file, whisper_prompt)

                segments = response.segments
                combined_segments = []

                # to make the array not too large we are merging multiple (n = 4) transcription segments into one
                n = 4
                for i in range(0, len(segments), n):
                    group_segments = list(islice(segments, i, i + n))
                    combined_segments.append(combine_segments(group_segments))
                generated_dict = generate_segment_dict(combined_segments, idx)

                # attach generated dictionary to data dictionary
                data["transcription"]["segments"].extend(generated_dict)
            return data
        else:
            sio.emit('llm_message', {'message': 'Transcribing audio...', 'socket_id': socket_id})
            # if audio file is lower than 24mb
            audio_file = open(path, "rb")
            response = get_whisper(audio_file, whisper_prompt)

            segments = response.segments
            combined_segments = []
            n = 3
            for i in range(0, len(segments), n):
                group_segments = list(islice(segments, i, i + n))
                combined_segments.append(combine_segments(group_segments))

            # define data type
            new_segments = generate_segment_dict(combined_segments)
            data["transcription"]["segments"] = new_segments
            return data
    else:
        data = None
        print("no audio file")
        return data


def combine_segments(group_segments):
    """
    # Method to merge multiple segments into one bigger segments to reduce the size of the transcription array
    :param group_segments: multiple Segments
    :return: one combined Segment
    """
    start = group_segments[0].start
    end = group_segments[-1].end
    text = ''.join([seg.text for seg in group_segments])
    return Segment(start, end, text)


def generate_segment_dict(combined_segments, idx=0):
    """
    This method will generate a dictionary over the combined segments
    If there are splitted segments we need to adjust the start and end timestamp of the segments because Open AI Whisper will always start at 0 seconds for each segment uploaded
    :param combined_segments: all combined segments
    :param idx: index of the chunk
    :return: dictionary of segments
    """
    segments = []
    for seg in combined_segments:
        start = seg.start
        end = seg.end
        text = seg.text

        if idx > 0:
            start = int(start) + (split_length_s * idx)
            end = int(end) + (split_length_s * idx)

        start_str = convert_timestamp_to_str(start)
        end_str = convert_timestamp_to_str(end)
        segments.append({
            "start_timestamp": start_str,
            "end_timestamp": end_str,
            "transcription_text": text
        })
    return segments


def convert_timestamp_to_str(ts):
    """
    this will generate a better reading timestamp (XX:YY:ZZ)
    :param ts: timestamp
    :return: timestamp as string (XX:YY:ZZ)
    """
    ts = int(ts)
    return "{:02d}:{:02d}:{:02d}".format(
        ts // 3600,  # Stunden
        (ts % 3600) // 60,  # Minuten
        ts % 60  # Sekunden
    )

def convert_to_mp3(filehash, path):
    audio_path = os.path.join(
        app.root_path, os.path.join(f"temp/{filehash}/", "audio")
    )
    if not os.path.exists(audio_path):
        os.makedirs(audio_path)
    audio_output = os.path.join(audio_path, "audio.mp3")
    command = [
        "ffmpeg",
        "-v", "quiet",  # less logs
        "-y",  # override file
        "-i", f'{path}',  # set input file
        "-b:a", '192k',  # set input file
        "-acodec", "libmp3lame",  # force mp3
        audio_output  # define output
    ]

    try:
        subprocess.run(command, check=True)
        print(f"Saved Audio in {audio_output}")
        return audio_output
    except subprocess.CalledProcessError as e:
        abort(500, description=f"Error FFMPEG (Audio Conversion): {e}")