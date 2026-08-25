import { chromium } from "playwright-core";
import { resolve } from "node:path";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:4321";
const sampleDir = process.env.SMOKE_SAMPLE_DIR;
const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await chromium.launch({ executablePath: edge, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];
const logs = [];
let wasmLoaded = false;

page.on("console", (message) => {
  logs.push(`${message.type()}: ${message.text()}`);
  if (message.type() === "error") failures.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => failures.push(`page: ${error.message}`));
page.on("response", (response) => {
  if (response.url().endsWith(".wasm") && response.ok()) wasmLoaded = true;
});

async function expectText(path, text) {
  const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  if (!response?.ok()) failures.push(`${path}: HTTP ${response?.status()}`);
  const body = await page.locator("body").innerText();
  if (!body.includes(text)) failures.push(`${path}: missing ${text}`);
}

await expectText("/", "See what lives");
await expectText("/experiments", "Experiment directory");
await expectText("/about", "Small tools");
await expectText("/experiments/image-metadata", "Image Metadata");
await expectText("/experiments/audio-metadata", "Audio Metadata");
await expectText("/experiments/video-metadata", "Video Metadata");

if (sampleDir) {
  const cases = [
    ["image", "image-metadata", ["sample.jpg", "sample.png", "sample.webp"]],
    ["audio", "audio-metadata", ["tagged.mp3", "plain.mp3", "sample.wav"]],
    ["video", "video-metadata", ["sample.mp4"]],
  ];
  for (const [kind, route, filenames] of cases) {
    await page.goto(`${baseUrl}/experiments/${route}`, { waitUntil: "networkidle" });
    for (const filename of filenames) {
      await page.locator("[data-file-input]").setInputFiles(resolve(sampleDir, filename));
      await page.locator("[data-status][data-state='success']").waitFor({ timeout: kind === "video" ? 30000 : 15000 });
      if ((await page.locator(".result-section").count()) < 2) failures.push(`${kind}/${filename}: missing result groups`);
    }
    await page.locator("details.raw-panel summary").click();
    if (!(await page.locator("[data-raw]").innerText()).includes("{")) failures.push(`${kind}: raw JSON missing`);
    await page.locator("[data-open-code]").click();
    if (!(await page.locator("dialog[open]").isVisible())) failures.push(`${kind}: code dialog did not open`);
    await page.locator("[data-close-code]").click();
    await page.locator("[data-reset]").click();
    if ((await page.locator("[data-status]").innerText()) !== "Ready for a local file") failures.push(`${kind}: reset failed`);
  }
  if (!wasmLoaded) failures.push("video: MediaInfo WASM did not load successfully");
  await page.goto(`${baseUrl}/experiments/image-metadata`, { waitUntil: "networkidle" });
  await page.locator("[data-file-input]").setInputFiles(resolve(sampleDir, "unsupported.txt"));
  await page.locator("[data-status][data-state='error']").waitFor();
}

await page.setViewportSize({ width: 390, height: 844 });
await expectText("/", "Enter the laboratory");
await browser.close();

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Smoke test passed: ${baseUrl}${sampleDir ? " with media interactions" : " (route mode)"}`);
if (logs.length) console.log(logs.join("\n"));
