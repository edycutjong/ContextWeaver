import puppeteer from 'puppeteer';
import { createRequire } from 'module';
import { mkdirSync, existsSync, readdirSync, unlinkSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const __dirname = dirname(new URL(import.meta.url).pathname);
const PROJECT_ROOT = resolve(__dirname, '..');

function findFfmpeg() {
  try {
    const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
    if (ffmpegPath) return ffmpegPath;
  } catch (_e) { /* not installed */ }

  try {
    execSync('which ffmpeg', { stdio: 'pipe' });
    return 'ffmpeg';
  } catch (_e) { /* not found */ }

  return null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runScreencast(page, durationSec, ffmpegPath, outputPath, actionFn) {
  console.log(`🎥 Recording ${durationSec}s to ${outputPath}`);
  
  // Use native screencast
  const recorder = await page.screencast({
    path: outputPath,
    speed: 1,
    ffmpegPath,
  });

  if (actionFn) {
    await actionFn(page);
  } else {
    await sleep(durationSec * 1000);
  }

  await recorder.stop();
  console.log(`✅ Saved ${outputPath}`);
}

async function main() {
  console.log('🎬 Starting automated B-Roll recording...');
  const ffmpegPath = findFfmpeg();
  if (!ffmpegPath) {
    console.error('❌ ffmpeg not found! Required for video recording.');
    process.exit(1);
  }

  const dir = join(PROJECT_ROOT, 'recordings');
  mkdirSync(dir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    },
    args: [
      '--window-size=1920,1165',
      '--no-sandbox',
    ],
  });

  const page = await browser.newPage();

  // 1. Hook (Landing Page Hero)
  console.log('🌐 Loading landing page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(2000); // let animations settle
  await runScreencast(page, 10, ffmpegPath, join(dir, 'broll-1-hook.webm'), async (p) => {
    await sleep(10000);
  });

  // 2. The Solution (Launch Dashboard)
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(1000);
  await runScreencast(page, 15, ffmpegPath, join(dir, 'broll-2-launch.webm'), async (p) => {
    await sleep(3000);
    // Click the span inside the launch button
    await p.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const launch = spans.find(el => el.textContent.includes('Launch Dashboard'));
      if (launch && launch.parentElement) {
        launch.parentElement.click();
      }
    });
    await sleep(12000);
  });

  // 3. Live Demo (Running Pipeline)
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  await sleep(2000);
  await runScreencast(page, 30, ffmpegPath, join(dir, 'broll-3-pipeline.webm'), async (p) => {
    await sleep(2000);
    await p.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const runBtn = spans.find(el => el.textContent.includes('Run Pipeline'));
      if (runBtn && runBtn.parentElement) {
        runBtn.parentElement.click();
      } else {
        const buttons = Array.from(document.querySelectorAll('button'));
        const rBtn = buttons.find(b => b.textContent.includes('Run Pipeline'));
        if (rBtn) rBtn.click();
      }
    });
    await sleep(28000);
  });

  // 4. Deep Dive (Chunk Inspector & Architecture)
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  await sleep(2000);
  await runScreencast(page, 30, ffmpegPath, join(dir, 'broll-4-deepdive.webm'), async (p) => {
    await sleep(2000);
    await p.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      // try to click a chunk if available
      const chunkBtn = buttons.find(b => b.className.includes('chunk') || b.textContent.includes('Chunk'));
      if (chunkBtn) chunkBtn.click();
    });
    await sleep(10000);
    await p.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const archBtn = buttons.find(b => b.textContent.includes('Standard RAG'));
      if (archBtn) archBtn.click();
    });
    await sleep(5000);
    await p.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const archBtn = buttons.find(b => b.textContent.includes('Multi-Agent'));
      if (archBtn) archBtn.click();
    });
    await sleep(13000);
  });

  await browser.close();
  console.log('🎉 All B-Roll videos have been generated in the recordings/ directory!');
}

main().catch(e => {
  console.error('❌ Error during B-Roll generation:', e);
  process.exit(1);
});
