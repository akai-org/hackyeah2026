import { bundle } from '@remotion/bundler';
import { renderFrames, selectComposition } from '@remotion/renderer';
import path from 'node:path'; import fs from 'node:fs';
// Smart App Control blokuje niepodpisany ffmpeg z Remotion, więc renderujemy klatki,
// a kodujemy do MP4 przez PyAV (encode.py).
const browserExecutable = 'C:/Users/MICHAJ~1/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe';
const outputDir = path.resolve(process.argv[2] || 'frames');
const range = process.argv[3] ? process.argv[3].split('-').map(Number) : null;
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const composition = await selectComposition({ serveUrl, id: 'HubMI', browserExecutable });
let done = 0, last = -1; const t0 = Date.now();
await renderFrames({
  composition, serveUrl, outputDir, browserExecutable, imageFormat: 'jpeg', jpegQuality: 96, concurrency: 6,
  ...(range ? { frameRange: range } : {}),
  onStart: ({ frameCount }) => console.log('frames', frameCount),
  onFrameUpdate: (n) => { done = n; const p = Math.floor(n / 90); if (p !== last) { last = p; console.log(`${n} ${((Date.now() - t0) / 1000).toFixed(0)}s`); } },
});
console.log('rendered', done, 'in', ((Date.now() - t0) / 1000).toFixed(0), 's');
