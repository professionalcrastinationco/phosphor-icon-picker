const { chromium } = require('playwright');
const https = require('https');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = 'D:/CLAUDE CODE/hud/docs/images';

const COLORS = {
  'slate-500': '#64748b',
  'red-500': '#ef4444',
  'orange-500': '#f97316',
  'amber-500': '#f59e0b',
  'yellow-500': '#eab308',
  'lime-500': '#84cc16',
  'emerald-500': '#10b981',
  'teal-500': '#14b8a6',
  'cyan-500': '#06b6d4',
  'sky-500': '#0ea5e9',
  'blue-500': '#3b82f6',
  'indigo-500': '#6366f1',
  'violet-500': '#8b5cf6',
  'pink-500': '#ec4899',
};

const SMALL_ICONS = [
  { name: 'git-diff', weight: 'regular' },
  { name: 'currency-dollar', weight: 'regular' },
  { name: 'flag-banner', weight: 'regular' },
  { name: 'check-square', weight: 'regular' },
  { name: 'palette', weight: 'regular' },
  { name: 'x', weight: 'regular' },
  { name: 'check', weight: 'regular' },
];

const H2_ICONS_RAINBOW = [
  { name: 'layout', weight: 'regular', color: 'red-500' },
  { name: 'list-checks', weight: 'regular', color: 'orange-500' },
  { name: 'gear-six', weight: 'regular', color: 'amber-500' },
  { name: 'palette', weight: 'regular', color: 'yellow-500' },
  { name: 'box-arrow-down', weight: 'regular', color: 'lime-500' },
  { name: 'robot', weight: 'regular', color: 'emerald-500' },
  { name: 'paint-brush', weight: 'regular', color: 'teal-500' },
  { name: 'article', weight: 'regular', color: 'cyan-500' },
  { name: 'gear-six', weight: 'regular', color: 'sky-500', suffix: '-config' },
  { name: 'arrows-in-line-vertical', weight: 'regular', color: 'blue-500' },
  { name: 'rocket-launch', weight: 'regular', color: 'indigo-500' },
  { name: 'question', weight: 'regular', color: 'violet-500' },
  { name: 'handshake', weight: 'regular', color: 'pink-500' },
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redir = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        fetchUrl(redir).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function fetchSvg(iconName, weight) {
  const url = `https://unpkg.com/@phosphor-icons/core/assets/${weight}/${iconName}.svg`;
  return fetchUrl(url);
}

async function renderIcon(page, svgContent, fillColor, size, outputPath) {
  // Set fill on the SVG element and force size
  let svg = svgContent
    .replace(/<svg/, `<svg fill="${fillColor}" width="${size}" height="${size}"`)
    .replace(/width="256"/g, '')
    .replace(/height="256"/g, '');

  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head><style>
      * { margin: 0; padding: 0; }
      body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
      svg { display: block; width: ${size}px; height: ${size}px; }
    </style></head>
    <body>${svg}</body>
    </html>
  `);

  await page.screenshot({
    path: outputPath,
    omitBackground: true,
    clip: { x: 0, y: 0, width: size, height: size },
  });

  console.log(`  OK ${path.basename(outputPath)}`);
}

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  const svgCache = {};
  async function getSvg(name, weight) {
    const key = `${weight}/${name}`;
    if (!svgCache[key]) {
      console.log(`  Fetching ${key}...`);
      svgCache[key] = await fetchSvg(name, weight);
    }
    return svgCache[key];
  }

  console.log('\n--- 16px Slate-500 Bullet Icons ---');
  for (const icon of SMALL_ICONS) {
    const svg = await getSvg(icon.name, icon.weight);
    const filename = `icon-16px-${icon.name}-slate-500-${icon.weight}.png`;
    await renderIcon(page, svg, COLORS['slate-500'], 16, path.join(OUTPUT_DIR, filename));
  }

  console.log('\n--- 20px Rainbow H2 Icons ---');
  for (const icon of H2_ICONS_RAINBOW) {
    const svg = await getSvg(icon.name, icon.weight);
    const suffix = icon.suffix || '';
    const filename = `icon-20px-${icon.name}-${icon.color}-${icon.weight}${suffix}.png`;
    await renderIcon(page, svg, COLORS[icon.color], 20, path.join(OUTPUT_DIR, filename));
  }

  await browser.close();
  console.log('\nDone!');
}

main().catch(console.error);
