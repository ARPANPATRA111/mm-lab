import { parseBlob } from "music-metadata";
import { compactItems, extensionOf, formatBytes, formatDuration, formatRate } from "../../lib/format";
import type { ExtractionResult, MetadataItem } from "../../types/metadata";

const list = (value: string[] | undefined): string | undefined => value?.filter(Boolean).join(", ") || undefined;

function safeRaw(metadata: Awaited<ReturnType<typeof parseBlob>>): unknown {
  return sanitize({
    format: metadata.format,
    common: {
      ...metadata.common,
      picture: metadata.common.picture?.map((picture) => ({
        format: picture.format,
        type: picture.type,
        description: picture.description,
        size: `${picture.data.byteLength} bytes`,
      })),
    },
    native: metadata.native,
    quality: metadata.quality,
  });
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 7) return "[nested metadata]";
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) return `[binary data: ${value.byteLength} bytes]`;
  if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitize(item, depth + 1)]));
  }
  return value;
}

export async function extractAudioMetadata(file: File): Promise<ExtractionResult> {
  const metadata = await parseBlob(file, { duration: true });
  const { format, common } = metadata;
  const technical: MetadataItem[] = compactItems([
    { label: "Container", value: format.container },
    { label: "Codec", value: format.codec },
    { label: "Codec profile", value: format.codecProfile },
    { label: "Duration", value: format.duration === undefined ? undefined : formatDuration(format.duration) },
    { label: "Bitrate", value: format.bitrate === undefined ? undefined : formatRate(format.bitrate, "bps") },
    { label: "Sample rate", value: format.sampleRate === undefined ? undefined : formatRate(format.sampleRate, "Hz") },
    { label: "Channels", value: format.numberOfChannels },
    { label: "Bit depth", value: format.bitsPerSample === undefined ? undefined : `${format.bitsPerSample}-bit` },
    { label: "Lossless", value: format.lossless === undefined ? undefined : format.lossless ? "Yes" : "No" },
  ]);
  const descriptive: MetadataItem[] = compactItems([
    { label: "Title", value: common.title },
    { label: "Artist", value: common.artist },
    { label: "Album", value: common.album },
    { label: "Album artist", value: common.albumartist },
    { label: "Track", value: common.track.no ? `${common.track.no}${common.track.of ? ` of ${common.track.of}` : ""}` : undefined },
    { label: "Disc", value: common.disk.no ? `${common.disk.no}${common.disk.of ? ` of ${common.disk.of}` : ""}` : undefined },
    { label: "Year", value: common.year },
    { label: "Genre", value: list(common.genre) },
    { label: "Composer", value: list(common.composer) },
    { label: "Encoder", value: format.tool ?? common.encodedby ?? common.encodersettings },
  ]);
  const artwork = common.picture?.[0];

  return {
    sections: [
      {
        title: "File",
        description: "Properties supplied by the browser's File API.",
        items: [
          { label: "File name", value: file.name },
          { label: "File size", value: formatBytes(file.size) },
          { label: "MIME type", value: file.type || "Not reported" },
          { label: "Extension", value: extensionOf(file.name) },
        ],
      },
      { title: "Technical audio", items: technical },
      { title: "Descriptive tags", items: descriptive },
      {
        title: "Tag sources",
        items: [
          { label: "Native tag families", value: metadata.native ? Object.keys(metadata.native).join(", ") || "Not present" : "Not present" },
          { label: "Embedded artwork", value: artwork ? `${artwork.format} · ${formatBytes(artwork.data.byteLength)}` : "Not present" },
        ],
      },
    ],
    artwork: artwork ? { data: artwork.data, format: artwork.format } : undefined,
    raw: safeRaw(metadata),
  };
}
