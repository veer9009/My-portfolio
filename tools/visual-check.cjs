const { chromium } = require('@playwright/test');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:4173');
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync('test-results', { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.screenshot({ path: `test-results/portfolio-${width}.png`, fullPage: true });
  }
  const links = await page.locator('a').evaluateAll(elements => elements.map(a => a.getAttribute('href')));
  for (const href of [...new Set(links.filter(href => href.startsWith('#')))]) {
    if (await page.locator(href).count() !== 1) throw new Error(`Invalid anchor ${href}`);
  }
  for (const file of ['/', '/styles.css', '/script.js', '/vendor/gsap.min.js', '/vendor/ScrollTrigger.min.js', '/Veeresh_Resume_Updated_Dev.pdf']) {
    const response = await page.request.get(`http://127.0.0.1:4173${file}`);
    if (!response.ok()) throw new Error(`HTTP ${response.status()} for ${file}`);
  }
  console.log(JSON.stringify({ screenshots: [1440, 390], anchors: 'valid', localAssets: 'HTTP 200', errors }, null, 2));
  await browser.close();
  if (errors.length) process.exitCode = 1;
})();
