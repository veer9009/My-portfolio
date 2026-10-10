const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

async function pauseClock(page) {
  const now = new Date();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.getTime() + 1000));
}

async function expectPlayback(page) {
  const intro = page.locator('.av-intro');
  await expect(intro).toBeVisible();
  await expect(intro).toHaveAttribute('data-ready', 'true', { timeout: 15000 });
  await expect(page.locator('.av-intro canvas')).toHaveCount(1);
  await page.clock.runFor(32);
  await page.clock.fastForward(4200);
  await expect(intro).toHaveAttribute('data-phase', 'dissolving');
  expect(await intro.evaluate(el => Number(el.style.opacity))).toBeLessThan(.9);
  await page.clock.fastForward(800);
  await expect(intro).toBeHidden({ timeout: 7000 });
  await expect(intro).toHaveAttribute('data-phase', 'complete');
  expect(await intro.locator('canvas').evaluate(c => c.width * c.height)).toBe(1);
  await expect(page.locator('#hero-title')).toBeVisible();
}

test('normal profile replays with an existing seen flag, normal and hard refresh, and repeated reloads', async ({ playwright, baseURL }) => {
  test.setTimeout(90000);
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'av-intro-replay-'));
  const context = await playwright.chromium.launchPersistentContext(profile, {
    channel: 'chrome', headless: true, baseURL,
  });
  try {
    const page = context.pages()[0];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await pauseClock(page);
    await page.addInitScript(() => sessionStorage.setItem('av-intro-seen', '1'));
    await page.goto('/');
    await expectPlayback(page);
    await page.reload();
    await expectPlayback(page);
    const cdp = await context.newCDPSession(page);
    await Promise.all([
      page.waitForEvent('domcontentloaded'),
      cdp.send('Page.reload', { ignoreCache: true }),
    ]);
    await expectPlayback(page);
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await expectPlayback(page);
    }
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await fs.rm(profile, { recursive: true, force: true });
  }
});

test('Incognito context replays after completion and after Skip', async ({ page }) => {
  test.setTimeout(30000);
  await pauseClock(page);
  await page.goto('/');
  await expectPlayback(page);
  await page.reload();
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect(page.locator('.av-intro')).toBeHidden();
  await page.reload();
  await expectPlayback(page);
});

test('deep-link loads and refreshes with restored scrolling still play', async ({ page }) => {
  test.setTimeout(30000);
  await pauseClock(page);
  await page.goto('/#contact');
  await expect(page.locator('.av-intro')).toHaveAttribute('data-ready', 'true', { timeout: 15000 });
  await expect(page.locator('.av-intro')).toBeVisible();
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect(page.locator('.av-intro')).toBeHidden();
  await expect(page).toHaveURL(/#contact$/);
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await page.clock.runFor(100);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(20);
  await page.reload();
  await expect(page.locator('.av-intro')).toHaveAttribute('data-ready', 'true', { timeout: 15000 });
  await expect(page.locator('.av-intro')).toBeVisible();
  await page.clock.runFor(32);
  await page.clock.fastForward(5100);
  await expect(page.locator('.av-intro')).toBeHidden({ timeout: 7000 });
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(20);
});
