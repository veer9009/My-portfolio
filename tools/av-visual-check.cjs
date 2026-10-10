const { chromium } = require('@playwright/test');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const errors = [];
    fs.mkdirSync('test-results', { recursive: true });
    for (const [width, height] of [[1920, 1080], [1366, 768], [390, 844]]) {
      const page = await browser.newPage();
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await page.setViewportSize({ width, height });
      // Freeze browser time so screenshot capture cannot skip a short animation phase.
      const now = new Date();
      await page.clock.install({ time: now });
      await page.clock.pauseAt(new Date(now.getTime() + 1000));
      await page.goto('http://127.0.0.1:4173');
      await page.waitForFunction(() => document.querySelector('.av-intro').dataset.ready === 'true');
      // Clock jumps must also advance the existing hero's entrance timeline.
      // GSAP normally smooths long frame gaps, which is desirable in production.
      await page.evaluate(() => window.gsap?.ticker.lagSmoothing(0));
      await page.clock.runFor(100);
      await page.screenshot({ path: `test-results/av-black-${width}.png` });
      await page.clock.fastForward(650);
      await page.screenshot({ path: `test-results/av-reveal-${width}.png` });
      await page.clock.fastForward(1100);
      await page.screenshot({ path: `test-results/av-orbit-${width}.png` });
      await page.clock.fastForward(1750);
      await page.screenshot({ path: `test-results/av-hold-${width}.png` });
      await page.clock.fastForward(600);
      await page.screenshot({ path: `test-results/av-dissolve-${width}.png` });
      await page.clock.fastForward(800);
      await page.screenshot({ path: `test-results/av-hero-${width}.png` });
      await page.close();
    }
    console.log(JSON.stringify({ errors, screenshots: 'test-results/av-*.png' }));
    if (errors.length) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
