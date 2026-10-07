const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  // Each test creates a WebGL context. Run one Chrome worker on this local
  // machine so concurrent GPU/browser startup cannot consume assertion budgets.
  workers: 1,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:4173', channel: 'chrome', headless: true },
  webServer: { command: 'node tools/server.cjs', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
});
