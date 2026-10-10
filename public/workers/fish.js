// Wrapper only. Lingdong Huang's unmodified MIT source lives in /vendor.
importScripts('../vendor/fishdraw.js');
self.onmessage = event => {
  try {
    const lines = main(event.data.seed);
    self.postMessage({ lines, svg: draw_svg(lines) });
  } catch (error) { self.postMessage({ error: error.message }); }
};
