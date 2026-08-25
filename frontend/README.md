# Multimedia Laboratory Frontend

A static Astro 7 website for learning how images, audio files, and videos store metadata. Selected files are processed in the browser; there is no upload endpoint or application backend.

**Production:** https://multimedia-laboratory-nu.vercel.app

## Architecture

- `src/pages/` — real Astro routes for the overview, experiment directory, each experiment, and project notes.
- `src/components/` — shared static UI: navigation, cards, upload workspace, lab record, privacy notice, and source viewer.
- `src/features/` — page-specific TypeScript extraction and client controller modules.
- `src/lib/` — shared formatting and DOM workspace behavior.
- `src/data/experiments.ts` — small registry used to add future experiments without changing the overall shell.
- `src/styles/global.css` — design tokens, responsive layout, accessible focus states, and interactive states.

Astro outputs static HTML and assets. The homepage loads none of the media parsers. Each experiment bundles only its own client entry; MediaInfo and its WASM parser are additionally imported after a video is selected.

## Dependencies

- `astro` renders the static site and bundles page-specific TypeScript.
- `exifreader` reads EXIF, IPTC, XMP, ICC, GPS, and related image metadata.
- `music-metadata` reads audio format properties, normalized tags, native tags, and artwork through `parseBlob`.
- `mediainfo.js` provides deep container and stream inspection through a browser-local WebAssembly build of MediaInfoLib.
- `@astrojs/check` and `typescript` provide strict static analysis.
- `vitest` covers shared utilities and the experiment registry.
- `playwright-core` drives the installed Microsoft Edge browser for route and media-interaction smoke tests without downloading another browser.

No React, Vue, Svelte, client router, UI framework, analytics package, Astro server adapter, or server-side upload path is present. The Vercel adapter is unnecessary because `output: "static"` produces ordinary deployable assets.

## Run locally

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:4321`.

## Check, test, and build

```powershell
npm run check
npm test
npm run build
npm run preview
```

The optional browser smoke runner targets a preview already running at `http://127.0.0.1:4321`:

```powershell
npm run test:e2e
```

Set `SMOKE_BASE_URL` to test another deployment. Set `SMOKE_SAMPLE_DIR` to a directory containing `sample.jpg`, `sample.png`, `sample.webp`, `tagged.mp3`, `plain.mp3`, `sample.wav`, `sample.mp4`, and `unsupported.txt` to include real upload interactions.

## Vercel deployment

The project is linked as `multimedia-laboratory`, with `frontend/` as its project root. The production deployment was created with:

```powershell
vercel --prod --yes
```

Vercel runs `npm run build` and serves Astro's static `dist/` output. No Vercel adapter or server function is required.

## Processing pipeline

1. The user selects or drops a file.
2. The browser exposes a local `File` object and a temporary blob URL for preview/playback.
3. The experiment's parser reads that object locally.
4. TypeScript normalizes useful values into readable sections and raw JSON.
5. Reset, replacement, or page exit revokes temporary blob URLs.

## Supported inputs and limitations

- Images: ExifReader supports common formats including JPEG, PNG, WebP, and TIFF plus metadata in several additional formats. Browser preview support can be narrower than parser support. Files legitimately lacking embedded metadata still show browser file properties and any available dimensions.
- Audio: common MP3, WAV, FLAC, M4A/AAC, Ogg/Opus, and AIFF structures are supported. A format may parse even if the current browser cannot play its codec.
- Video: MediaInfo recognizes many MP4, WebM, MOV, MKV, AVI, MPEG, and transport-stream structures. Browser playback depends on installed codecs. Encrypted, malformed, or unusual files may return partial information.
- Metadata is informative, not proof of authenticity: tags are editable and may be missing or inaccurate.
- Very large or complex files stay local but can use noticeable CPU and memory while parsed.

GPS coordinates receive a prominent privacy warning. No external maps are queried.
