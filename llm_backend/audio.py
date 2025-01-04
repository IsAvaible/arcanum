from pydub import AudioSegment


'''
Splits audio into multiple files
    Due to Azure´s limit of 25 Mb for each audio file we need to split audio files into multiple chunks if they exceed this limit
    This method also includes a little overlap so cutted words during a split can be recognized
'''
def split_audio_with_overlap(file_path, segment_length_ms=600000, overlap_ms=10000):
    audio = AudioSegment.from_file(file_path)
    segments = []
    start = 0
    while start < len(audio):
        end = start + segment_length_ms
        segment = audio[start:end + overlap_ms]
        segments.append(segment)
        start += segment_length_ms - overlap_ms  # Move start forward, keeping the overlap
    return segments
