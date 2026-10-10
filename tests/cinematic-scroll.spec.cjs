const { test, expect } = require('@playwright/test');

for (const width of [1440, 390]) {
  test(`cinematic scroll reverses camera and background at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('#home')).toHaveAttribute('data-scene', 'ready');
    expect(await page.evaluate(() => !!ScrollTrigger.getById('hero-camera').pin)).toBe(true);
    const visit = async progress => {
      await page.evaluate(p => {
        const t = ScrollTrigger.getById('hero-camera');
        scrollTo({ top: t.start + (t.end - t.start) * p, behavior: 'instant' });
      }, progress);
      await page.waitForTimeout(900);
      return page.evaluate(() => ({
        scale: new DOMMatrix(getComputedStyle(document.querySelector('.cinematic-background')).transform).a,
        z: Number(document.querySelector('#home').dataset.cameraZ),
        stage: document.querySelector('#home').dataset.stage,
        top: document.querySelector('#home').getBoundingClientRect().top,
      }));
    };
    const first = await visit(.14);
    const last = await visit(.78);
    expect(first.stage).toBe('GitHub');
    expect(last.stage).toBe('AWS');
    expect(last.scale).toBeGreaterThan(first.scale + .03);
    expect(last.z).toBeLessThan(first.z - 2);
    expect(Math.abs(last.top - first.top)).toBeLessThan(2);
    for (const [p, name] of [[.62, 'Kubernetes'], [.46, 'Docker'], [.3, 'Jenkins']]) {
      expect((await visit(p)).stage).toBe(name);
    }
    const reversed = await visit(.14);
    expect(reversed.scale).toBeCloseTo(first.scale, 2);
    expect(reversed.z).toBeCloseTo(first.z, 1);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(page.getByRole('link', { name: 'veeresh9009@gmail.com', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('professional identity and static cinematic fallback remain accessible', async ({ page }) => {
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type.startsWith('webgl') ? null : get.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('#home')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.locator('.hero-role')).toHaveText('Software Engineer & Team Lead');
  await expect(page.locator('.cinematic-background')).toBeVisible();
  await expect(page.locator('.pipeline-flow')).toBeVisible();
  await expect(page.getByRole('link', { name: /Download Resume/ })).toBeVisible();
});

test('settled cinematic hero stops issuing WebGL draw calls', async ({ page }) => {
  await page.addInitScript(() => {
    window.heroDraws = 0;
    for (const name of ['drawElements', 'drawArrays']) {
      const original = WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name] = function(...args) {
        // The separate AV introduction animates briefly; measure only the hero.
        if (this.canvas.classList.contains('hero-canvas')) window.heroDraws++;
        return original.apply(this, args);
      };
    }
  });
  await page.goto('/');
  await expect(page.locator('#home')).toHaveAttribute('data-scene', 'ready');
  await page.waitForTimeout(2500);
  const draws = await page.evaluate(() => window.heroDraws);
  expect(draws).toBeGreaterThan(0);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.heroDraws)).toBe(draws);
});
