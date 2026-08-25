import wasmUrl from "mediainfo.js/MediaInfoModule.wasm?url";
import { compactItems, extensionOf, formatBytes, formatDuration, formatRate } from "../../lib/format";
import type { ExtractionResult, MetadataItem } from "../../types/metadata";

type Track = Record<string, unknown> & { "@type"?: string };
type MediaInfoObject = { media?: { track?: Track[] } };

const text = (track: Track | undefined, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = track?.[key];
    if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  }
  return undefined;
};

const number = (track: Track | undefined, ...keys: string[]): number | undefined => {
  const value = text(track, ...keys);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export async function extractVideoMetadata(file: File): Promise<ExtractionResult> {
  // Both the JavaScript wrapper and WASM parser are requested only after a video page receives a file.
  const { default: createMediaInfo } = await import("mediainfo.js");
  const mediaInfo = await createMediaInfo({
    format: "object",
    full: false,
    locateFile: () => wasmUrl,
  });
  let result: MediaInfoObject;
  try {
    result = await mediaInfo.analyzeData(file.size, async (size, offset) =>
      new Uint8Array(await file.slice(offset, offset + size).arrayBuffer()),
    ) as MediaInfoObject;
  } finally {
    mediaInfo.close();
  }
  const tracks = result.media?.track ?? [];
  const general = tracks.find((track) => track["@type"] === "General");
  const videos = tracks.filter((track) => track["@type"] === "Video");
  const audios = tracks.filter((track) => track["@type"] === "Audio");
  const subtitles = tracks.filter((track) => track["@type"] === "Text");
  const video = videos[0];
  const audio = audios[0];
  const width = number(video, "Width");
  const height = number(video, "Height");
  const duration = number(general, "Duration") ?? number(video, "Duration");
  const videoItems: MetadataItem[] = compactItems([
    { label: "Codec", value: text(video, "Format_Commercial_IfAny", "Format", "CodecID") },
    { label: "Profile", value: text(video, "Format_Profile") },
    { label: "Resolution", value: width && height ? `${width} × ${height}` : undefined },
    { label: "Display aspect", value: text(video, "DisplayAspectRatio_String", "DisplayAspectRatio") },
    { label: "Frame rate", value: text(video, "FrameRate_String", "FrameRate") },
    { label: "Bitrate", value: number(video, "BitRate") ? formatRate(number(video, "BitRate"), "bps") : undefined },
    { label: "Pixel format", value: text(video, "ColorSpace", "ChromaSubsampling") },
    { label: "Bit depth", value: text(video, "BitDepth_String", "BitDepth") },
    { label: "Rotation", value: text(video, "Rotation_String", "Rotation") },
  ]);
  const audioItems: MetadataItem[] = compactItems([
    { label: "Codec", value: text(audio, "Format_Commercial_IfAny", "Format", "CodecID") },
    { label: "Profile", value: text(audio, "Format_Profile") },
    { label: "Bitrate", value: number(audio, "BitRate") ? formatRate(number(audio, "BitRate"), "bps") : undefined },
    { label: "Sample rate", value: number(audio, "SamplingRate") ? formatRate(number(audio, "SamplingRate"), "Hz") : undefined },
    { label: "Channels", value: text(audio, "Channels_String", "Channels") },
    { label: "Language", value: text(audio, "Language_String", "Language") },
  ]);

  return {
    sections: [
      {
        title: "File & container",
        description: "A container can hold several independently encoded streams.",
        items: compactItems([
          { label: "File name", value: file.name },
          { label: "File size", value: formatBytes(file.size) },
          { label: "MIME type", value: file.type || "Not reported" },
          { label: "Extension", value: extensionOf(file.name) },
          { label: "Container", value: text(general, "Format_Commercial_IfAny", "Format") },
          { label: "Duration", value: duration === undefined ? undefined : formatDuration(duration) },
          { label: "Overall bitrate", value: number(general, "OverallBitRate") ? formatRate(number(general, "OverallBitRate"), "bps") : undefined },
          { label: "Encoded by", value: text(general, "Encoded_Application_String", "Encoded_Library_String") },
          { label: "Created", value: text(general, "Encoded_Date", "Tagged_Date") },
        ]),
      },
      { title: "Primary video stream", items: videoItems },
      { title: "Primary audio stream", items: audioItems },
      {
        title: "Stream map",
        items: [
          { label: "Video streams", value: videos.length },
          { label: "Audio streams", value: audios.length },
          { label: "Subtitle streams", value: subtitles.length },
          { label: "Total tracks", value: tracks.length },
        ],
      },
    ],
    notices: !video ? [{ tone: "info", title: "No video stream detected", message: "The container was readable, but MediaInfo did not report a video track." }] : undefined,
    raw: result,
  };
}
