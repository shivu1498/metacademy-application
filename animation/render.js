// Renders valuechain.html deterministically to frames, then stitches an MP4 with ffmpeg.
// usage: node render.js <frames_dir> <out.mp4> [fps] [stillTime]
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
(async () => {
  const [dir, out, fpsArg, still] = process.argv.slice(2);
  const fps = +fpsArg || 30;
  fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  await p.goto('file://' + path.join(__dirname, 'valuechain.html') + '#still');
  if (still) { await p.evaluate(t => render(t), +still); await p.screenshot({ path: out }); await b.close(); return; }
  const total = await p.evaluate(() => TOTAL), n = Math.ceil(total * fps);
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => render(t), i / fps);
    await p.screenshot({ path: path.join(dir, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  await b.close();
  execFileSync('ffmpeg', ['-y', '-framerate', String(fps), '-i', path.join(dir, 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', out], { stdio: 'inherit' });
})();
