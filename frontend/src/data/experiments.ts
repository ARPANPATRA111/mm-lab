export type ExperimentKind = "image" | "audio" | "video";

export interface Experiment {
  id: `${ExperimentKind}-metadata`;
  eyebrow: string;
  title: string;
  summary: string;
  href: string;
  accepts: string;
  number: string;
  concepts: string[];
  accent: string;
}

export const experiments: Experiment[] = [
  {
    id: "image-metadata",
    eyebrow: "Pixels + provenance",
    title: "Image metadata",
    summary: "Read dimensions, camera settings, dates, GPS coordinates, and embedded EXIF, IPTC, XMP, or ICC records.",
    href: "/experiments/image-metadata",
    accepts: "JPEG, PNG, WebP, TIFF and supported camera formats",
    number: "01",
    concepts: ["EXIF", "Color profile", "GPS"],
    accent: "violet",
  },
  {
    id: "audio-metadata",
    eyebrow: "Signals + identity",
    title: "Audio metadata",
    summary: "Inspect codecs, sample rate, channels, bitrate, duration, descriptive tags, and embedded cover artwork.",
    href: "/experiments/audio-metadata",
    accepts: "MP3, WAV, FLAC, M4A, Ogg and other supported audio",
    number: "02",
    concepts: ["Codec", "Sample rate", "ID3"],
    accent: "cyan",
  },
  {
    id: "video-metadata",
    eyebrow: "Containers + streams",
    title: "Video metadata",
    summary: "Map a file's container into its video, audio, and subtitle streams with codec, timing, and resolution details.",
    href: "/experiments/video-metadata",
    accepts: "MP4, WebM, MOV, MKV and MediaInfo-supported video",
    number: "03",
    concepts: ["Container", "Frame rate", "Streams"],
    accent: "amber",
  },
];

export const getExperiment = (id: Experiment["id"]): Experiment => {
  const experiment = experiments.find((entry) => entry.id === id);
  if (!experiment) throw new Error(`Unknown experiment: ${id}`);
  return experiment;
};
