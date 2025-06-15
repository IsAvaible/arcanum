from pydub import AudioSegment


def split_audio_with_overlap(file_path, segment_length_ms=600000, overlap_ms=10000):
    """
    Splits an audio file into multiple segments with overlap.

    Azure imposes a 25 MB limit for each audio file, requiring larger files
    to be split into smaller chunks. This method also introduces a small
    overlap between consecutive segments to ensure that words cut off during
    splitting can still be recognized in the next segment.

    Parameters:
        file_path (str): The path to the audio file to be split.
        segment_length_ms (int): The length of each segment in milliseconds.
                                 Default is 600,000 ms (10 minutes).
        overlap_ms (int): The overlap between consecutive segments in milliseconds.
                          Default is 10,000 ms (10 seconds).

    Returns:
        List[AudioSegment]: A list of audio segments with overlap applied.
    """
    # Load the audio file
    audio = AudioSegment.from_file(file_path)

    # Initialize variables
    segments = []  # List to store the resulting audio segments
    start = 0  # Starting point for the current segment in milliseconds

    # Loop to create segments until the end of the audio file is reached
    while start < len(audio):
        # Calculate the endpoint for the current segment, including overlap
        end = start + segment_length_ms
        segment = audio[start:end + overlap_ms]  # Extract the segment with overlap

        # Append the segment to the list
        segments.append(segment)

        # Move the start point forward, accounting for the overlap
        start += segment_length_ms - overlap_ms

    # Return the list of segments
    return segments
