import ExifReader from "exifreader";
import { compactItems, extensionOf, formatBytes } from "../../lib/format";
import type { ExtractionResult, MetadataItem } from "../../types/metadata";

type TagRecord = Record<string, unknown>;

function tagText(group: unknown, ...names: string[]): string | undefined {
  if (!group || typeof group !== "object") return undefined;
  const record = group as TagRecord;
  for (const name of names) {
    const tag = record[name];
    if (["string", "number", "boolean"].includes(typeof tag)) return String(tag);
    if (tag && typeof tag === "object") {
      const value = tag as { description?: unknown; value?: unknown };
      const candidate = value.description ?? value.value;
      if (Array.isArray(candidate)) return candidate.join(", ");
      if (["string", "number", "boolean"].includes(typeof candidate)) return String(candidate);
    }
  }
  return undefined;
}

async function imageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  } catch {
    return {};
  }
}

function cleanRaw(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[nested metadata]";
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) return `[binary data: ${value.byteLength} bytes]`;
  if (Array.isArray(value)) return value.length > 120 ? `[${value.length} values]` : value.map((item) => cleanRaw(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanRaw(item, depth + 1)]));
  }
  return value;
}

export async function extractImageMetadata(file: File): Promise<ExtractionResult> {
  const [tags, dimensions] = await Promise.all([
    ExifReader.load(file, { expanded: true }),
    imageDimensions(file),
  ]);
  const groups = tags as unknown as Record<string, TagRecord>;
  const exif = groups.exif ?? {};
  const gps = groups.gps ?? {};
  const fileTags = groups.file ?? {};
  const width = dimensions.width ?? Number(tagText(fileTags, "Image Width", "PixelXDimension"));
  const height = dimensions.height ?? Number(tagText(fileTags, "Image Height", "PixelYDimension"));
  const latitude = tagText(gps, "Latitude", "GPSLatitude");
  const longitude = tagText(gps, "Longitude", "GPSLongitude");
  const cameraItems: MetadataItem[] = compactItems([
    { label: "Manufacturer", value: tagText(exif, "Make") },
    { label: "Camera model", value: tagText(exif, "Model") },
    { label: "Lens", value: tagText(exif, "LensModel", "Lens") },
    { label: "ISO", value: tagText(exif, "ISOSpeedRatings", "PhotographicSensitivity") },
    { label: "Aperture", value: tagText(exif, "FNumber", "ApertureValue") },
    { label: "Exposure", value: tagText(exif, "ExposureTime") },
    { label: "Focal length", value: tagText(exif, "FocalLength") },
    { label: "Orientation", value: tagText(exif, "Orientation") },
  ]);
  const descriptiveItems: MetadataItem[] = compactItems([
    { label: "Captured", value: tagText(exif, "DateTimeOriginal", "CreateDate") },
    { label: "Modified", value: tagText(exif, "DateTime") },
    { label: "Software", value: tagText(exif, "Software") },
    { label: "Artist", value: tagText(exif, "Artist") },
    { label: "Copyright", value: tagText(exif, "Copyright") },
  ]);
  const locationItems: MetadataItem[] = compactItems([
    { label: "Latitude", value: latitude },
    { label: "Longitude", value: longitude },
    { label: "Altitude", value: tagText(gps, "Altitude", "GPSAltitude") },
  ]);

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
      {
        title: "Image",
        items: compactItems([
          { label: "Width", value: width ? `${width} px` : undefined },
          { label: "Height", value: height ? `${height} px` : undefined },
          { label: "Aspect ratio", value: width && height ? `${(width / height).toFixed(3)} : 1` : undefined },
          { label: "Color space", value: tagText(exif, "ColorSpace") },
          { label: "Bits per sample", value: tagText(fileTags, "Bits Per Sample", "BitsPerSample") },
        ]),
      },
      { title: "Camera & exposure", items: cameraItems },
      { title: "Dates & authorship", items: descriptiveItems },
      { title: "Location", items: locationItems },
      {
        title: "Embedded records",
        description: "Metadata families detected by ExifReader.",
        items: ["exif", "iptc", "xmp", "icc", "gps"].map((name) => ({
          label: name.toUpperCase(),
          value: Object.keys(groups[name] ?? {}).length ? `${Object.keys(groups[name] ?? {}).length} fields` : "Not present",
        })),
      },
    ],
    notices: latitude || longitude ? [{
      tone: "warning",
      title: "Location metadata detected",
      message: "This file contains geographic coordinates. Sharing the original image may reveal where it was captured.",
    }] : undefined,
    raw: cleanRaw(tags),
  };
}
