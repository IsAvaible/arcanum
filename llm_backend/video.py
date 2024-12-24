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
        "-v", "quiet", # less logs
        "-i", input_file,  # Input file
        "-c", "copy",  # Copy codec to avoid re-encoding
        "-map", "0",  # Map all streams
        "-f", "segment",  # Segment format
        "-segment_time", str(segment_duration),  # Duration of each segment
        "-reset_timestamps", "1",  # Reset timestamps for each segment
        output_pattern  # Output file pattern
    ]

    #run ffmpeg process
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


    # get segments if video longer 100 secs
    if (duration > split_secs):
        segments_path = cut_video_segments(single_video, filehash)
        segments = get_all_video_segments_in_dir(segments_path)
    else:
        segments = [single_video]


    # iterate over segments
    for i, video in segments:

        # Scale video down to width of 320 and the corresponding height based on the aspect ratio
        # get one frame each 2 seconds
        vf_filter = "fps=1/2 ,scale=320:-1"

        # FFmpeg-Befehl ausführen
        output_pattern = os.path.join(frames_path, "frame_%04d.jpg")

        # count the frames that have been already saved
        counter = sum(1 for item in os.listdir(frames_path) if os.path.isfile(os.path.join(frames_path, item)))

        command = [
            "ffmpeg",
            "-v", "quiet", # less logs
            "-y", #override file if exists
            "-i", video, # input video
            "-vf", vf_filter, # apply filter
            "-start_number", str(counter), # set start counter for the frames
            output_pattern # define ouput pattern
        ]

        try:
            subprocess.run(command, check=True)
            i = i + 1
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
        "-v", "quiet", #less logs
        "-y", # override file
        "-i", single_video, # set input file
        "-vn",
        audio_output #define output
    ]

    try:
        subprocess.run(command, check=True)
        print(f"Saved Audio in {audio_output}")
    except subprocess.CalledProcessError as e:
        print(f"Error FFMPEG (Audio Extraction): {e}")

    # return path of frames and audio file
    return frames_path, audio_output


# todo bereits zusammengefasste frames hinzufügen und transcription
def process_segments(frames, result_dict, transcription):

    print(f"Frame Count:{str(len(frames))}")
    # calculate how many rounds we need to analyze the frames
    # here we are dividing by 49 and rounding that value up
    frame_segments = math.floor(len(frames) / 49)
    print(f"Segment Count: {frame_segments}")
    video_summary = ""

    if frame_segments > 0:
        # prompt_dict will include all frames that we need to analyze
        prompt_dict = []

        # iterate over all segments (frame_count/50)
        for i in range(0, frame_segments):
            print("Analyzing Segment " + str(i) + " / " + str(frame_segments))
            prompt_dict.clear()
            prompt_dict = [
                {
                    "type": "text",
                    "text": f"Here is part {str(i)} of {str(frame_segments)}. What are all frames showing, be as detailed as possible but please combine everything in a normal text"
                }
            ]

            for j in range(0 + (50 * i), 49 * (i + 1)):
                # images need to be base64 encoded otherwise Azure OpenAI wont understand them
                encoding = encode_image(frames[j])
                base64_image = {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{encoding}",
                        "detail": "auto"
                    }
                }
                prompt_dict.append(base64_image)
            sum_part = image_to_openai(prompt_dict)
            print(f"Segment {i} - {sum_part}")
            video_summary = sum_part + " "
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

    print(f"Complete Summary - {video_summary}")
    #result = video_openai(video_summary, transcription)
    result = video_summary
    print(f"Complete Summary after LLM - {result}")
    result_dict["video_summary"] = result
    single_dict = result_dict
    return single_dict


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
