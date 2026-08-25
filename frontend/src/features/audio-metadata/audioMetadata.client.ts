import { mountWorkspace } from "../../lib/workspace";
import type { ExtractionResult } from "../../types/metadata";
import { extractAudioMetadata } from "./extractAudioMetadata";

const root = document.querySelector<HTMLElement>("[data-workspace='audio']");
if (root) {
  const player = root.querySelector<HTMLAudioElement>("[data-audio-preview]");
  const artwork = root.querySelector<HTMLImageElement>("[data-artwork]");
  if (!player || !artwork) throw new Error("Audio preview elements are missing.");
  let artworkUrl: string | undefined;
  mountWorkspace(root, {
    accept: (file) => file.type.startsWith("audio/") || /\.(mp3|wav|flac|m4a|aac|ogg|opus|aiff?)$/i.test(file.name),
    invalidMessage: "Choose an audio file such as MP3, WAV, FLAC, M4A, AAC, or Ogg.",
    process: extractAudioMetadata,
    preview: (_file, url) => {
      player.src = url;
      player.load();
    },
    cleanupPreview: () => {
      player.pause();
      player.removeAttribute("src");
      player.load();
      if (artworkUrl) URL.revokeObjectURL(artworkUrl);
      artworkUrl = undefined;
      artwork.hidden = true;
      artwork.removeAttribute("src");
    },
  });
  root.addEventListener("metadata:complete", ((event: CustomEvent<ExtractionResult>) => {
    const embedded = event.detail.artwork;
    if (!embedded) return;
    if (artworkUrl) URL.revokeObjectURL(artworkUrl);
    artworkUrl = URL.createObjectURL(new Blob([new Uint8Array(embedded.data)], { type: embedded.format }));
    artwork.src = artworkUrl;
    artwork.alt = "Embedded album artwork";
    artwork.hidden = false;
  }) as EventListener);
}
