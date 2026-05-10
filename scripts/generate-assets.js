'use strict';

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'assets');
const RES_DIR = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

const densities = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

const splashDensities = {
  mdpi: 200,
  hdpi: 300,
  xhdpi: 400,
  xxhdpi: 600,
  xxxhdpi: 800,
};

// ── S letterform path (1024×1024 coordinate space)
// Clean stroke-based "S" — smooth bezier curves, no fill
const S_PATH = 'M 700 340 C 700 230 600 190 512 190 C 380 190 300 260 300 370 C 300 460 430 505 512 520 C 600 535 724 580 724 680 C 724 780 640 840 512 840 C 380 840 300 780 300 710';
const S_STROKE_W = 76;

// Shared defs used in most variants
const SHARED_DEFS = `
  <defs>
    <radialGradient id="aura" cx="512" cy="512" r="380" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#39FF85" stop-opacity="0.11"/>
      <stop offset="65%"  stop-color="#39FF85" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#39FF85" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sGrad" x1="680" y1="190" x2="320" y2="840" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#B8FFE0"/>
      <stop offset="25%"  stop-color="#39FF85"/>
      <stop offset="100%" stop-color="#16A845"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="395" y1="520" x2="650" y2="520" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#39FF85"/>
      <stop offset="100%" stop-color="#FFB547"/>
    </linearGradient>
    <filter id="glow" x="-45%" y="-45%" width="190%" height="190%">
      <feGaussianBlur stdDeviation="22" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="0 0 0 0 0.08  0 0 0 0 0.90  0 0 0 0 0.26  0 0 0 0.88 0"
        result="glowColor"/>
      <feMerge>
        <feMergeNode in="glowColor"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
`;

// The S mark visual elements (no background rect — added per-variant)
const S_MARK = `
  <rect width="1024" height="1024" fill="url(#aura)"/>
  <g filter="url(#glow)">
    <path d="${S_PATH}"
      stroke="url(#sGrad)" stroke-width="${S_STROKE_W}"
      fill="none" stroke-linecap="round"/>
    <line x1="395" y1="520" x2="628" y2="520"
      stroke="url(#accentGrad)" stroke-width="12"
      stroke-linecap="round" opacity="0.58"/>
    <circle cx="658" cy="520" r="16" fill="#FFB547" opacity="0.72"/>
  </g>
`;

function appIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#101512"/>
      <stop offset="100%" stop-color="#080D0A"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  ${SHARED_DEFS}
  ${S_MARK}
</svg>`.trim();
}

function foregroundSvg() {
  // Scale S to ~90 % of canvas so it fits the Android adaptive-icon safe zone
  // transform="translate(tx,ty) scale(s)" maps point (x,y) → (s·x+tx, s·y+ty)
  // We want the S center (512,515) to land at (512,512): tx=512*(1-0.90)=51, ty=512-0.90*515=49
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${SHARED_DEFS}
  <g transform="translate(51 49) scale(0.90)">
    ${S_MARK}
  </g>
</svg>`.trim();
}

function backgroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#101512"/>
      <stop offset="100%" stop-color="#080D0A"/>
    </linearGradient>
    <radialGradient id="bgAura" cx="512" cy="470" r="430" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#1FCC58" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#1FCC58" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#bgAura)"/>
</svg>`.trim();
}

function monochromeSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <path d="${S_PATH}"
    stroke="#FFFFFF" stroke-width="${S_STROKE_W}"
    fill="none" stroke-linecap="round"/>
  <line x1="395" y1="520" x2="628" y2="520"
    stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity="0.65"/>
  <circle cx="658" cy="520" r="16" fill="#FFFFFF" opacity="0.75"/>
</svg>`.trim();
}

function splashSvg() {
  // S centered at (512, 420) — leaves ~350 px below for "Sumari" text
  // transform="translate(tx,ty) scale(s)": center (512,515) → (512,420), s=0.80
  // tx = 512*(1-0.80) = 102.4 ≈ 102
  // ty = 420 - 0.80*515 = 420 - 412 = 8
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#0B0D0C"/>
  ${SHARED_DEFS}
  <g transform="translate(102 8) scale(0.80)">
    ${S_MARK}
  </g>
  <text x="512" y="768"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-size="90" font-weight="700" letter-spacing="-3"
    text-anchor="middle" fill="#F0F5F1">Sumari</text>
  <text x="512" y="826"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-size="28" font-weight="400" letter-spacing="0.5"
    text-anchor="middle" fill="#4D7A5E" opacity="0.90">Smart money, clearly</text>
</svg>`.trim();
}

function faviconSvg() {
  // Simplified stroke S for 64×64 — coordinates hand-tuned for legibility at small size
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="13" fill="#0B0D0C"/>
  <defs>
    <linearGradient id="fg" x1="44" y1="13" x2="20" y2="52" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#7DFFBE"/>
      <stop offset="100%" stop-color="#1ACC55"/>
    </linearGradient>
    <filter id="fg2" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="1.5" result="b"/>
      <feColorMatrix in="b" type="matrix"
        values="0 0 0 0 0.08 0 0 0 0 0.90 0 0 0 0 0.26 0 0 0 0.9 0"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#fg2)">
    <path d="M 44 21 C 44 14 38 11.5 32 11.5 C 24 11.5 18 16 18 23 C 18 29 24 31.5 32 32.5 C 40 33.5 46 36 46 43 C 46 50 40 52.5 32 52.5 C 24 52.5 18.5 49.5 18 44"
      stroke="url(#fg)" stroke-width="4.6" fill="none" stroke-linecap="round"/>
    <line x1="24.5" y1="32.5" x2="39" y2="32.5"
      stroke="#39FF85" stroke-width="0.8" stroke-linecap="round" opacity="0.55"/>
    <circle cx="41.5" cy="32.5" r="1.2" fill="#FFB547" opacity="0.8"/>
  </g>
</svg>`.trim();
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeText(filename, contents) {
  await fs.writeFile(filename, contents, 'utf8');
}

async function renderPng(svg, filename, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(filename);
}

async function renderWebp(svg, filename, size) {
  await sharp(Buffer.from(svg)).resize(size, size).webp({ quality: 96 }).toFile(filename);
}

async function generateExpoAssets() {
  await ensureDir(ASSETS_DIR);
  await renderPng(appIconSvg(),        path.join(ASSETS_DIR, 'icon.png'),                    1024);
  await renderPng(splashSvg(),         path.join(ASSETS_DIR, 'splash-icon.png'),             1024);
  await renderPng(foregroundSvg(),     path.join(ASSETS_DIR, 'android-icon-foreground.png'), 1024);
  await renderPng(backgroundSvg(),     path.join(ASSETS_DIR, 'android-icon-background.png'), 1024);
  await renderPng(monochromeSvg(),     path.join(ASSETS_DIR, 'android-icon-monochrome.png'), 1024);
  await renderPng(faviconSvg(),        path.join(ASSETS_DIR, 'favicon.png'),                   64);
}

async function generateAndroidResources() {
  for (const [density, size] of Object.entries(densities)) {
    const dir = path.join(RES_DIR, `mipmap-${density}`);
    await ensureDir(dir);
    await renderWebp(appIconSvg(),    path.join(dir, 'ic_launcher.webp'),            size);
    await renderWebp(appIconSvg(),    path.join(dir, 'ic_launcher_round.webp'),      size);
    await renderWebp(backgroundSvg(), path.join(dir, 'ic_launcher_background.webp'), size);
    await renderWebp(foregroundSvg(), path.join(dir, 'ic_launcher_foreground.webp'), size);
    await renderWebp(monochromeSvg(), path.join(dir, 'ic_launcher_monochrome.webp'), size);
  }

  for (const [density, size] of Object.entries(splashDensities)) {
    const dir = path.join(RES_DIR, `drawable-${density}`);
    await ensureDir(dir);
    await renderPng(splashSvg(), path.join(dir, 'splashscreen_logo.png'), size);
  }

  await ensureDir(path.join(RES_DIR, 'values'));
  await writeText(path.join(RES_DIR, 'values', 'colors.xml'), `<resources>
  <color name="splashscreen_background">#0B0D0C</color>
  <color name="iconBackground">#0B0D0C</color>
  <color name="colorPrimary">#39FF85</color>
  <color name="colorPrimaryDark">#0B0D0C</color>
</resources>
`);

  await ensureDir(path.join(RES_DIR, 'drawable'));
  await writeText(path.join(RES_DIR, 'drawable', 'ic_launcher_background.xml'), `<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
  <solid android:color="@color/iconBackground"/>
</shape>
`);
}

async function main() {
  console.log('Generating Sumari brand assets...');
  await generateExpoAssets();
  await generateAndroidResources();
  console.log('Done. All Sumari assets generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
