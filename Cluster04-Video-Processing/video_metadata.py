import json
import subprocess
import sys
from pathlib import Path


def extract_metadata(file_name):
    path = Path(file_name)
    command = [
        "ffprobe",
        "-v", "error",
        "-show_format",
        "-show_streams",
        "-of", "json",
        str(path),
    ]

    result = subprocess.run(command, capture_output=True, text=True, check=True)
    metadata = json.loads(result.stdout)
    metadata["file_name"] = path.name
    metadata["file_size"] = path.stat().st_size
    return metadata


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python video_metadata.py <video_file>")

    print(json.dumps(extract_metadata(sys.argv[1]), indent=2))
