import json
import os
from itertools import islice

from dotenv import load_dotenv

from app import app
from audio import split_audio_with_overlap
from glossary import list_to_comma
from openai import AzureOpenAI

# load Env Variables
load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_GPT = os.getenv("AZURE_DEPLOYMENT_GPT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
AZURE_DEPLOYMENT_WHISPER = os.getenv("AZURE_DEPLOYMENT_WHISPER")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")

# instantiate Azure
client = AzureOpenAI(azure_endpoint=AZURE_ENDPOINT,
                     api_version=OPENAI_API_VERSION,
                     api_key=AZURE_OPENAI_API_KEY)

split_length_ms = 300000
split_length_s = split_length_ms / 1000


class Segment:
    def __init__(self, start, end, text):
        self.start = start
        self.end = end
        self.text = text

    def __repr__(self):
        return f"({self.start}, {self.end}, {self.text})"


def transcribe(file, texts, llm, path, filename, filehash, file_as_dicts):
    if os.path.isfile(path) is True:
        glossary_terms = []
        print(glossary_terms)
        for dict in file_as_dicts:
            if dict["glossary"] is not None:
                glossary_terms.append(dict["glossary"])

        whisper_prompt = list_to_comma(glossary_terms)


        # check file size because only 25Mb/request are allowed for Whisper transcription
        file_size_mb = os.stat(path).st_size / (1024 * 1024)
        texts += f" NEW AUDIO FILE {json.dumps(file)} - CONTENT: "

        # define new dict for transcription
        data = {
            "transcription": {
                "segments":[]
            }
        }

        # if file greater 24Mb we need to split this file into multiple segments
        if float(file_size_mb) > 24.0:
            # get multiple split segments
            segments = split_audio_with_overlap(path, segment_length_ms=split_length_ms, overlap_ms=500)
            for idx, segment in enumerate(segments):
                dir = os.path.join(
                    app.root_path, os.path.join(f"temp/{filehash}/audio")
                )
                if not os.path.exists(dir):
                    os.makedirs(dir)
                path = os.path.join(
                    app.root_path, os.path.join(f"temp/{filehash}/audio", f"audio_{idx}.mp3")
                )
                # save to mp3 format in temp folder
                segment.export(path, format="mp3")

                # Set up AzureChatOpenAI with the required configurations
                audio_file = open(path, "rb")
                response = client.audio.transcriptions.create(
                    file=audio_file,
                    model=AZURE_DEPLOYMENT_WHISPER,
                    response_format="verbose_json",
                    prompt=whisper_prompt,
                    timestamp_granularities=["segment"]
                )

                segments = response.segments
                combined_segments = []

                # to make the array not too large we are merging multiple (n = 4) transcription segments into one
                n = 4
                for i in range(0, len(segments), n):
                    group_segments = list(islice(segments, i, i + n))
                    combined_segments.append(combine_segments(group_segments))
                generated_dict = generate_segment_dict(combined_segments, idx)

                # attach generated dictionary to data dictionary
                data["segments"].extend(generated_dict)
            return data
        else:
            # if audio file is lower than 24mb
            audio_file = open(path, "rb")
            response = client.audio.transcriptions.create(
                file=audio_file,
                model=AZURE_DEPLOYMENT_WHISPER,
                response_format="verbose_json",
                prompt=whisper_prompt,
                timestamp_granularities=["segment"]
            )

            segments = response.segments
            combined_segments = []
            n = 3
            for i in range(0, len(segments), n):
                group_segments = list(islice(segments, i, i + n))
                combined_segments.append(combine_segments(group_segments))

            # define data type
            data = {
                "transcription": {
                    "segments":[]
                }
            }
            new_segments = generate_segment_dict(combined_segments)
            data["transcription"]["segments"] = new_segments
            return data
    else:
        data = None
        print("no audio file")
        return data

# this will generate a better reading timestamp (XX:YY:ZZ)
def convert_timestamp_to_str(ts):
    ts = int(ts)
    return "{:02d}:{:02d}:{:02d}".format(
        ts // 3600,  # Stunden
        (ts % 3600) // 60,  # Minuten
        ts % 60  # Sekunden
    )


# Method to merge multiple segments into one bigger segments to reduce the size of the transcription array
def combine_segments(group_segments):
    start = group_segments[0].start
    end = group_segments[-1].end
    text = ''.join([seg.text for seg in group_segments])
    return Segment(start, end, text)


"""
This method will generate a dictionary over the combined segments
If there are splitted segments we need to adjust the start and end timestamp of the segments because Open AI Whisper will always start at 0 seconds for each segment uplaoded
"""


def generate_segment_dict(combined_segments, idx=0):
    new_segments = []
    for seg in combined_segments:
        start = seg.start
        end = seg.end
        text = seg.text

        if idx > 0:
            start = int(start) + (split_length_s * idx)
            end = int(end) + (split_length_s * idx)

        start_str = convert_timestamp_to_str(start)
        end_str = convert_timestamp_to_str(end)
        new_segments.append({
            "start_timestamp": start_str,
            "end_timestamp": end_str,
            "transcription_text": text
        })
    return new_segments
