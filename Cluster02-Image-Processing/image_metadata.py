import json
import sys
from pathlib import Path

from PIL import ExifTags, Image


def extract_metadata(file_name):
    path = Path(file_name)

    with Image.open(path) as image:
        metadata = {
            "file_name": path.name,
            "file_size": path.stat().st_size,
            "format": image.format,
            "width": image.width,
            "height": image.height,
            "mode": image.mode,
        }

        exif = image.getexif()
        if exif:
            metadata["exif"] = {
                ExifTags.TAGS.get(tag, str(tag)): value
                for tag, value in exif.items()
            }

    return metadata


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python image_metadata.py <image_file>")

    print(json.dumps(extract_metadata(sys.argv[1]), indent=2, default=str))
