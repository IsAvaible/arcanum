import json
import os

from dotenv import load_dotenv
from langchain_community.document_loaders.parsers.audio import AzureOpenAIWhisperParser
from langchain_core.documents.base import Blob
from langchain_core.prompts import ChatPromptTemplate

from app import app
from audio import split_audio_with_overlap
from prompts import get_system_prompt


load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT_GPT = os.getenv("AZURE_DEPLOYMENT_GPT")
AZURE_DEPLOYMENT_EMBEDDING = os.getenv("AZURE_DEPLOYMENT_EMBEDDING")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT_WHISPER")
OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION")


def transcribe(file, texts, llm, path, filename, whisper_prompt):
    # if texts not empty -> try to get model numbers etc. by Text content
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
    # split if 24mb or greater

    partialTranscription = []

    if float(file_size_mb) > 24.0:
        # split files
        segments = split_audio_with_overlap(path, segment_length_ms=300000, overlap_ms=500)
        # save segments to filesystem
        for idx, segment in enumerate(segments):
            if partialTranscription:
                partial_transcript_to_context = partialTranscription[-1][-200:]
                print("partialTranscription:"+str(partial_transcript_to_context)+"\n\n")
            print(f"segment {idx}")
            path = os.path.join(
                app.root_path, os.path.join(app.config["UPLOAD_FOLDER"], f"{filename}_{idx}.mp3")
            )
            segment.export(path, format="mp3")
            audio_blob = Blob(path=path)
            # Set up AzureChatOpenAI with the required configurations
            parser = AzureOpenAIWhisperParser(
                azure_endpoint=AZURE_ENDPOINT,
                deployment_name=AZURE_DEPLOYMENT,
                api_version=OPENAI_API_VERSION,
                prompt=whisper_prompt#+" Text: "+ partial_transcript_to_context
            )
            # Assuming the client has a method to handle audio transcription similar to the OpenAI client
            transcription_documents = parser.parse(blob=audio_blob)

            partialTranscription.append(transcription_documents[0].page_content)
    else:
        # transcribe full file
        audio_blob = Blob(path=path)
        # Set up AzureChatOpenAI with the required configurations
        parser = AzureOpenAIWhisperParser(
            azure_endpoint=AZURE_ENDPOINT,
            deployment_name=AZURE_DEPLOYMENT,
            api_version=OPENAI_API_VERSION,
            prompt=whisper_prompt
        )
        # Assuming the client has a method to handle audio transcription similar to the OpenAI client
        transcription_documents = parser.parse(blob=audio_blob)
        partialTranscription.append(transcription_documents[0].page_content)
    return partialTranscription