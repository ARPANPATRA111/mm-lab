import { describe, expect, it } from "vitest";
import { compactItems, extensionOf, formatBytes, formatDuration, formatRate } from "../src/lib/format";
import { experiments, getExperiment } from "../src/data/experiments";

describe("metadata presentation utilities", () => {
  it("formats byte sizes and time without losing zero values", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1536)).toBe("1.50 KB");
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(3661.9)).toBe("1:01:01");
    expect(formatRate(48000, "Hz")).toBe("48,000 Hz");
  });

  it("extracts extensions and drops only absent metadata", () => {
    expect(extensionOf("recording.final.wav")).toBe("WAV");
    expect(extensionOf("README")).toBe("Not present");
    expect(compactItems([
      { label: "zero", value: 0 },
      { label: "false", value: false },
      { label: "missing", value: undefined },
    ])).toHaveLength(2);
  });
});

describe("experiment registry", () => {
  it("defines unique, routable experiments", () => {
    expect(experiments).toHaveLength(3);
    expect(new Set(experiments.map(({ id }) => id)).size).toBe(3);
    expect(getExperiment("video-metadata").href).toBe("/experiments/video-metadata");
  });
});
