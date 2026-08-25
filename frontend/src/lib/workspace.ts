import type { ExtractionResult, MetadataSection } from "../types/metadata";

interface WorkspaceOptions {
  accept: (file: File) => boolean;
  invalidMessage: string;
  process: (file: File) => Promise<ExtractionResult>;
  preview: (file: File, url: string) => void;
  cleanupPreview?: () => void;
}

const query = <T extends Element>(root: ParentNode, selector: string): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Workspace element missing: ${selector}`);
  return element;
};

function renderSections(container: HTMLElement, sections: MetadataSection[]): void {
  container.replaceChildren();
  for (const section of sections.filter((entry) => entry.items.length)) {
    const article = document.createElement("article");
    article.className = "result-section";
    const heading = document.createElement("div");
    heading.className = "result-heading";
    const title = document.createElement("h3");
    title.textContent = section.title;
    heading.append(title);
    if (section.description) {
      const description = document.createElement("p");
      description.textContent = section.description;
      heading.append(description);
    }
    const grid = document.createElement("dl");
    grid.className = "metadata-grid";
    for (const item of section.items) {
      const cell = document.createElement("div");
      cell.className = "metadata-cell";
      const term = document.createElement("dt");
      term.textContent = item.label;
      const value = document.createElement("dd");
      value.textContent = String(item.value);
      if (item.hint) value.title = item.hint;
      cell.append(term, value);
      grid.append(cell);
    }
    article.append(heading, grid);
    container.append(article);
  }
}

function renderNotices(container: HTMLElement, result: ExtractionResult): void {
  container.replaceChildren();
  for (const notice of result.notices ?? []) {
    const item = document.createElement("aside");
    item.className = `notice notice--${notice.tone}`;
    const title = document.createElement("strong");
    title.textContent = notice.title;
    const body = document.createElement("span");
    body.textContent = notice.message;
    item.append(title, body);
    container.append(item);
  }
}

export function mountWorkspace(root: HTMLElement, options: WorkspaceOptions): void {
  const input = query<HTMLInputElement>(root, "[data-file-input]");
  const dropzone = query<HTMLElement>(root, "[data-dropzone]");
  const reset = query<HTMLButtonElement>(root, "[data-reset]");
  const status = query<HTMLElement>(root, "[data-status]");
  const empty = query<HTMLElement>(root, "[data-empty]");
  const output = query<HTMLElement>(root, "[data-output]");
  const sections = query<HTMLElement>(root, "[data-sections]");
  const notices = query<HTMLElement>(root, "[data-notices]");
  const raw = query<HTMLElement>(root, "[data-raw]");
  const copy = query<HTMLButtonElement>(root, "[data-copy-raw]");
  let previewUrl: string | undefined;
  let rawText = "";

  const setStatus = (message: string, state: "idle" | "loading" | "success" | "error") => {
    status.textContent = message;
    status.dataset.state = state;
  };

  const cleanup = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = undefined;
    options.cleanupPreview?.();
  };

  const clear = () => {
    cleanup();
    input.value = "";
    output.hidden = true;
    empty.hidden = false;
    reset.hidden = true;
    raw.textContent = "";
    rawText = "";
    setStatus("Ready for a local file", "idle");
  };

  const handle = async (file: File) => {
    if (!options.accept(file)) {
      setStatus(options.invalidMessage, "error");
      return;
    }
    cleanup();
    previewUrl = URL.createObjectURL(file);
    options.preview(file, previewUrl);
    empty.hidden = true;
    output.hidden = false;
    reset.hidden = false;
    sections.replaceChildren();
    notices.replaceChildren();
    raw.textContent = "";
    setStatus(`Inspecting ${file.name}…`, "loading");
    try {
      const result = await options.process(file);
      renderSections(sections, result.sections);
      renderNotices(notices, result);
      rawText = JSON.stringify(result.raw, null, 2);
      raw.textContent = rawText;
      setStatus(`Analysis complete · ${file.name}`, "success");
      root.dispatchEvent(new CustomEvent("metadata:complete", { detail: result }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "The file could not be inspected.";
      setStatus(message, "error");
      sections.innerHTML = `<div class="error-panel"><strong>Analysis stopped</strong><p>${escapeHtml(message)}</p></div>`;
    }
  };

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) void handle(file);
  });
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.dataset.dragging = "true";
  });
  dropzone.addEventListener("dragleave", () => delete dropzone.dataset.dragging);
  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    delete dropzone.dataset.dragging;
    const file = event.dataTransfer?.files[0];
    if (file) void handle(file);
  });
  reset.addEventListener("click", clear);
  copy.addEventListener("click", async () => {
    if (!rawText) return;
    await navigator.clipboard.writeText(rawText);
    copy.textContent = "Copied";
    window.setTimeout(() => (copy.textContent = "Copy JSON"), 1400);
  });
  window.addEventListener("pagehide", cleanup);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}
