const { test, expect } = require('@playwright/test');
for (const width of [1920, 1440, 1024, 768, 430, 390]) {
  test(`WebGL hero renders and resizes at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('#home')).toHaveAttribute('data-scene', 'ready');
    const canvas = page.locator('.hero-canvas');
    await expect(canvas).toBeVisible();
    expect(await canvas.evaluate(c => c.width > 0 && c.height > 0)).toBe(true);
    const first = await canvas.evaluate(c => c.width);
    // Large desktop layouts deliberately cap the visual's width. Cross the
    // breakpoint to exercise a real canvas size change rather than that cap.
    await page.setViewportSize({ width: width > 900 ? 430 : width - 30, height: 800 });
    await expect.poll(() => canvas.evaluate(c => c.width)).not.toBe(first);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('link', { name: /Download Resume/ })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
test('camera visits pipeline stages, then dims; rendering pauses offscreen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#home')).toHaveAttribute('data-scene', 'ready');
  for (const [progress, stage] of [[.14, 'GitHub'], [.3, 'Jenkins'], [.46, 'Docker'], [.62, 'Kubernetes'], [.78, 'AWS']]) {
    await page.evaluate(p => {
      const trigger = ScrollTrigger.getById('hero-camera');
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * p, behavior: 'instant' });
    }, progress);
    await expect(page.locator('#home')).toHaveAttribute('data-stage', stage);
  }
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.locator('#home')).toHaveAttribute('data-rendering', 'paused');
  await page.locator('#home').scrollIntoViewIfNeeded();
  await expect(page.locator('#home')).toHaveAttribute('data-rendering', 'running');
});
test('reduced motion stays static and switches live without residual triggers', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#home')).toHaveAttribute('data-scene', 'ready');
  await expect(page.locator('#home')).toHaveAttribute('data-rendering', 'static');
  expect(await page.evaluate(() => ScrollTrigger.getAll().length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => page.evaluate(() => !!ScrollTrigger.getById('hero-camera'))).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => ScrollTrigger.getAll().length)).toBe(0);
  await expect(page.locator('.pipeline-flow')).toBeVisible();
});
test('blocked Three.js keeps the original HTML illustration and controls', async ({ page }) => {
  await page.route('**/vendor/three*', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#home')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.locator('.pipeline-flow')).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('link', { name: /View Projects/ })).toBeVisible();
});
test('unavailable WebGL and lost context restore HTML without hiding content', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type.startsWith('webgl') ? null : original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('#home')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.locator('.pipeline-flow')).toBeVisible();
});
test('context loss restores the fallback and releases camera trigger', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#home')).toHaveAttribute('data-scene', 'ready');
  await page.locator('.hero-canvas').evaluate(c => c.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.locator('#home')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.locator('.pipeline-flow')).toBeVisible();
  expect(await page.evaluate(() => !!ScrollTrigger.getById('hero-camera'))).toBe(false);
});
test('hidden page does not render on scroll or resize callbacks', async ({ page }) => {
  await page.addInitScript(() => {
    window.webglDraws = 0;
    for (const name of ['drawElements', 'drawArrays']) {
      const original = WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name] = function(...args) { window.webglDraws++; return original.apply(this, args); };
    }
  });
  await page.goto('/');
  await expect(page.locator('#home')).toHaveAttribute('data-scene', 'ready');
  const draws = await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    return window.webglDraws;
  });
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.evaluate(() => { window.scrollTo({ top: 250, behavior: 'instant' }); ScrollTrigger.update(); });
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.webglDraws)).toBe(draws);
});
test('render exception restores HTML without uncaught errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#home')).toHaveAttribute('data-scene', 'ready');
  await page.evaluate(() => {
    WebGL2RenderingContext.prototype.drawElements = () => { throw new Error('Device render failed'); };
  });
  await page.setViewportSize({ width: 430, height: 800 });
  await expect(page.locator('#home')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.locator('.pipeline-flow')).toBeVisible();
  expect(errors).toEqual([]);
});
