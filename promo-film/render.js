// node render.js out.mp4            -> pełny film 1920x1080 @ FPS (domyślnie 30)
// node render.js --stills 1,10,25   -> klatki kontrolne PNG w ./stills
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const ffmpeg = require("ffmpeg-static");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

(async () => {
  const args = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("PAGE ERROR:", e.message));
  page.on("console", (m) => m.type() === "error" && console.error("CONSOLE:", m.text()));
  await page.goto(pathToFileURL(path.resolve(__dirname, process.env.PAGE || "compose.html")).href);
  await page.evaluate(() => window.__ready);

  if (args[0] === "--stills") {
    fs.mkdirSync(path.join(__dirname, "stills"), { recursive: true });
    const times = args[1].split(",").map(Number);
    // Oś trzeba przejść po kolei, tak jak przy renderze (stany startowe tweenów).
    let cur = 0;
    for (const t of times.sort((a, b) => a - b)) {
      for (; cur < t; cur += 0.1) await page.evaluate((x) => window.__seek(x), cur);
      await page.evaluate((x) => window.__seek(x), t);
      await page.screenshot({ path: path.join(__dirname, "stills", `t${String(t).padStart(5, "0")}.png`) });
      cur = t;
    }
    await browser.close();
    return;
  }

  const out = args[0] || "hubmi.mp4";
  const FPS = Number(process.env.FPS || 30);
  const from = Number(process.env.FROM || 0);
  const to = Number(process.env.TO || (await page.evaluate(() => window.__duration)));
  const ff = spawn(ffmpeg, [
    "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-movflags", "+faststart", out,
  ], { stdio: ["pipe", "ignore", "inherit"] });
  const n = Math.round((to - from) * FPS);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const t = from + i / FPS;
    await page.evaluate((x) => window.__seek(x), t);
    const buf = await page.screenshot({ type: "jpeg", quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 300 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await browser.close();
  console.log("done", out, ((Date.now() - t0) / 1000).toFixed(0) + "s");
})();
