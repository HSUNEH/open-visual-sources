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
| https://github.com/MaxBittker/sandspiel | Max Bittker | `public/vendor/sandspiel/LICENSE` |
| https://github.com/anvaka/fieldplay | Andrei Kashcha | `public/vendor/fieldplay/LICENSE` |
| https://github.com/mapbox/webgl-wind | Mapbox / Vladimir Agafonkin | `public/vendor/fieldplay/LICENSE-webgl-wind` |
| https://github.com/mxgmn/WaveFunctionCollapse | Maxim Gumin | `public/vendor/wfc/LICENSE` |
| https://github.com/kchapelier/wavefunctioncollapse | Kévin Chapelier | `public/vendor/wfc/LICENSE-port` |
| https://github.com/acamposuribe/p5.brush | Alejandro Campos Uribe | `public/vendor/brush/LICENSE.md` |
| https://github.com/erichlof/THREE.js-PathTracing-Renderer | Erich Loftis | `public/vendor/pathtrace/LICENSE` (CC0) |

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

## Threading portrait presets

The following public-domain reproductions are bundled from Wikimedia Commons. The original image bytes are preserved; the browser uses a face-centred crop for the string-art input. Source URLs, crop coordinates, download URLs, and SHA-256 hashes are recorded in `public/artworks/portraits.json`. Reproduce downloads with `node scripts/vendor-portraits.mjs`.

- Leonardo da Vinci, *Mona Lisa* — [C2RMF reproduction, retouched by Dcoetzee](https://commons.wikimedia.org/wiki/File:Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg), public domain / PD-Art; retouch released into the public domain.
- Johannes Vermeer, *Girl with a Pearl Earring* — [Wikimedia Commons reproduction](https://commons.wikimedia.org/wiki/File:1665_Girl_with_a_Pearl_Earring.jpg), public domain / PD-Art.
- Vincent van Gogh, *Self-Portrait* — [Google Art Project reproduction](https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project.jpg), public domain / PD-Art.

Sound exhibits are no longer listed or reachable in the exhibition. Their previous source snapshots and license notices are retained for provenance; the FFT/Tone scene is not bundled into the app.

## Additional visual engines

p5.brush uses the original standalone WebGL2 engine at commit `0e85177597313b00905396e19efc7b1a5f134e8b` (MIT). The flower composition, freehand queue, palette and exhibition lifecycle are authored wrappers in `public/vendor/brush/exhibit.js` and `src/scenes/Brush.jsx`.

Path Tracing uses the original Material Roughness scene, shaders, blue-noise texture and bundled dependencies at `a930973667faf4502b427a01dd338a19522c8f6c` (project CC0). Three.js, stats.js and lil-gui retain their embedded MIT notices; full license grants are also distributed beside them. The adapter exposes material presets and camera position without enabling pointer lock. Exact asset URLs and unchanged-byte hashes are in `public/vendor/brush-pathtrace-manifest.json`.

`public/vendor/expansion-manifest.json` records pinned official compiled releases and source licenses. Sandspiel uses the official 39KB Rust/WASM cellular solver with still-air values supplied by our bridge, not the upstream GPU pressure simulation or its online gallery. Canvas rendering, brush controls and demonstration scenes are exhibition code. Field Play uses its original compiled WebGL engine and local parser/UI dependencies in an isolated frame; the exhibition hides upstream controls and supplies three equations, playback and speed controls. No analytics scripts, microphone activation, recording or uploads are invoked. Embedded dependency notices remain in the unchanged bundles.

Wave Function Collapse uses the `wavefunctioncollapse` 2.1.0 JavaScript port (MIT), not the original C# binary. Flowers, Paths and Maze are original samples from mxgmn's MIT repository, preserved unchanged. Their source URLs and hashes are in the expansion manifest.
