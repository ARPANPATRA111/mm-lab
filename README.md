# Multimedia Systems Lab

**Student:** Arpan Patra (GitHub: ARPANPATRA111)

**Project:** Python image, audio and video analyzer and processing experiments

The assignment progresses from image metadata and basic processing to audio,
video, and a consolidated multimedia analyzer. The capstone validates a local
file, identifies its media type, prints readable metadata, and optionally writes
a structured JSON report. Existing standalone metadata commands still print JSON.

## Implemented clusters

| Location | Implementation |
| --- | --- |
| Cluster02-Image-Processing | Image metadata and six image operations |
| Cluster03-Audio-Processing | Audio metadata and three PCM WAV operations |
| Cluster04-Video-Processing | Video metadata and six video operations |
| `main.py` | Consolidated analyzer, shared through `multimedia/` |

The other cluster directories and `Capstone-Projects/` remain placeholders.
Text processing and voice cloning are outside this implementation. The separate
`frontend/astro-metadata-lab` branch is independent of this Python work.

## Structure

```text
main.py
multimedia/
  common.py             # Validation, FFprobe, readable reports, JSON output
  metadata.py           # Content detection and normalized metadata
  cli.py                # CLI arguments and error handling
Cluster02-Image-Processing/
  image_metadata.py
  image_processing.py
Cluster03-Audio-Processing/
  audio_metadata.py
  audio_processing.py
Cluster04-Video-Processing/
  video_metadata.py
  video_processing.py
datasets/               # Existing images, audio, video and provenance README
tests/test_multimedia.py
docs/experimental-results/verification.md
requirements.txt
outputs/                # Generated locally; ignored by Git
```

## Setup

Use Python 3.10 or newer (verified on Python 3.12). Pillow decodes images, NumPy
handles sample arrays, and headless OpenCV provides Canny edges and video I/O.
The headless package does not open desktop windows. Tests use standard-library
`unittest`; no separate testing dependency is needed.

Windows PowerShell, from the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

If activation is unavailable, substitute `.\.venv\Scripts\python.exe` for
`python` in the commands. On Linux/macOS, activate with `source .venv/bin/activate`.
If the virtual environment already exists, reuse it.

Install [FFmpeg](https://ffmpeg.org/download.html) separately and ensure the
directory containing `ffmpeg` and `ffprobe` is on `PATH`. Check both commands:

```text
ffmpeg -version
ffprobe -version
```

FFprobe is required for compressed audio and video metadata, video validation,
and the full test suite. PCM WAV metadata and image analysis still work without
FFprobe. WAV tags are included when FFprobe is available. OpenCV uses the codecs
available in its installed build for video processing; installing the FFmpeg
command alone does not add OpenCV codecs.

## Analyze a file

```powershell
python main.py datasets/images/camera_canon_40d.jpg
python main.py datasets/audio/tagged_128k.mp3
python main.py datasets/video/h264_aac_720p.mp4 --json outputs/reports/video.json
```

The video example includes these fields (plus file details, bitrate and tags):

```text
Media type: video
Container: MP4 / QuickTime
Duration (seconds): 6.0
Width: 1280
Height: 720
Frame rate (fps): 30.0
Frame count: 180
Frame count estimated: False
Codec: h264
```

The image example is a 100 x 68 RGB JPEG with 72 x 72 DPI and Canon EXIF data.
`datasets/audio/mono_44k_16bit.wav` reports 5 seconds, one channel, 44,100 Hz,
16-bit PCM and 220,500 frames. JSON is the same flat metadata dictionary shown
in the readable report, with nested EXIF/tags/audio-stream fields. File sizes
are bytes, bitrates are bits/second, durations are seconds and frame rates are
frames/second. Missing values use JSON `null` (displayed as `Not available`);
absent collections use `{}` or `[]`.

Standalone commands, including the original positional invocation:

```powershell
python Cluster02-Image-Processing/image_metadata.py datasets/images/gps_dscn0010.jpg
python Cluster03-Audio-Processing/audio_metadata.py datasets/audio/stereo_48k_24bit.wav
python Cluster03-Audio-Processing/audio_metadata.py datasets/audio/tagged_aac.m4a
python Cluster04-Video-Processing/video_metadata.py datasets/video/multistream_h264.mkv
```

All metadata commands accept `--json PATH`. Parent directories are created;
existing report files are refused to protect previous work. Successful commands
exit with 0, input/dependency/output failures with 1, and argument errors with 2.
Use `--help` on any command for its options.

## Supported metadata

| Type | Formats | Fields |
| --- | --- | --- |
| Image | JPEG, PNG, GIF, BMP, TIFF, WebP, subject to Pillow decoder support | Filename, size, format, dimensions, colour mode, DPI, named EXIF including camera/exposure/date and GPS fields |
| Audio | PCM WAV; MP3, FLAC, OGG/Vorbis, M4A/AAC, raw AAC, Opus when FFprobe supports them | Filename, size, format, duration, codec, channels, sample rate, bit depth when meaningful, bitrate and tags |
| Video | MP4/M4V, MOV, AVI, MKV, WebM, MPG/MPEG, OGV when FFprobe supports them | Filename, size, container, duration, dimensions, FPS, frame count, codec, bitrate, tags and all audio streams |

The extension must be in the supported list, then Pillow or FFprobe inspects
the content. Shared audio/video containers are classified by their streams;
attached album artwork does not turn audio into video. Image extensions route
to Pillow for decoder validation. HEIC/HEIF extensions are recognized but the
provided environment has no Pillow HEIF decoder: the dataset HEIC sample returns
an explanatory error. There is no bundled HEIF plugin.

Image and WAV payloads are read during validation. FFprobe metadata probing is
not a full compressed-stream integrity scan; damage later in a compressed file
may only surface during playback/processing. No text/subtitle-only input is
accepted. Dataset coverage is recorded in [verification.md](docs/experimental-results/verification.md).

## Processing experiments

Each program runs all its operations. Choose a **new output directory** each
time: an existing directory is refused, even when empty. Outputs never replace
source media. The default directories are `outputs/images`, `outputs/audio`,
and `outputs/video` and all `outputs/` content is ignored by Git.

```powershell
python Cluster02-Image-Processing/image_processing.py datasets/images/camera_canon_40d.jpg --output-dir outputs/image-demo
python Cluster03-Audio-Processing/audio_processing.py datasets/audio/mono_44k_16bit.wav --output-dir outputs/audio-demo
python Cluster04-Video-Processing/video_processing.py datasets/video/h264_aac_720p.mp4 --output-dir outputs/video-demo --start 1 --duration 2
```

Each successful operation prints `Saved: <path>`.

| Program | Generated outputs |
| --- | --- |
| Image | `grayscale.png`, `resize_half.png`, `threshold.png`, `gaussian_blur.png`, `canny_edges.png`, `rotate_clockwise.png` |
| Audio | `mono.wav`, `normalized.wav`, `reversed.wav` |
| Video | `grayscale.avi`, `resize_half.avi`, `thumbnail.png`, `frames/frame_NNNNNN.png`, `trimmed.avi`, `reversed.avi` |

Image processing applies EXIF orientation, converts to RGB, then produces PNGs.
Half size uses integer division with a minimum of one pixel; the example becomes
50 x 34. Thresholding uses 128, Gaussian blur radius 2, Canny thresholds 100/200,
and rotation is 90 degrees clockwise (the example becomes 68 x 100). Processing
uses the first frame/page of animated or multipage images; transparency and
original EXIF are not retained in the generated RGB/grayscale PNGs.

Audio processing accepts **mono or stereo 16-bit PCM WAV**. Mono conversion
averages channels; normalization scales the peak to 32767 (silence stays silent);
reversal reverses time frames while retaining channel order. All outputs keep
the source sample rate and frame count; normalization/reversal retain channel
count and mono output has one channel. Tags are not copied. Audio is loaded into
memory, so use small lab samples. The repository's 8-bit and 24-bit WAV files are
valid metadata inputs but are deliberately rejected by this processing exercise.

To demonstrate stereo-to-mono using the existing stereo 24-bit sample, first
convert it into a separate 16-bit WAV (FFmpeg refuses overwrite without `-y`):

```powershell
New-Item -ItemType Directory -Force outputs
ffmpeg -n -i datasets/audio/stereo_48k_24bit.wav -c:a pcm_s16le outputs/stereo_16bit.wav
python Cluster03-Audio-Processing/audio_processing.py outputs/stereo_16bit.wav --output-dir outputs/stereo-demo
```

Video outputs are **silent MJPEG AVI files: the original audio stream is omitted**.
They use a constant frame rate from OpenCV. The example creates 180-frame,
6-second grayscale/resized/reversed videos and a 60-frame, 2-second trim.
Half size is 640 x 360. The thumbnail is the first frame; representative PNGs
are sampled at approximately 0, 1, 2, ... seconds using frame index/FPS, with six
PNGs for the example. Trim includes frame times in `[start, start + duration)`
and stops at the end of the source. Defaults are start 0 and duration 2 seconds.

Forward processing streams frames. Reversal spools raw BGR frames to a temporary
file inside the output directory, then reads them backwards. RAM holds only a
few frames; temporary disk use is approximately `width * height * 3 * frames`
(about 475 MiB for the 720p example). The spool closes and is removed on success
or failure. If processing fails, partial named outputs can remain for inspection;
rerun into a new directory.

Video processing requires even source dimensions of at least 4 pixels. Half-size
dimensions are rounded down to even values for MJPEG (854 becomes 426). Variable
frame rate timestamps, subtitles, original tags and audio are not retained.
Only the primary video stream is processed. Frame counts in metadata are taken
from the container when available, otherwise estimated from FPS and duration and
explicitly marked `frame_count_estimated`. Missing FPS/duration/count can remain
`null`. Metadata probing has a 60-second timeout. MakerNote binary EXIF payloads
are omitted to keep image reports manageable.

## Verification

```powershell
python -m unittest discover -s tests -v
python -m compileall -q main.py multimedia Cluster02-Image-Processing Cluster03-Audio-Processing Cluster04-Video-Processing tests
python -m pip check
git diff --check
```

Tests use the existing 24 supported dataset files, create a stereo 16-bit fixture
from the existing tone, and keep generated media in an automatically cleaned
temporary directory. They invoke every standalone program and the capstone,
validate JSON, exercise errors and absent optional metadata, compare processed
pixels/audio samples, and decode every generated video frame. FFprobe is required;
tests fail clearly if it is unavailable rather than silently skipping coverage.

See [the verification record](docs/experimental-results/verification.md) for commands,
results, tested versions and remaining limits. Dataset provenance remains in
[datasets/README.md](datasets/README.md). API references:
[Pillow Image](https://pillow.readthedocs.io/en/stable/reference/Image.html) and
[FFprobe](https://ffmpeg.org/ffprobe.html).
