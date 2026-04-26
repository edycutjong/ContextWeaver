#!/usr/bin/env node
/**
 * 📸🎬 capture.mjs — Screenshot & Record tool for ContextWeaver
 *
 * All-in-one tool: take screenshots at correct dimensions or record
 * WebM demo videos. Built-in presets for hackathon submissions.
 *
 * Usage:
 *   node scripts/capture.mjs <url> [mode] [options]
 *
 * Modes:
 *   screenshot    Take a single screenshot (default)
 *   loop          Take screenshots every N seconds
 *   record        Record a WebM video
 *
 * Presets (--preset):
 *   dorahacks     1200×675  — DoraHacks BUIDL banner / cover
 *   devpost       1440×900  — Devpost gallery screenshot
 *   og            1200×630  — Open Graph / social share
 *   twitter       1600×900  — Twitter/X card (16:9)
 *   readme        1280×800  — README.md screenshot
 *   hd            1920×1080 — Full HD demo video
 *   mobile        375×812   — iPhone viewport
 *   tablet        768×1024  — iPad viewport
 *
 * Examples:
 *   node scripts/capture.mjs http://localhost:3000 screenshot --preset dorahacks
 *   node scripts/capture.mjs http://localhost:3000 screenshot --preset og --full-page
 *   node scripts/capture.mjs http://localhost:3000 record --preset hd --duration 30 --scroll
 *   node scripts/capture.mjs http://localhost:3000 loop --preset readme --interval 5 --count 10
 *   node scripts/capture.mjs http://localhost:3000 screenshot --width 1440 --height 900
 *
 * Options:
 *   --preset <name>       Use a dimension preset (see above)
 *   --width <px>          Viewport width  (default: 1280, overrides preset)
 *   --height <px>         Viewport height (default: 800, overrides preset)
 *   --device-scale <n>    Device pixel ratio (default: 2)
 *   --output <path>       Output file or directory
 *   --delay <sec>         Wait before capture (default: 2)
 *   --wait-for <sel>      CSS selector to wait for before capture
 *   --headless            Run headless (default: headed)
 *   --full-page           Capture full scrollable page (screenshot modes)
 *
 * Screenshot-only:
 *   --format <fmt>        png or jpeg (default: png)
 *   --quality <n>         JPEG quality 0–100 (default: 90)
 *
 * Loop-only:
 *   --interval <sec>      Seconds between screenshots (default: 5)
 *   --count <n>           Max screenshots (default: ∞, Ctrl+C to stop)
 *
 * Record-only:
 *   --duration <sec>      Recording duration (default: 15)
 *   --fps <n>             Frames per second (default: 24)
 *   --scroll              Auto-scroll during recording
 *   --scroll-speed <n>    Scroll speed multiplier (default: 1)
 */

import puppeteer from 'puppeteer';
import { createRequire } from 'module';
import { mkdirSync, existsSync, unlinkSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join, extname } from 'path';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const __dirname = dirname(new URL(import.meta.url).pathname);
const PROJECT_ROOT = resolve(__dirname, '..');

// ─── Presets ───────────────────────────────────────────────────────────────────

const PRESETS = {
  dorahacks:  { width: 1200, height: 675,  label: 'DoraHacks BUIDL Banner' },
  devpost:    { width: 1440, height: 900,  label: 'Devpost Gallery' },
  og:         { width: 1200, height: 630,  label: 'Open Graph / Social' },
  twitter:    { width: 1600, height: 900,  label: 'Twitter/X Card (16:9)' },
  readme:     { width: 1280, height: 800,  label: 'README Screenshot' },
  hd:         { width: 1920, height: 1080, label: 'Full HD (1080p)' },
  '4k':       { width: 3840, height: 2160, label: '4K UHD' },
  mobile:     { width: 375,  height: 812,  label: 'iPhone (375×812)' },
  tablet:     { width: 768,  height: 1024, label: 'iPad (768×1024)' },
};

// ─── CLI Parsing ───────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    url: null,
    mode: 'screenshot', // screenshot | loop | record
    width: null,
    height: null,
    preset: null,
    deviceScale: 2,
    output: null,
    delay: 2,
    waitFor: null,
    headless: false,
    fullPage: false,
    // screenshot
    format: 'png',
    quality: 90,
    // loop
    interval: 5,
    count: Infinity,
    // record
    duration: 15,
    fps: 24,
    scroll: false,
    scrollSpeed: 1,
  };

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  let i = 0;

  // First positional: URL
  if (!args[0].startsWith('--')) {
    opts.url = args[0];
    i = 1;
  }

  // Second positional: mode
  if (i < args.length && !args[i].startsWith('--') && ['screenshot', 'loop', 'record'].includes(args[i])) {
    opts.mode = args[i];
    i++;
  }

  for (; i < args.length; i++) {
    switch (args[i]) {
      case '--preset':       opts.preset = args[++i]; break;
      case '--width':        opts.width = parseInt(args[++i], 10); break;
      case '--height':       opts.height = parseInt(args[++i], 10); break;
      case '--device-scale': opts.deviceScale = parseFloat(args[++i]); break;
      case '--output':       opts.output = args[++i]; break;
      case '--delay':        opts.delay = parseFloat(args[++i]); break;
      case '--wait-for':     opts.waitFor = args[++i]; break;
      case '--headless':     opts.headless = true; break;
      case '--full-page':    opts.fullPage = true; break;
      case '--format':       opts.format = args[++i]; break;
      case '--quality':      opts.quality = parseInt(args[++i], 10); break;
      case '--interval':     opts.interval = parseFloat(args[++i]); break;
      case '--count':        opts.count = parseInt(args[++i], 10); break;
      case '--duration':     opts.duration = parseFloat(args[++i]); break;
      case '--fps':          opts.fps = parseInt(args[++i], 10); break;
      case '--scroll':       opts.scroll = true; break;
      case '--scroll-speed': opts.scrollSpeed = parseFloat(args[++i]); break;
      default:
        if (!args[i].startsWith('--') && !opts.url) {
          opts.url = args[i];
        } else {
          console.error(`❌ Unknown option: ${args[i]}`);
          process.exit(1);
        }
    }
  }

  if (!opts.url) {
    console.error('❌ URL is required. Run with --help for usage.');
    process.exit(1);
  }

  // Apply preset if given
  if (opts.preset) {
    const p = PRESETS[opts.preset.toLowerCase()];
    if (!p) {
      console.error(`❌ Unknown preset: "${opts.preset}"`);
      console.error(`   Available: ${Object.keys(PRESETS).join(', ')}`);
      process.exit(1);
    }
    if (!opts.width)  opts.width  = p.width;
    if (!opts.height) opts.height = p.height;
  }

  // Defaults if no preset and no explicit size
  if (!opts.width)  opts.width  = 1280;
  if (!opts.height) opts.height = 800;

  // Default output paths
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  if (!opts.output) {
    switch (opts.mode) {
      case 'screenshot': {
        const dir = join(PROJECT_ROOT, 'screenshots');
        mkdirSync(dir, { recursive: true });
        opts.output = join(dir, `capture-${ts}.${opts.format}`);
        break;
      }
      case 'loop': {
        opts.output = join(PROJECT_ROOT, 'screenshots', ts);
        mkdirSync(opts.output, { recursive: true });
        break;
      }
      case 'record': {
        const dir = join(PROJECT_ROOT, 'recordings');
        mkdirSync(dir, { recursive: true });
        opts.output = join(dir, `record-${ts}.webm`);
        break;
      }
    }
  } else {
    // Ensure parent dir exists
    const parent = opts.mode === 'loop' ? opts.output : dirname(resolve(opts.output));
    mkdirSync(parent, { recursive: true });
  }

  return opts;
}

function printHelp() {
  console.log(`
📸🎬 capture.mjs — Screenshot & Record for ContextWeaver

Usage:
  node scripts/capture.mjs <url> [mode] [options]

Modes:
  screenshot    Take a single screenshot (default)
  loop          Take screenshots every N seconds
  record        Record a WebM video

Presets (--preset):
  dorahacks     1200×675  — DoraHacks BUIDL banner / cover
  devpost       1440×900  — Devpost gallery screenshot
  og            1200×630  — Open Graph / social share
  twitter       1600×900  — Twitter/X card (16:9)
  readme        1280×800  — README screenshot
  hd            1920×1080 — Full HD (1080p)
  4k            3840×2160 — 4K UHD
  mobile        375×812   — iPhone viewport
  tablet        768×1024  — iPad viewport

Options:
  --preset <name>       Use a dimension preset
  --width <px>          Viewport width  (default: 1280)
  --height <px>         Viewport height (default: 800)
  --device-scale <n>    Device pixel ratio (default: 2)
  --output <path>       Output file or directory
  --delay <sec>         Wait before capture (default: 2)
  --wait-for <sel>      CSS selector to wait for
  --headless            Run headless
  --full-page           Capture full scrollable page

Screenshot-only:
  --format <fmt>        png or jpeg (default: png)
  --quality <n>         JPEG quality (default: 90)

Loop-only:
  --interval <sec>      Seconds between screenshots (default: 5)
  --count <n>           Max screenshots (default: ∞)

Record-only:
  --duration <sec>      Recording duration (default: 15)
  --fps <n>             Frames per second (default: 24)
  --scroll              Auto-scroll during recording
  --scroll-speed <n>    Scroll speed multiplier (default: 1)

Examples:
  node scripts/capture.mjs http://localhost:3000 screenshot --preset dorahacks
  node scripts/capture.mjs http://localhost:3000 record --preset hd --duration 30
  node scripts/capture.mjs http://localhost:3000 loop --preset readme --interval 5
  node scripts/capture.mjs http://localhost:3000 screenshot --width 1440 --height 900
`);
}

// ─── FFmpeg Detection ──────────────────────────────────────────────────────────

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

// ─── Utilities ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// ─── Browser Setup ─────────────────────────────────────────────────────────────

async function launchBrowser(opts) {
  const browser = await puppeteer.launch({
    headless: opts.headless ? 'shell' : false,
    defaultViewport: {
      width: opts.width,
      height: opts.height,
      deviceScaleFactor: opts.deviceScale,
    },
    args: [
      `--window-size=${opts.width},${opts.height + 85}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
    ],
  });

  const page = await browser.newPage();

  // Navigate
  console.log(`🌐 Loading: ${opts.url}`);
  try {
    await page.goto(opts.url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (err) {
    console.error(`❌ Failed to load URL: ${err.message}`);
    await browser.close();
    process.exit(1);
  }

  // Wait for selector
  if (opts.waitFor) {
    console.log(`⏳ Waiting for: ${opts.waitFor}`);
    try {
      await page.waitForSelector(opts.waitFor, { timeout: 15000 });
    } catch (_err) {
      console.warn(`   ⚠️  "${opts.waitFor}" not found within 15s, continuing...`);
    }
  }

  // Initial delay
  if (opts.delay > 0) {
    console.log(`⏳ Waiting ${opts.delay}s for page to settle...`);
    await sleep(opts.delay * 1000);
  }

  return { browser, page };
}

// ─── Mode: Screenshot ──────────────────────────────────────────────────────────

async function modeScreenshot(opts) {
  const { browser, page } = await launchBrowser(opts);

  console.log('📸 Taking screenshot...');
  const screenshotOpts = {
    path: opts.output,
    type: opts.format,
    fullPage: opts.fullPage,
  };
  if (opts.format === 'jpeg') {
    screenshotOpts.quality = opts.quality;
  }

  await page.screenshot(screenshotOpts);
  await browser.close();

  const stats = statSync(opts.output);
  console.log('');
  console.log('✅ Screenshot saved!');
  console.log(`   📁 ${opts.output}`);
  console.log(`   📏 ${formatBytes(stats.size)}`);
  console.log(`   🖥  ${opts.width}×${opts.height} @${opts.deviceScale}x`);
  if (opts.preset) {
    console.log(`   🎯 Preset: ${opts.preset} (${PRESETS[opts.preset.toLowerCase()]?.label})`);
  }
  console.log('');
}

// ─── Mode: Loop ────────────────────────────────────────────────────────────────

async function modeLoop(opts) {
  const { browser, page } = await launchBrowser(opts);
  const countLabel = opts.count === Infinity ? '∞ (Ctrl+C to stop)' : String(opts.count);

  // Graceful shutdown
  let running = true;
  process.on('SIGINT', () => {
    console.log('\n\n⏹  Stopped by user (Ctrl+C)');
    running = false;
  });
  process.on('SIGTERM', () => { running = false; });

  let shotNum = 0;
  console.log(`\n📸 Taking screenshots every ${opts.interval}s (max: ${countLabel})...\n`);

  while (running && shotNum < opts.count) {
    shotNum++;
    const filename = `shot-${String(shotNum).padStart(4, '0')}-${timestamp()}.${opts.format}`;
    const filepath = join(opts.output, filename);

    try {
      const screenshotOpts = {
        path: filepath,
        type: opts.format,
        fullPage: opts.fullPage,
      };
      if (opts.format === 'jpeg') screenshotOpts.quality = opts.quality;

      await page.screenshot(screenshotOpts);
      const size = formatBytes(statSync(filepath).size);
      const time = new Date().toLocaleTimeString();
      console.log(`   #${shotNum}  ${time}  ${filename}  (${size})`);
    } catch (err) {
      console.error(`   #${shotNum}  ❌ Failed: ${err.message}`);
    }

    if (running && shotNum < opts.count) {
      await sleep(opts.interval * 1000);
    }
  }

  await browser.close();
  console.log('');
  console.log('✅ Done!');
  console.log(`   📁 ${opts.output}/`);
  console.log(`   📷 ${shotNum} screenshots captured`);
  console.log('');
}

// ─── Mode: Record ──────────────────────────────────────────────────────────────

async function modeRecord(opts) {
  const ffmpegPath = findFfmpeg();
  const useScreencast = !!ffmpegPath && !opts.headless;

  const { browser, page } = await launchBrowser(opts);

  console.log(`⏺  Recording ${opts.duration}s @ ${opts.fps}fps...`);
  const startTime = Date.now();

  if (useScreencast) {
    // Native screencast (best quality)
    console.log('   Mode: 🎥 Native Screencast');
    const recorder = await page.screencast({
      path: opts.output,
      speed: 1,
      ffmpegPath,
    });

    if (opts.scroll) {
      const scrollInterval = setInterval(async () => {
        try {
          await page.evaluate((speed) => {
            window.scrollBy(0, 2 * speed);
          }, opts.scrollSpeed);
        } catch (_e) { /* page may have closed */ }
      }, 1000 / 30);
      await sleep(opts.duration * 1000);
      clearInterval(scrollInterval);
    } else {
      await sleep(opts.duration * 1000);
    }

    await recorder.stop();
  } else {
    // Screenshot fallback
    console.log('   Mode: 📸 Screenshot Sequence');
    const framesDir = resolve(dirname(opts.output), '.frames-' + Date.now());
    mkdirSync(framesDir, { recursive: true });

    const totalFrames = opts.duration * opts.fps;
    const frameInterval = 1000 / opts.fps;

    for (let i = 0; i < totalFrames; i++) {
      const framePath = join(framesDir, `frame-${String(i).padStart(5, '0')}.png`);
      await page.screenshot({ path: framePath, type: 'png' });

      if (opts.scroll) {
        await page.evaluate((speed) => {
          window.scrollBy(0, 2 * speed);
        }, opts.scrollSpeed);
      }

      if (i % Math.ceil(totalFrames / 10) === 0) {
        const pct = Math.round((i / totalFrames) * 100);
        process.stdout.write(`\r   ⏺  Recording: ${pct}%`);
      }

      await sleep(frameInterval);
    }
    process.stdout.write(`\r   ⏺  Recording: 100%\n`);

    // Assemble
    if (ffmpegPath) {
      console.log('🔧 Assembling video with ffmpeg...');
      try {
        execSync(
          `"${ffmpegPath}" -y -framerate ${opts.fps} ` +
          `-i "${framesDir}/frame-%05d.png" ` +
          `-c:v libvpx-vp9 -pix_fmt yuva420p -b:v 2M ` +
          `-an "${opts.output}"`,
          { stdio: 'pipe' }
        );
      } catch (err) {
        console.error(`   ⚠️  ffmpeg assembly failed: ${err.message}`);
      }
    } else {
      const altOutput = opts.output.replace('.webm', '-frames');
      if (!existsSync(altOutput)) mkdirSync(altOutput, { recursive: true });
      const frames = readdirSync(framesDir).filter(f => f.endsWith('.png'));
      for (const frame of frames) {
        execSync(`cp "${join(framesDir, frame)}" "${join(altOutput, frame)}"`, { stdio: 'pipe' });
      }
      console.log(`   📁 ${frames.length} frames saved to: ${altOutput}/`);
      console.log('   💡 To convert: ffmpeg -framerate 24 -i frame-%05d.png -c:v libvpx-vp9 output.webm');
    }

    // Cleanup temp frames
    try {
      const files = readdirSync(framesDir);
      for (const f of files) unlinkSync(join(framesDir, f));
      execSync(`rmdir "${framesDir}"`, { stdio: 'pipe' });
    } catch (_e) { /* best-effort */ }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  await browser.close();

  try {
    const stats = statSync(opts.output);
    console.log('');
    console.log('✅ Recording saved!');
    console.log(`   📁 ${opts.output}`);
    console.log(`   📏 ${formatBytes(stats.size)}`);
    console.log(`   🖥  ${opts.width}×${opts.height} @${opts.deviceScale}x`);
    console.log(`   ⏱  ${elapsed}s`);
    if (opts.preset) {
      console.log(`   🎯 Preset: ${opts.preset} (${PRESETS[opts.preset.toLowerCase()]?.label})`);
    }
    console.log('');
  } catch (_err) {
    console.log(`\n✅ Recording complete → ${opts.output}\n`);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);
  const presetLabel = opts.preset
    ? `${opts.preset} (${PRESETS[opts.preset.toLowerCase()]?.label})`
    : 'custom';

  console.log('');
  console.log('📸🎬 capture — ContextWeaver');
  console.log('─'.repeat(55));
  console.log(`   URL:        ${opts.url}`);
  console.log(`   Mode:       ${opts.mode}`);
  console.log(`   Viewport:   ${opts.width}×${opts.height} @${opts.deviceScale}x`);
  console.log(`   Preset:     ${presetLabel}`);
  console.log(`   Output:     ${opts.output}`);
  if (opts.mode === 'record') {
    console.log(`   Duration:   ${opts.duration}s @ ${opts.fps}fps`);
    console.log(`   Scroll:     ${opts.scroll ? `Yes (${opts.scrollSpeed}x)` : 'No'}`);
  }
  if (opts.mode === 'loop') {
    const countLabel = opts.count === Infinity ? '∞ (Ctrl+C)' : String(opts.count);
    console.log(`   Interval:   every ${opts.interval}s (max: ${countLabel})`);
  }
  console.log(`   Full page:  ${opts.fullPage ? 'Yes' : 'No'}`);
  console.log(`   Headless:   ${opts.headless ? 'Yes' : 'No (preview)'}`);
  console.log('─'.repeat(55));
  console.log('');

  switch (opts.mode) {
    case 'screenshot': await modeScreenshot(opts); break;
    case 'loop':       await modeLoop(opts); break;
    case 'record':     await modeRecord(opts); break;
    default:
      console.error(`❌ Unknown mode: ${opts.mode}`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`\n❌ Fatal error: ${err.message}\n`);
  process.exit(1);
});
