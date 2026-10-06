const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:4173', channel: 'chrome', headless: true },
  webServer: { command: 'node tools/server.cjs', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
});
