import json
import os
from itertools import islice

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from openai import AzureOpenAI

from app import app
from audio import split_audio_with_overlap
from prompts import get_system_prompt

load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_GPT = os.getenv("AZURE_DEPLOYMENT_GPT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
AZURE_DEPLOYMENT_WHISPER = os.getenv("AZURE_DEPLOYMENT_WHISPER")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")

client = AzureOpenAI(azure_endpoint=AZURE_ENDPOINT,
                     api_version=OPENAI_API_VERSION,
                     api_key=AZURE_OPENAI_API_KEY)


class Segment:
    def __init__(self, start, end, text):
        self.start = start
        self.end = end
        self.text = text

    def __repr__(self):
        return f"({self.start}, {self.end}, {self.text})"


def transcribe(file, texts, llm, path, filename, whisper_prompt):
    if texts != "":
        system_prompt_langchain_parser = get_system_prompt("models")
        messages = [
            ("system", "{system_prompt}"),
            ("human", "CONTEXT: {context}"),
        ]
        promptLangchain = ChatPromptTemplate.from_messages(messages).partial(
            system_prompt=system_prompt_langchain_parser
        )
        promptLangchainInvoked = promptLangchain.invoke(
            {"context": texts, "query": "Please give me the list back!"}
        )
        chain = llm
        response = chain.invoke(promptLangchainInvoked)
        whisper_prompt = response.content

    file_size_mb = os.stat(path).st_size / (1024 * 1024)
    texts += f" NEW AUDIO FILE {json.dumps(file)} - CONTENT: "

    data = {
        "context": "transcription",
        "segments": [],
    }

    if float(file_size_mb) > 24.0:
        segments = split_audio_with_overlap(path, segment_length_ms=300000, overlap_ms=500)
        for idx, segment in enumerate(segments):
            print(f"segment {idx}")
            path = os.path.join(
                app.root_path, os.path.join(app.config["UPLOAD_FOLDER"], f"{filename}_{idx}.mp3")
            )
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
            n = 4
            for i in range(0, len(segments), n):
                group_segments = list(islice(segments, i, i + n))
                combined_segments.append(combine_segments(group_segments))
            generated_dict = generate_segment_dict(combined_segments, idx)
            data["segments"].extend(generated_dict)
        return data
    else:

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

        data = {
            "context": "transcription",
            "segments": []
        }
        new_segments = generate_segment_dict(combined_segments)
        data["segments"] = new_segments
        return data


def convert_timestamp_to_str(ts):
    ts = int(ts)
    return "{:02d}:{:02d}:{:02d}".format(
        ts // 3600,  # Stunden
        (ts % 3600) // 60,  # Minuten
        ts % 60  # Sekunden
    )


def combine_segments(group_segments):
    start = group_segments[0].start
    end = group_segments[-1].end
    text = ''.join([seg.text for seg in group_segments])
    return Segment(start, end, text)


def generate_segment_dict(combined_segments, idx=0):
    new_segments = []
    for seg in combined_segments:
        start = seg.start
        end = seg.end
        text = seg.text

        if idx > 0:
            start = int(start) + (300 * idx)
            end = int(end) + (300 * idx)

        start_str = convert_timestamp_to_str(start)
        end_str = convert_timestamp_to_str(end)
        new_segments.append({
            "start_timestamp": start_str,
            "end_timestamp": end_str,
            "transcription_text": text
        })
    return new_segments
