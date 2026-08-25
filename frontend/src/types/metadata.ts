export interface MetadataItem {
  label: string;
  value: string | number | boolean;
  hint?: string;
}

export interface MetadataSection {
  title: string;
  description?: string;
  items: MetadataItem[];
}

export interface ExtractionResult {
  sections: MetadataSection[];
  raw: unknown;
  notices?: Array<{ tone: "info" | "warning"; title: string; message: string }>;
  artwork?: { data: Uint8Array; format: string };
}
