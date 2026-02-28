import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let passed = 0, failed = 0;

  function assert(condition, label) {
    if (condition) { console.log(`  PASS: ${label}`); passed++; }
    else { console.log(`  FAIL: ${label}`); failed++; }
  }

  await page.goto('http://localhost:8111', { waitUntil: 'networkidle' });

  // Switch to Duo
  await page.click('[data-weight="duotone"]');
  await page.waitForTimeout(2000);

  // Set outline to blue
  console.log('\n--- Set outline to blue ---');
  await page.fill('#duoOutlineColorInput', '#3b82f6');
  await page.press('#duoOutlineColorInput', 'Enter');
  await page.waitForTimeout(500);

  let fills = await page.$$eval('.icon-card:first-child svg [fill]', els =>
    els.map(el => ({ fill: el.getAttribute('fill'), opacity: el.getAttribute('opacity') }))
  );
  console.log('  Fills after blue outline:', JSON.stringify(fills));
  assert(fills.some(f => f.fill === '#3b82f6' && !f.opacity), 'Outline is blue');

  // Now change outline to red WITHOUT switching weight
  console.log('\n--- Change outline to red (no weight switch) ---');
  await page.fill('#duoOutlineColorInput', '#ef4444');
  await page.press('#duoOutlineColorInput', 'Enter');
  await page.waitForTimeout(500);

  fills = await page.$$eval('.icon-card:first-child svg [fill]', els =>
    els.map(el => ({ fill: el.getAttribute('fill'), opacity: el.getAttribute('opacity') }))
  );
  console.log('  Fills after red outline:', JSON.stringify(fills));
  assert(fills.some(f => f.fill === '#ef4444' && !f.opacity), 'Outline updated to red without weight toggle');

  // Change outline a third time to green
  console.log('\n--- Change outline to green ---');
  await page.fill('#duoOutlineColorInput', '#22c55e');
  await page.press('#duoOutlineColorInput', 'Enter');
  await page.waitForTimeout(500);

  fills = await page.$$eval('.icon-card:first-child svg [fill]', els =>
    els.map(el => ({ fill: el.getAttribute('fill'), opacity: el.getAttribute('opacity') }))
  );
  console.log('  Fills after green outline:', JSON.stringify(fills));
  assert(fills.some(f => f.fill === '#22c55e' && !f.opacity), 'Outline updated to green');

  // Also change fill color multiple times
  console.log('\n--- Change fill color to purple ---');
  await page.fill('#duoFillColorInput', '#a855f7');
  await page.press('#duoFillColorInput', 'Enter');
  await page.waitForTimeout(500);

  fills = await page.$$eval('.icon-card:first-child svg [fill]', els =>
    els.map(el => ({ fill: el.getAttribute('fill'), opacity: el.getAttribute('opacity') }))
  );
  console.log('  Fills after purple fill:', JSON.stringify(fills));
  assert(fills.some(f => f.fill === '#a855f7' && f.opacity === '0.2'), 'Fill updated to purple');
  assert(fills.some(f => f.fill === '#22c55e' && !f.opacity), 'Outline still green');

  // Take screenshot
  await page.click('.icon-card:first-child');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-duo-recolor.png' });
  console.log('  Screenshot: test-duo-recolor.png');

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
