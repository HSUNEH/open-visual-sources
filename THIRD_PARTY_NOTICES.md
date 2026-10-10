# Third-party sources

The original user CSV is retained unchanged. This document describes code actually included in this exhibition, rather than assigning licenses to the entire CSV.

## Vendored code

| Source | Author | License file |
|---|---|---|
| https://github.com/LingDong-/fishdraw | Lingdong Huang | `public/vendor/fishdraw.LICENSE` |
| https://github.com/LingDong-/shan-shui-inf | Lingdong Huang | `public/vendor/shan-shui.LICENSE` |
| https://github.com/ondras/primitive.js | Ondřej Žára | `public/vendor/primitive/LICENSE` |
| https://github.com/PavelDoGreat/WebGL-Fluid-Simulation | Pavel Dobryakov | `public/vendor/fluid/LICENSE` |
| https://github.com/Chakazul/Lenia | Bert Chan / Chakazul | `public/vendor/lenia/LICENSE.md` |
| https://github.com/amandaghassaei/OrigamiSimulator | Amanda Ghassaei and contributors | `public/vendor/origami/LICENSE` |
| https://dood.al/pinktrombone/ | Neil Thapen | MIT notice retained inside `public/vendor/pink-trombone/index.html` |

The source files are unmodified. Wrappers live in `src/scenes/`, `public/workers/fish.js`, and `src/scenes/primitive-adapter.js`. Source URLs and local hashes are recorded in `public/vendor/manifest.json`.

## Installed libraries

React and React DOM (MIT), Vite (MIT), Three.js (MIT), React Three Fiber (MIT), Motion (MIT), three-mesh-bvh (MIT), fft.js (MIT), Tone.js (MIT), Matter.js (MIT), Flubber (MIT), d3-delaunay (ISC), Lucide React (ISC), and Manrope font (OFL-1.1). Their exact package versions are in `package-lock.json`; installed license text is retained in `node_modules`.

`@lnjs/core` is the actual TypeScript port at https://github.com/aweary/ln.js. Its package declares ISC; the original https://github.com/fogleman/ln declares MIT. Those are different sources and the app labels both.

## References without copied code

- https://github.com/piellardj/image-stylization-threading — referenced original project (GPL-3.0), with an external original-demo link. The local greedy thread approximation is independently written and does not incorporate this repository's code or images.
- https://github.com/sebh/TileableVolumeNoise — referenced C++ project (MIT). The local periodic value-noise shader and raymarcher are independently written and do not use its source or texture assets.
- https://github.com/fogleman/primitive — original algorithm project (MIT); browser code is from ondras/primitive.js credited above.

## Original simulator adapters

`src/scenes/Originals.jsx` retains upstream source snapshots, with runtime wrappers for local paths, tracker removal, palette, canvas sizing, CPU/GPU lifecycle, and accessible host controls. The original Origami HTML and vendored dependencies retain their own embedded notices (including Three.js, jQuery, Bootstrap, numeric.js, FOLD, earcut, and related utilities). Lenia's bundled FFT/cellular engine, lifeform catalogue, random generator, Plotly, and GIF utility sources retain upstream notices. No AGPL or GPL candidate was copied into this expansion.

Pink Trombone is associated with CSV N042 (`kaiidams/pinktrombone_cpp`), but this exhibit uses **Neil Thapen's original 2017 browser implementation**, whose HTML contains its own MIT grant. The C++ port is not compiled or used.

## Painting presets

The three paintings are public-domain works distributed as CC0 by the Art Institute of Chicago and mirrored on Wikimedia Commons. Local metadata, source pages and file hashes are in `public/artworks/manifest.json`, `public/artworks/*.json`, and `public/vendor/exhibits-manifest.json`.

- Vincent van Gogh, *The Bedroom* (1889), AIC 28560 — https://www.artic.edu/artworks/28560
- Claude Monet, *Water Lilies* (1906), AIC 16568 — https://www.artic.edu/artworks/16568
- Katsushika Hokusai, *Under the Wave off Kanagawa*, AIC 24645 — https://www.artic.edu/artworks/24645

Images are bundled, not hotlinked. Conversion uses a square center crop. Original programmatic input illustrations remain as loading fallbacks. There are no model weights, prerecorded audio samples, or remote font services.
