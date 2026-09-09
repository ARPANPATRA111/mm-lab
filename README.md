<div align="center">

# Multimedia Systems Lab

**Explore the data behind every image, sound and frame.**

Python experiments in metadata analysis and multimedia processing.

**Arpan Patra** · Image · Audio · Video

[**Open the browser demo ↗**](https://multimedia-laboratory-nu.vercel.app) · [Explore the datasets](datasets/README.md) · [Frontend source](https://github.com/ARPANPATRA111/mm-lab/tree/frontend/astro-metadata-lab/frontend)

</div>

---

## What this project does

Give the analyzer an image, audio or video file. It identifies the media type, displays readable metadata and can save the result as JSON. Each lab cluster also includes a standalone processing program.

| Lab | Metadata | Processing |
| --- | --- | --- |
| **Image** | Format, size, dimensions, colour mode, DPI and EXIF | Grayscale, half-size resize, threshold, blur, Canny edges, clockwise rotation |
| **Audio** | Format, duration, codec, channels, sample rate, bit depth/bitrate and tags | Stereo to mono, peak normalization, reverse |
| **Video** | Container, duration, resolution, FPS, frame count, codec and audio streams | Grayscale, half-size resize, thumbnail, frames, trim, reverse |

## Quick start

**Requirements:** Python 3.10+, Pillow, NumPy, OpenCV and [FFmpeg](https://ffmpeg.org/download.html). Install FFmpeg separately and make sure `ffprobe -version` works in your terminal.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt

python main.py datasets/images/camera_canon_40d.jpg
```

On macOS/Linux, activate with `source .venv/bin/activate`. On Windows, you can use `.\.venv\Scripts\python.exe` directly if activation is unavailable.

### Analyze any media file

```powershell
python main.py datasets/audio/tagged_128k.mp3
python main.py datasets/video/h264_aac_720p.mp4 --json outputs/video-report.json
```

Example video report, abbreviated:

```text
Media type: video
Container: MP4 / QuickTime
Duration (seconds): 6.0
Width: 1280
Height: 720
Frame rate (fps): 30.0
Frame count: 180
Codec: h264
```

Reports also include file size, available tags and audio-stream details. Missing fields display as `Not available`; JSON uses `null`. Every metadata command supports `--json PATH` and `--help`.

### Run a lab individually

```powershell
python Cluster02-Image-Processing/image_metadata.py datasets/images/gps_dscn0010.jpg
python Cluster03-Audio-Processing/audio_metadata.py datasets/audio/stereo_48k_24bit.wav
python Cluster04-Video-Processing/video_metadata.py datasets/video/multistream_h264.mkv
```

## Try the processing experiments

Each command runs every operation for its media type. Use a **new output directory** for each run; existing files and directories are protected from overwrite.

```powershell
python Cluster02-Image-Processing/image_processing.py datasets/images/camera_canon_40d.jpg --output-dir outputs/images
python Cluster03-Audio-Processing/audio_processing.py datasets/audio/mono_44k_16bit.wav --output-dir outputs/audio
python Cluster04-Video-Processing/video_processing.py datasets/video/h264_aac_720p.mp4 --output-dir outputs/video --start 1 --duration 2
```

| Output | What to expect |
| --- | --- |
| **Images → PNG** | Six images; the sample resizes to 50 × 34 and rotates to 68 × 100 |
| **Audio → WAV** | `mono.wav`, `normalized.wav`, `reversed.wav`; sample rate and duration preserved |
| **Video → AVI + PNG** | Four videos, a thumbnail and about one frame per second; the example trim lasts 2 seconds |

<details>
<summary><strong>Demonstrate stereo-to-mono with the stereo dataset</strong></summary>

The stereo sample is 24-bit. Convert a separate copy to 16-bit before processing:

```powershell
New-Item -ItemType Directory -Force outputs
ffmpeg -n -i datasets/audio/stereo_48k_24bit.wav -c:a pcm_s16le outputs/stereo_16bit.wav
python Cluster03-Audio-Processing/audio_processing.py outputs/stereo_16bit.wav --output-dir outputs/stereo
```

</details>

## Project layout

```text
mm-lab/
├── main.py                         # Consolidated analyzer
├── multimedia/                     # Shared validation, metadata and reports
├── Cluster02-Image-Processing/      # Image metadata + processing
├── Cluster03-Audio-Processing/      # Audio metadata + processing
├── Cluster04-Video-Processing/      # Video metadata + processing
├── datasets/                       # 25 sample media files + provenance
├── requirements.txt
└── README.md
```

## Formats and practical notes

- **Images:** JPEG, PNG, GIF, BMP, TIFF and WebP. HEIC needs an additional Pillow decoder. Processing uses the first frame/page, applies EXIF orientation and saves RGB/grayscale PNGs without original metadata or transparency.
- **Audio:** PCM WAV, MP3, FLAC, OGG, M4A/AAC and Opus, subject to FFprobe support. Processing accepts **mono/stereo 16-bit PCM WAV** and holds the samples in memory. Images and PCM WAV metadata work without FFprobe; WAV tags require it.
- **Video:** MP4, MOV, AVI, MKV, WebM and MPEG/OGV, subject to codec support. **Generated MJPEG AVI videos are silent** and use constant FPS. Source dimensions must be even; half-size dimensions round down to even values. Reversal uses temporary disk space, about 475 MiB for the 720p sample.
- **Reports:** Some frame counts are estimates and are marked accordingly. Metadata probing does not guarantee that every compressed frame is intact. Failed processing can leave partial outputs; rerun into a new directory.

Generated files stay under `outputs/`, which Git ignores. Sample sources and attribution are documented in [datasets/README.md](datasets/README.md).
