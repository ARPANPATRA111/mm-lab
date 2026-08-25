import type { MetadataItem } from "../types/metadata";

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = -1;
  do {
    value /= 1024;
    unit += 1;
  } while (value >= 1024 && unit < units.length - 1);
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unit]}`;
}

export function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds)) return "Not present";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = Math.floor(seconds % 60);
  const clock = [minutes, remainder].map((part) => String(part).padStart(2, "0")).join(":");
  return hours ? `${hours}:${clock}` : clock;
}

export function formatRate(rate: number | undefined, unit: string): string {
  return rate === undefined || !Number.isFinite(rate)
    ? "Not present"
    : `${new Intl.NumberFormat("en").format(Math.round(rate))} ${unit}`;
}

export function extensionOf(name: string): string {
  const index = name.lastIndexOf(".");
  return index > 0 ? name.slice(index + 1).toUpperCase() : "Not present";
}

type MaybeMetadataItem = Omit<MetadataItem, "value"> & {
  value: MetadataItem["value"] | null | undefined;
};

export function compactItems(items: MaybeMetadataItem[]): MetadataItem[] {
  return items.filter((item): item is MetadataItem =>
    item.value !== undefined && item.value !== null && item.value !== "",
  );
}
