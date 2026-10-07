const { chromium } = require('@playwright/test');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  fs.mkdirSync('test-results', { recursive: true });
  for (const width of [1920, 1440, 1024, 768, 430, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:4173');
    await page.waitForTimeout(2200);
    console.log(JSON.stringify(await page.evaluate(() => ({ width: innerWidth, scene: document.querySelector('#home').dataset, overflow: document.documentElement.scrollWidth > innerWidth, canvas: { width: document.querySelector('canvas').width, height: document.querySelector('canvas').height, rect: document.querySelector('canvas').getBoundingClientRect().toJSON() }, triggers: ScrollTrigger.getAll().length }))));
    await page.locator('#home').screenshot({ path: `test-results/hero-${width}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4173');
  await page.waitForTimeout(2000);
  for (const [progress, stage] of [[.46, 'Docker'], [.98, 'exit']]) {
    await page.evaluate(p => {
      const trigger = ScrollTrigger.getById('hero-camera');
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * p, behavior: 'instant' });
    }, progress);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `test-results/hero-stage-${stage}.png` });
    console.log(JSON.stringify(await page.evaluate(() => ({ stage: document.querySelector('#home').dataset.stage, opacity: getComputedStyle(document.querySelector('.hero-scene')).opacity }))));
  }
  console.log(JSON.stringify({ errors }));
  await browser.close();
  if (errors.length) process.exitCode = 1;
})();
