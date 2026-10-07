const { test, expect } = require('@playwright/test');

for (const width of [1920, 1440, 1024, 390]) {
  test(`deep-link refresh keeps hero at the beginning at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#contact');
    await expect(page.locator('#home')).toHaveAttribute('data-scene', 'ready');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    for (let refresh = 0; refresh < 3; refresh++) {
      await page.evaluate(() => ScrollTrigger.refresh());
      await page.waitForTimeout(100);
      expect(await page.evaluate(() => ScrollTrigger.getById('hero-camera').start)).toBeGreaterThanOrEqual(0);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect.poll(() => page.locator('#home').evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(110);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    expect(await page.locator('#home').evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThan(0);
    expect(await page.locator('#home').count()).toBe(1);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
    await page.reload();
    await expect(page.locator('#home')).toHaveAttribute('data-scene', 'ready');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => ScrollTrigger.getById('hero-camera').start)).toBeGreaterThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}
