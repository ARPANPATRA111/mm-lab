import { mountWorkspace } from "../../lib/workspace";

const root = document.querySelector<HTMLElement>("[data-workspace='video']");
if (root) {
  const player = root.querySelector<HTMLVideoElement>("[data-video-preview]");
  if (!player) throw new Error("Video preview element is missing.");
  mountWorkspace(root, {
    accept: (file) => file.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|m4v|avi|mpeg|mpg|ts)$/i.test(file.name),
    invalidMessage: "Choose a video file such as MP4, WebM, MOV, MKV, AVI, or MPEG.",
    process: async (file) => {
      const { extractVideoMetadata } = await import("./extractVideoMetadata");
      return extractVideoMetadata(file);
    },
    preview: (_file, url) => {
      player.src = url;
      player.load();
    },
    cleanupPreview: () => {
      player.pause();
      player.removeAttribute("src");
      player.load();
    },
  });
}
