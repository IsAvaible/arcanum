import math
import os
import subprocess

import cv2

from app import app
from image import encode_image, image_to_openai

split_secs = 100

"""
OpenAI has a limit of 50 pictures each request. If we have a 10 min video that would be too less information.
Because of that we need to split longer videos into multiple segments.
If a video is over 100 seconds we are splitting it into multiple segments. Each segment will be approxametly 100 seconds long.
From these segments we are getting 50 frames (1 Frame every 2 Seconds)

For cutting the videos we are using ffmpeg which is the most used software for video processing.
"""


def cut_video_segments(input_file, filehash, segment_duration=split_secs):
    # define ouput
    output_path = os.path.join(
        app.root_path, os.path.join(f"temp/{filehash}/", "video_segments")
    )
    if not os.path.exists(output_path):
        os.makedirs(output_path)
    output_pattern = os.path.join(output_path, "videos_%04d.mp4")

    command = [
        "ffmpeg",
        "-v", "quiet",  # less logs
        "-i", input_file,  # Input file
        "-c", "copy",  # Copy codec to avoid re-encoding
        "-map", "0",  # Map all streams
        "-f", "segment",  # Segment format
        "-segment_time", str(segment_duration),  # Duration of each segment
        "-reset_timestamps", "1",  # Reset timestamps for each segment
        output_pattern  # Output file pattern
    ]

    # run ffmpeg process
    try:
        subprocess.run(command, check=True)
        return output_path
    except subprocess.CalledProcessError as e:
        print(f"Error occurred while splitting the video: {e}")


def extract_data_from_video(video_path, filehash):
    # define ouput
    single_video = video_path
    frames_path = os.path.join(
        app.root_path, os.path.join(f"temp/{filehash}/", "frames")
    )
    if not os.path.exists(frames_path):
        os.makedirs(frames_path)

    # Calculate scale
    cam = cv2.VideoCapture(single_video)
    fps = cam.get(cv2.CAP_PROP_FPS)
    total_frames = int(cam.get(cv2.CAP_PROP_FRAME_COUNT))
    # get duration of video to check if we need splitting
    duration = total_frames / fps

    # Scale video down to width of 320 and the corresponding height based on the aspect ratio
    # get one frame each 2 seconds if video is under 10 minutes
    # get one frame each 5 seconds if video is over 10 minutes
    if duration < 600:
        vf_filter = "fps=1/2 ,scale=320:-1"
    else:
        vf_filter = "fps=1/10 ,scale=320:-1"

    output_pattern = os.path.join(frames_path, "frame_%04d.jpg")

    command = [
        "ffmpeg",
        "-v", "quiet",  # less logs
        "-y",  # override file if exists
        "-i", single_video,  # input video
        "-vf", vf_filter,  # apply filter
        "-vsync", "0",  # apply filter
        output_pattern  # define ouput pattern
    ]

    try:
        subprocess.run(command, check=True)
        print(f"Saved frames: {output_pattern} ")
    except subprocess.CalledProcessError as e:
        print(f"Error FFMPEG (Frame Extraction): {e}")

    # we also need to transcribe the audio in the video
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
        "-i", f'{single_video}',  # set input file
        "-b:a", '192k',  # set input file
        "-acodec", "libmp3lame",  # force mp3
        audio_output  # define output
    ]

    try:
        subprocess.run(command, check=True)
        print(f"Saved Audio in {audio_output}")
    except subprocess.CalledProcessError as e:
        print(f"Error FFMPEG (Audio Extraction): {e}")

    # return path of frames and audio file
    return frames_path, audio_output, duration


def process_segments(frames, transcription, duration):
    seconds = round(duration / len(frames))

    print("SECONDS " + str(seconds))

    print(f"Frame Count:{str(len(frames))}")
    # calculate how many rounds we need to analyze the frames
    # here we are dividing by 49 and rounding that value up
    frame_segments = math.floor(len(frames) / 25)
    print(f"Segment Count: {frame_segments}")

    data = {
        "video_summary": {
            "segments": []
        }
    }

    print(transcription)

    if transcription is None:
        trans = "No transcription provided!"
    else:
        trans = dict_to_text(transcription)

    transcription = {
        "type": "text",
        "text": f"This is the transcription of the audio:\n{trans}"
    }

    if frame_segments > 0:
        # prompt_dict will include all frames that we need to analyze
        prompt_dict = []
        # iterate over all segments (frame_count/50)
        video_summary = ""

        total_iterations = len(frames)
        max_group_size = 25

        # Berechnung der Gruppen
        groups = [max_group_size] * (total_iterations // max_group_size)
        remainder = total_iterations % max_group_size

        if remainder > 0:
            groups.append(remainder)

        start = 0
        step = 0
        for group in groups:
            prompt_dict.clear()
            if len(data["video_summary"]["segments"]) == 0:
                prompt_dict.append(transcription)
                prompt_dict.append({
                    "type": "text",
                    "text": f"Here is part {str(step)} of {str(total_iterations)}. What are all frames showing, be as detailed as possible but please combine everything in a normal text"
                })
            else:
                prompt_dict = [
                    transcription,
                    {
                        "type": "text",
                        "text": f"Here is the summary of the other parts: {video_summary}. Here is part {str(step)} of {str(total_iterations)}. What are all frames showing, be as detailed as possible but please combine everything in a normal text"
                    }
                ]

            start_timestamp = convert_timestamp_to_str((start) * seconds)
            end_timestamp = convert_timestamp_to_str((start + group) * seconds)
            for i in range(start, start + group):
                encoding = encode_image(frames[i])
                base64_image = {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{encoding}",
                        "detail": "auto"
                    }
                }
                prompt_dict.append(base64_image)
            sum_part = image_to_openai(prompt_dict)
            summary = {
                "start_timestamp": start_timestamp,
                "end_timestamp": end_timestamp,
                "content": sum_part,
            }
            video_summary = video_summary + f"Video Summary Part {str(step)} of {str(frame_segments)} (Timestamps: {start_timestamp} - {end_timestamp}):\n" + sum_part + "\n\n"
            data["video_summary"]["segments"].append(summary)
            start += group
            step = step + 1
    else:
        start_timestamp = convert_timestamp_to_str(0)
        end_timestamp = convert_timestamp_to_str(len(frames) * seconds)
        prompt_dict = [
            transcription,
            {
                "type": "text",
                "text": "I have a video file that needs analysis. Please provide detailed insights. Key objects, actions, or events detected in the video. Sentiment analysis, if applicable to the content. Summary of the video’s main theme or message. Brands or Machine Names or Model numbers. The video should be processed for accuracy, and any detected patterns, anomalies, or highlights should be noted."
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
        summary = {
            "start_timestamp": start_timestamp,
            "end_timestamp": end_timestamp,
            "content": video_summary,
        }
        data["video_summary"]["segments"].append(summary)

    return data


# method to get all frames in a directory
def get_all_frames_in_dir(path):
    f = []
    for (dirpath, dirnames, filenames) in os.walk(path):
        for file in filenames:
            f.append(os.path.join(dirpath, file))
    return f


# method to get all video segments in a directory
def get_all_video_segments_in_dir(path):
    f = []
    for (dirpath, dirnames, filenames) in os.walk(path):
        for file in filenames:
            f.append(os.path.join(dirpath, file))
    return f


def dict_to_text(data):
    print(data)
    text = []
    for segment in data["transcription"]["segments"]:
        start = segment.get("start_timestamp", "Unbekannt")
        end = segment.get("end_timestamp", "Unbekannt")
        transcription = segment.get("transcription_text", "Kein Text vorhanden.")
        text.append(f"From {start} to {end}:\n{transcription}\n\n")

    return "\n\n".join(text)


def convert_timestamp_to_str(ts):
    ts = int(ts)
    return "{:02d}:{:02d}:{:02d}".format(
        ts // 3600,  # Stunden
        (ts % 3600) // 60,  # Minuten
        ts % 60  # Sekunden
    )
