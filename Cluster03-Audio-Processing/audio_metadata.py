import json
import sys
import wave
from pathlib import Path


def extract_metadata(file_name):
    path = Path(file_name)

    with wave.open(str(path), "rb") as audio:
        channels = audio.getnchannels()
        sample_width = audio.getsampwidth()
        sample_rate = audio.getframerate()
        frames = audio.getnframes()

    return {
        "file_name": path.name,
        "file_size": path.stat().st_size,
        "channels": channels,
        "sample_width_bits": sample_width * 8,
        "sample_rate": sample_rate,
        "frames": frames,
        "duration_seconds": round(frames / sample_rate, 3),
        "bit_rate": channels * sample_width * 8 * sample_rate,
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python audio_metadata.py <wav_file>")

    print(json.dumps(extract_metadata(sys.argv[1]), indent=2))
