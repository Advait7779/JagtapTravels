const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.cjs',
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:5201',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node tests/browser-server.cjs',
    url: 'http://127.0.0.1:5201/api/health',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
