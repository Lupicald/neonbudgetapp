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

const sumariMark = `
  <defs>
    <linearGradient id="bg" x1="142" y1="96" x2="882" y2="928" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#15181A"/>
      <stop offset="0.58" stop-color="#0B0D0C"/>
      <stop offset="1" stop-color="#111716"/>
    </linearGradient>
    <radialGradient id="aura" cx="49%" cy="43%" r="54%">
      <stop offset="0" stop-color="#1FCC58" stop-opacity="0.23"/>
      <stop offset="0.48" stop-color="#5AA0FF" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#0B0D0C" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ribbon" x1="272" y1="206" x2="748" y2="826" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F4F5F0"/>
      <stop offset="0.28" stop-color="#4DDB80"/>
      <stop offset="0.66" stop-color="#1FCC58"/>
      <stop offset="1" stop-color="#0D8F3E"/>
    </linearGradient>
    <linearGradient id="spark" x1="258" y1="274" x2="760" y2="778" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#5AA0FF"/>
      <stop offset="0.55" stop-color="#1FCC58"/>
      <stop offset="1" stop-color="#FFB547"/>
    </linearGradient>
    <filter id="softGlow" x="-35%" y="-35%" width="170%" height="170%">
      <feGaussianBlur stdDeviation="28" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.12 0 0 0 0 0.8 0 0 0 0 0.35 0 0 0 0.55 0"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <circle cx="512" cy="512" r="430" fill="url(#aura)"/>
  <circle cx="512" cy="512" r="356" fill="none" stroke="#F4F5F0" stroke-opacity="0.08" stroke-width="3"/>
  <circle cx="512" cy="512" r="306" fill="none" stroke="#1FCC58" stroke-opacity="0.18" stroke-width="2" stroke-dasharray="12 24"/>
  <g filter="url(#softGlow)">
    <path d="M704 252C650 214 579 196 512 198C395 202 302 260 302 360C302 450 371 490 501 512C615 531 662 553 662 608C662 666 604 704 516 706C430 708 360 681 304 632L224 728C295 794 393 828 508 826C644 824 746 756 746 602C746 504 673 463 539 440C430 421 386 398 386 350C386 305 436 274 512 272C567 270 620 284 662 312L704 252Z" fill="url(#ribbon)"/>
    <path d="M360 362C405 336 456 324 514 324C563 324 607 333 644 350" fill="none" stroke="#0B0D0C" stroke-opacity="0.44" stroke-width="46" stroke-linecap="round"/>
    <path d="M376 664C418 688 465 700 516 700C580 700 628 680 650 644" fill="none" stroke="#0B0D0C" stroke-opacity="0.38" stroke-width="44" stroke-linecap="round"/>
    <path d="M318 568H582" stroke="#0B0D0C" stroke-opacity="0.72" stroke-width="34" stroke-linecap="round"/>
    <path d="M332 568H573" stroke="url(#spark)" stroke-width="10" stroke-linecap="round"/>
    <path d="M674 568H730" stroke="#FFB547" stroke-width="24" stroke-linecap="round"/>
    <circle cx="730" cy="568" r="18" fill="#FFB547"/>
  </g>
`;

function appIconSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="url(#bg)"/>
  ${sumariMark}
</svg>`.trim();
}

function foregroundSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(0 18) scale(0.94 0.94) translate(33 33)">
    ${sumariMark}
  </g>
</svg>`.trim();
}

function backgroundSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="96" y1="80" x2="928" y2="944" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#15181A"/>
      <stop offset="0.58" stop-color="#0B0D0C"/>
      <stop offset="1" stop-color="#111716"/>
    </linearGradient>
    <radialGradient id="aura" cx="50%" cy="46%" r="62%">
      <stop offset="0" stop-color="#1FCC58" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#0B0D0C" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#aura)"/>
</svg>`.trim();
}

function monochromeSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <path d="M704 252C650 214 579 196 512 198C395 202 302 260 302 360C302 450 371 490 501 512C615 531 662 553 662 608C662 666 604 704 516 706C430 708 360 681 304 632L224 728C295 794 393 828 508 826C644 824 746 756 746 602C746 504 673 463 539 440C430 421 386 398 386 350C386 305 436 274 512 272C567 270 620 284 662 312L704 252Z" fill="#FFFFFF"/>
  <path d="M318 568H582" stroke="#000000" stroke-opacity="0.36" stroke-width="34" stroke-linecap="round"/>
  <path d="M674 568H730" stroke="#FFFFFF" stroke-width="24" stroke-linecap="round"/>
  <circle cx="730" cy="568" r="18" fill="#FFFFFF"/>
</svg>`.trim();
}

function splashSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#0B0D0C"/>
  <g transform="translate(0 -86) scale(0.82 0.82) translate(112 112)">
    ${sumariMark}
  </g>
  <text x="512" y="762" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="800" letter-spacing="0" text-anchor="middle" fill="#F4F5F0">Sumari</text>
  <text x="512" y="824" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="500" letter-spacing="0" text-anchor="middle" fill="#B8BDB5">Tu dinero, claro y en movimiento</text>
</svg>`.trim();
}

function faviconSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0B0D0C"/>
  <path d="M45 16C41 13 36 12 32 12C24 12 18 16 18 23C18 29 23 32 31 33C39 35 42 36 42 40C42 44 38 47 32 47C26 47 22 45 18 41L13 47C18 52 25 54 32 54C41 54 48 49 48 40C48 33 43 30 34 29C27 28 24 26 24 23C24 20 27 18 32 18C36 18 39 19 42 21L45 16Z" fill="#1FCC58"/>
  <path d="M20 36H37" stroke="#0B0D0C" stroke-width="4" stroke-linecap="round"/>
  <path d="M42 36H47" stroke="#FFB547" stroke-width="3" stroke-linecap="round"/>
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
  await renderPng(appIconSvg(), path.join(ASSETS_DIR, 'icon.png'), 1024);
  await renderPng(splashSvg(), path.join(ASSETS_DIR, 'splash-icon.png'), 1024);
  await renderPng(foregroundSvg(), path.join(ASSETS_DIR, 'android-icon-foreground.png'), 1024);
  await renderPng(backgroundSvg(), path.join(ASSETS_DIR, 'android-icon-background.png'), 1024);
  await renderPng(monochromeSvg(), path.join(ASSETS_DIR, 'android-icon-monochrome.png'), 1024);
  await renderPng(faviconSvg(), path.join(ASSETS_DIR, 'favicon.png'), 64);
}

async function generateAndroidResources() {
  for (const [density, size] of Object.entries(densities)) {
    const dir = path.join(RES_DIR, `mipmap-${density}`);
    await ensureDir(dir);
    await renderWebp(appIconSvg(), path.join(dir, 'ic_launcher.webp'), size);
    await renderWebp(appIconSvg(), path.join(dir, 'ic_launcher_round.webp'), size);
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
  <color name="colorPrimary">#1FCC58</color>
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
  console.log('Generated Expo assets and Android launcher resources.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
