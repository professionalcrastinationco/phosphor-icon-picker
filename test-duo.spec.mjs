import { chromium } from 'playwright';

const BASE = 'http://localhost:8111';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let passed = 0, failed = 0;

  function assert(condition, label) {
    if (condition) { console.log(`  PASS: ${label}`); passed++; }
    else { console.log(`  FAIL: ${label}`); failed++; }
  }

  // 1. Basic load
  console.log('\n--- Basic Load ---');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const iconCount = await page.textContent('#iconCount');
  assert(iconCount.includes('1,512') || /\d+\s*icon/.test(iconCount), `Icons loaded: "${iconCount}"`);

  const cards = await page.$$('.icon-card');
  assert(cards.length === 100, `Grid has ${cards.length} cards (expect 100)`);

  // 2. Single color mode visible by default
  console.log('\n--- Single Color Mode (default) ---');
  const singleVisible = await page.$eval('#singleColorSection', el => el.style.display !== 'none');
  assert(singleVisible, 'Single color section visible');
  const duoVisible = await page.$eval('#duoColorSection', el => el.classList.contains('visible'));
  assert(!duoVisible, 'Duo color section hidden');

  // 3. Switch to Duo weight
  console.log('\n--- Switch to Duo ---');
  await page.click('[data-weight="duotone"]');
  await page.waitForTimeout(1500);

  const singleHidden = await page.$eval('#singleColorSection', el => el.style.display === 'none');
  assert(singleHidden, 'Single color section hidden after Duo');
  const duoNowVisible = await page.$eval('#duoColorSection', el => el.classList.contains('visible'));
  assert(duoNowVisible, 'Duo color section visible after Duo');

  // Check icons loaded with Duo weight
  const duoCards = await page.$$('.icon-card');
  assert(duoCards.length === 100, `Duo grid has ${duoCards.length} cards (expect 100)`);

  // Check that SVGs loaded (not placeholder rects)
  await page.waitForTimeout(2000);
  const svgPaths = await page.$$eval('.icon-card svg path', paths => paths.length);
  assert(svgPaths > 0, `SVG paths loaded: ${svgPaths}`);

  // 4. Set outline color to blue
  console.log('\n--- Set Duo Outline Color ---');
  await page.fill('#duoOutlineColorInput', '#3b82f6');
  await page.press('#duoOutlineColorInput', 'Enter');
  await page.waitForTimeout(500);

  // 5. Set fill color to red
  console.log('\n--- Set Duo Fill Color ---');
  await page.fill('#duoFillColorInput', '#ef4444');
  await page.press('#duoFillColorInput', 'Enter');
  await page.waitForTimeout(500);

  // Check a duotone SVG has both colors applied
  const firstSvg = await page.$('.icon-card svg');
  if (firstSvg) {
    const fills = await page.$$eval('.icon-card:first-child svg [fill]', els =>
      els.map(el => ({ fill: el.getAttribute('fill'), opacity: el.getAttribute('opacity') }))
    );
    console.log('  First icon fills:', JSON.stringify(fills));
    const hasOutline = fills.some(f => f.fill === '#3b82f6' && !f.opacity);
    const hasFill = fills.some(f => f.fill === '#ef4444' && f.opacity === '0.2');
    assert(hasOutline, 'Outline path has blue color');
    assert(hasFill, 'Fill path has red color with opacity 0.2');
  }

  // 6. Select an icon and check preview
  console.log('\n--- Select Icon & Preview ---');
  await page.click('.icon-card:first-child');
  await page.waitForTimeout(1000);
  const previewMeta = await page.textContent('#previewMeta');
  assert(previewMeta.includes('outline:'), `Preview shows outline color: "${previewMeta}"`);
  assert(previewMeta.includes('fill:'), `Preview shows fill color: "${previewMeta}"`);

  // 7. Take screenshot of duo mode
  await page.screenshot({ path: 'test-duo-screenshot.png', fullPage: false });
  console.log('  Screenshot saved: test-duo-screenshot.png');

  // 8. Switch back to Regular — should restore single color
  console.log('\n--- Switch Back to Regular ---');
  await page.click('[data-weight="regular"]');
  await page.waitForTimeout(1000);
  const singleBack = await page.$eval('#singleColorSection', el => el.style.display !== 'none');
  assert(singleBack, 'Single color section restored');
  const duoGone = await page.$eval('#duoColorSection', el => !el.classList.contains('visible'));
  assert(duoGone, 'Duo color section hidden');

  // Regular icons loaded
  await page.waitForTimeout(1500);
  const regPaths = await page.$$eval('.icon-card svg path', paths => paths.length);
  assert(regPaths > 0, `Regular SVG paths loaded: ${regPaths}`);

  // 9. Test download button exists and is enabled after selecting icon
  console.log('\n--- Download Button ---');
  await page.click('.icon-card:first-child');
  await page.waitForTimeout(500);
  const dlEnabled = await page.$eval('#btnDownload', el => !el.disabled);
  assert(dlEnabled, 'Download button enabled after selecting icon');

  // Summary
  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
