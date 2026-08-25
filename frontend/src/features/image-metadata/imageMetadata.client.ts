import { mountWorkspace } from "../../lib/workspace";
import { extractImageMetadata } from "./extractImageMetadata";

const root = document.querySelector<HTMLElement>("[data-workspace='image']");
if (root) {
  const preview = root.querySelector<HTMLImageElement>("[data-image-preview]");
  if (!preview) throw new Error("Image preview element is missing.");
  mountWorkspace(root, {
    accept: (file) => file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|tiff?|heic|avif)$/i.test(file.name),
    invalidMessage: "Choose an image file such as JPEG, PNG, WebP, TIFF, HEIC, or AVIF.",
    process: extractImageMetadata,
    preview: (file, url) => {
      preview.src = url;
      preview.alt = `Local preview of ${file.name}`;
    },
    cleanupPreview: () => preview.removeAttribute("src"),
  });
}
