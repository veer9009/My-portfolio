const { test, expect } = require('@playwright/test');

for (const [width, height] of [[1920, 1080], [390, 844]]) {
  test(`gold composition is prominent while the silver AV stays dominant at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const now = new Date();
    await page.clock.install({ time: now });
    await page.clock.pauseAt(new Date(now.getTime() + 1000));
    await page.goto('/');
    await expect(page.locator('.av-intro')).toHaveAttribute('data-ready', 'true');
    await page.clock.runFor(32);
    await page.clock.fastForward(3500);
    const png = await page.screenshot();
    const coverage = await page.evaluate(async base64 => {
      const image = new Image(); image.src = `data:image/png;base64,${base64}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let gold = 0, silver = 0, upperGold = 0, ribbonGold = 0, ribbonArea = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const [r, g, b] = pixels.subarray(i, i + 3);
        const x = (i / 4 % canvas.width) / canvas.width, y = Math.floor(i / 4 / canvas.width) / canvas.height;
        // The outer right orbit is clear of both AV faces and the rear rings.
        const ribbonRegion = canvas.width < 700 ? x > .89 && x < .975 && y > .42 && y < .6
          : x > .775 && x < .83 && y > .45 && y < .67;
        if (ribbonRegion) ribbonArea++;
        if (r > 110 && g > 65 && r > g * 1.12 && b < g * .68) {
          gold++;
          if (ribbonRegion) ribbonGold++;
          if (i / 4 / canvas.width < canvas.height * .34) upperGold++;
        }
        if (r > 100 && g > 100 && b > 100 && Math.max(r, g, b) - Math.min(r, g, b) < 45) silver++;
      }
      const total = canvas.width * canvas.height;
      return { gold: gold / total, silver: silver / total, upperGold: upperGold / total, ribbon: ribbonGold / ribbonArea };
    }, png.toString('base64'));
    // Broad color coverage catches a regression back to the barely visible thin orbit.
    expect(coverage.gold).toBeGreaterThan(.01);
    expect(coverage.silver).toBeGreaterThan(.03);
    expect(coverage.upperGold).toBeGreaterThan(.001);
    expect(coverage.ribbon).toBeGreaterThan(.008);
  });
}

test('stalled imports expose Skip and respect the total five-second deadline', async ({ page }) => {
  const now = new Date();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.getTime() + 1000));
  let pending;
  await page.route('**/av-intro-scene.js', route => { pending = route; });
  await page.goto('/');
  const intro = page.locator('.av-intro');
  await expect(intro).toBeVisible();
  await page.clock.fastForward(300);
  await expect(page.getByRole('button', { name: 'Skip intro' })).toHaveCSS('opacity', '1');
  await page.clock.fastForward(4800);
  await expect(intro).toBeHidden();
  expect(await intro.locator('canvas').evaluate(c => c.width * c.height)).toBe(1);
  if (pending) await pending.abort();
  await expect(page.locator('#hero-title')).toBeVisible();
});

test('black opening, four-to-five second duration and live reduced motion', async ({ page }) => {
  const now = new Date();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.getTime() + 1000));
  await page.goto('/');
  const intro = page.locator('.av-intro');
  await expect(intro).toHaveAttribute('data-ready', 'true');
  await expect(intro).toHaveAttribute('data-phase', 'black');
  await expect(intro).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(intro.locator('canvas')).toHaveCSS('opacity', '0');
  await page.clock.runFor(32); // Establish the animation's first frame.
  await page.clock.fastForward(1600);
  await expect(intro).toHaveAttribute('data-phase', 'orbiting');
  await page.clock.fastForward(1200);
  await expect(intro).toHaveAttribute('data-phase', 'approaching');
  await page.clock.fastForward(700);
  await expect(intro).toHaveAttribute('data-phase', 'holding');
  await page.clock.fastForward(650);
  await expect(intro).toHaveAttribute('data-phase', 'dissolving');
  expect(await intro.evaluate(el => Number(el.style.opacity))).toBeLessThan(.9);
  await page.clock.fastForward(750);
  await expect(intro).toBeHidden();
  await page.reload();
  await expect(intro).toHaveAttribute('data-ready', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(intro).toBeHidden();
});

test('unavailable WebGL and blocked storage cannot trap the visitor', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new Error('Disabled'); };
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type.startsWith('webgl') ? null : original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('.av-intro')).toHaveAttribute('data-phase', 'complete');
  await expect(page.locator('#hero-title')).toBeVisible();
});

test('AV reveals, holds, dissolves, and releases its canvas', async ({ page }) => {
  test.setTimeout(60000); // Synchronous GPU pixel readback is slow on software renderers.
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const now = new Date();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.getTime() + 1000));
  await page.addInitScript(() => {
    window.introFrames = [];
    window.introVisiblePixels = 0;
    const draw = WebGL2RenderingContext.prototype.drawElements;
    let samples = 0;
    WebGL2RenderingContext.prototype.drawElements = function(...args) {
      const result = draw.apply(this, args);
      if (this.canvas.classList.contains('av-intro-canvas') && this.canvas.closest('.av-intro').dataset.phase === 'holding' && samples++ < 60) {
        const pixel = new Uint8Array(4);
        this.readPixels(Math.floor(this.drawingBufferWidth * .4), Math.floor(this.drawingBufferHeight * .5), 1, 1, this.RGBA, this.UNSIGNED_BYTE, pixel);
        if (pixel[0] + pixel[1] + pixel[2] > 12) window.introVisiblePixels++;
      }
      return result;
    };
    new MutationObserver(() => {
      const intro = document.querySelector('.av-intro');
      if (intro?.dataset.phase) window.introFrames.push({
        phase: intro.dataset.phase, opacity: Number(intro.style.opacity)
      });
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-phase', 'style'] });
  });
  await page.goto('/');
  const intro = page.locator('.av-intro');
  await expect(intro).toHaveAttribute('data-ready', 'true');
  // Sample real rendered frames in each phase without simulating 300 GPU frames.
  await page.clock.runFor(464);
  await page.clock.fastForward(3100);
  await page.clock.runFor(64);
  await page.clock.fastForward(700);
  await page.clock.runFor(64);
  await page.clock.fastForward(700);
  await expect(intro).toHaveAttribute('data-phase', 'complete', { timeout: 12000 });
  const frames = await page.evaluate(() => window.introFrames);
  expect(await page.evaluate(() => window.introVisiblePixels)).toBeGreaterThan(0);
  const turning = frames.filter(f => f.phase === 'revealing');
  expect(turning.length).toBeGreaterThan(2);
  const holding = frames.filter(f => f.phase === 'holding');
  expect(holding.length).toBeGreaterThan(2);
  expect(frames.some(f => f.phase === 'dissolving' && f.opacity < .6 && f.opacity > 0)).toBe(true);
  await expect(intro).toBeHidden();
  expect(await intro.locator('canvas').evaluate(c => c.width * c.height)).toBe(1);
  await expect(page.locator('#hero-title')).toBeVisible();
  expect(errors).toEqual([]);
});

test('skip and keyboard navigation immediately reveal the existing portfolio', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect(page.locator('.av-intro')).toBeHidden();
  await expect(page.getByRole('link', { name: /Download Resume/ })).toBeVisible();
  await page.reload();
  await expect(page.locator('.av-intro')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator('.av-intro')).toBeHidden();
});

test('reduced motion and failed WebGL never cover the content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.av-intro')).toBeHidden();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/vendor/three*', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.av-intro')).toBeHidden();
  await expect(page.locator('#hero-title')).toBeVisible();
});

test('phone resize and context loss safely dismiss the intro', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.av-intro')).toBeVisible();
  await page.setViewportSize({ width: 430, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.av-intro canvas').evaluate(c => c.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.locator('.av-intro')).toBeHidden();
  await expect(page.locator('#hero-title')).toBeVisible();
});

test('dismissing the overlay cannot activate a concealed resume link', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const now = new Date();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.getTime() + 1000));
  await page.goto('/');
  await expect(page.locator('.av-intro')).toHaveAttribute('data-ready', 'true');
  await page.clock.runFor(100);
  await expect(page.locator('.av-intro')).toBeVisible();
  let downloads = 0;
  page.on('download', () => downloads++);
  const box = await page.getByRole('link', { name: /Download Resume/ }).boundingBox();
  expect(box.y + box.height / 2).toBeLessThan(1080);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('.av-intro')).toBeHidden();
  await page.waitForTimeout(250);
  expect(downloads).toBe(0);
});
