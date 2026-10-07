const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  fs.mkdirSync('test-results', { recursive: true });
  try {
    for (const width of [1920, 1440, 1024, 768, 430, 390]) {
      await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
      await page.goto('http://127.0.0.1:4173');
      await page.waitForFunction(() => document.querySelector('#home').dataset.scene === 'ready');
      await page.waitForTimeout(1600);
      await page.locator('#home').screenshot({ path: `test-results/cinematic-${width}.png` });
      let previous = 0;
      for (const [progress, name] of [[.14, 'GitHub'], [.3, 'Jenkins'], [.46, 'Docker'], [.62, 'Kubernetes'], [.78, 'AWS'], [.46, 'Docker'], [.14, 'GitHub']]) {
        await page.evaluate(p => {
          const t = ScrollTrigger.getById('hero-camera');
          scrollTo({ top: t.start + (t.end - t.start) * p, behavior: 'instant' });
        }, progress);
        await page.waitForTimeout(700);
        assert.equal(await page.locator('#home').getAttribute('data-stage'), name);
        if (width === 390 || width === 1440) await page.screenshot({ path: `test-results/cinematic-${width}-${name}-${progress < previous ? 'reverse' : 'forward'}.png` });
        previous = progress;
      }
      const release = await page.evaluate(async () => {
        const t = ScrollTrigger.getById('hero-camera');
        const sample = async offset => {
          scrollTo({ top: t.end + offset, behavior: 'instant' });
          await new Promise(resolve => setTimeout(resolve, 500));
          return document.querySelector('#home').getBoundingClientRect().top;
        };
        return [await sample(-1), await sample(1), await sample(21)];
      });
      assert(Math.abs(release[1] - release[0]) < 5, 'Pin release jumped');
      assert(Math.abs(release[2] - release[1] + 20) < 3, 'Hero did not resume normal flow');
      for (const id of ['about', 'experience', 'professional-projects', 'personal-projects', 'skills', 'credentials', 'contact']) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        await page.waitForTimeout(750);
        assert(await page.locator(`#${id} h2`).isVisible(), `${id} heading missing`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width} in ${id}`);
      }
      console.log(JSON.stringify({ width, forwardReverse: 'passed', release: 'smooth', sections: 'passed', overflow: false }));
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('http://127.0.0.1:4173');
    await page.waitForFunction(() => document.querySelector('#home').dataset.scene === 'ready');
    assert.equal(await page.evaluate(() => ScrollTrigger.getAll().length), 0);
    assert(await page.locator('.pipeline-flow').isVisible());
    await page.locator('#home').screenshot({ path: 'test-results/cinematic-reduced-motion.png' });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ reducedMotion: 'static, accessible', consoleAndAssetErrors: errors }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
