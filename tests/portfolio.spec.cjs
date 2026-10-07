const { test, expect } = require('@playwright/test');
for (const width of [1920, 1440, 1024, 768, 430, 390]) {
  test(`content and animations work at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('VEERESH');
    await expect(page.locator('.hero-role')).toHaveText('Software Engineer & Team Lead');
    await expect.poll(() => page.evaluate(() => !!window.ScrollTrigger && ScrollTrigger.getAll().length > 5)).toBe(true);
    for (const id of ['about', 'experience', 'professional-projects', 'personal-projects', 'skills', 'credentials', 'contact']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const heading = page.locator(`#${id} h2`);
      await expect(heading).toBeVisible();
      // Wait for actual reveal completion and inspect every word in one browser
      // call rather than accumulating fixed sleeps and a round trip per word.
      await expect.poll(() => heading.evaluate(el => Math.min(
        +getComputedStyle(el).opacity,
        ...[...el.querySelectorAll('.motion-word')].map(word => +getComputedStyle(word).opacity)
      ))).toBeGreaterThan(0.9);
    }
    // One-shot reveals release their triggers as they complete. The persistent
    // progress and timeline triggers must still exist at the bottom of the page.
    expect(await page.evaluate(() => ScrollTrigger.getAll().length > 0)).toBe(true);
    expect(errors).toEqual([]);
  });
}
test('mobile navigation, keyboard dismissal, and resume download', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Open navigation' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.locator('.nav a[href="#experience"]').click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await page.locator('.hero').scrollIntoViewIfNeeded();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: /Download Resume/ }).click();
  expect((await download).suggestedFilename()).toBe('Aligar_Veeresh_Resume.pdf');
});
test('reduced motion and no JavaScript preserve readable content', async ({ browser, page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => ScrollTrigger.getAll().length)).toBe(0);
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const plain = await context.newPage();
  await plain.goto('http://127.0.0.1:4173');
  await expect(plain.locator('h1')).toBeVisible();
  await expect(plain.locator('.nav a[href="#contact"]')).toBeVisible();
  await context.close();
});
test('navigation, timeline and progress follow scrolling; motion preferences update live', async ({ page }) => {
  await page.goto('/');
  await page.locator('#experience').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await expect(page.locator('.nav a[href="#experience"]')).toHaveAttribute('aria-current', 'location');
  const before = await page.locator('.timeline-track > span').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).d);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const after = await page.locator('.timeline-track > span').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).d);
  expect(after).toBeGreaterThan(before);
  expect(await page.locator('.scroll-progress').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThan(.8);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => ScrollTrigger.getAll().length)).toBe(0);
  for (const element of await page.locator('.reveal').all()) {
    expect(await element.evaluate(el => +getComputedStyle(el).opacity)).toBe(1);
  }
});
