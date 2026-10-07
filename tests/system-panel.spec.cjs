const { test, expect } = require('@playwright/test');

async function visiblePanel(page) {
  const panel = page.getByRole('region', { name: 'Deployment status', exact: true });
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS('opacity', '1');
  await expect(panel.getByRole('heading', { name: 'SYSTEM ONLINE' })).toBeVisible();
  await expect(panel.getByRole('link', { name: 'veereshdev.online' })).toBeVisible();
  await expect(panel).toContainText('Portfolio presentation');
  for (const value of ['SUCCESS', 'PRODUCTION', 'AWS', 'Docker', 'Kubernetes', 'Jenkins', 'ACTIVE']) {
    await expect(panel).toContainText(value);
  }
  return panel;
}

for (const width of [1920, 1440, 1024, 768, 430, 390]) {
  test(`status panel stays visible across initialization, refresh and scrolling at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await visiblePanel(page);
    await expect(page.locator('#home')).toHaveAttribute('data-scene', 'ready');
    await visiblePanel(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await visiblePanel(page);
    await expect(page.locator('#home')).toHaveAttribute('data-scene', 'ready');
    await page.evaluate(() => {
      ScrollTrigger.refresh();
      const trigger = ScrollTrigger.getById('hero-camera');
      scrollTo({ top: trigger.start + (trigger.end - trigger.start) * .78, behavior: 'instant' });
    });
    await expect(page.locator('#home')).toHaveAttribute('data-stage', 'AWS');
    const panel = await visiblePanel(page);
    expect(await panel.evaluate(el => !!el.closest('#home'))).toBe(width >= 1280);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await expect(page.locator('#home')).toHaveAttribute('data-stage', 'GitHub');
    await visiblePanel(page);
    await panel.scrollIntoViewIfNeeded();
    expect(await panel.evaluate(el => {
      const r = el.getBoundingClientRect();
      const header = document.querySelector('.site-header').getBoundingClientRect().bottom;
      const y = (Math.max(r.top, header + 1) + Math.min(r.bottom, innerHeight - 1)) / 2;
      const hit = document.elementFromPoint(r.left + r.width / 2, y);
      return el.contains(hit);
    })).toBe(true);
    const intersects = await panel.evaluate(el => {
      const a = el.getBoundingClientRect(), b = document.querySelector('.pipeline').getBoundingClientRect();
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    });
    expect(intersects).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('status panel survives five normal reloads and a cache-bypassing hard reload', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await visiblePanel(page);
  for (let i = 0; i < 5; i++) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await visiblePanel(page);
  }
  const session = await page.context().newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.setCacheDisabled', { cacheDisabled: true });
  await Promise.all([page.waitForEvent('load'), session.send('Page.reload', { ignoreCache: true })]);
  await visiblePanel(page);
  await expect(page.locator('#home')).toHaveAttribute('data-scene', 'ready');
  await page.evaluate(() => ScrollTrigger.refresh());
  await visiblePanel(page);
});

test('status panel is present without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await visiblePanel(page);
    await page.reload();
    await visiblePanel(page);
  } finally { await context.close(); }
});

test('status panel remains visible with reduced motion and unavailable WebGL', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type.startsWith('webgl') ? null : original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('#home')).toHaveAttribute('data-scene', 'fallback');
  await visiblePanel(page);
  await page.reload();
  await visiblePanel(page);
});
