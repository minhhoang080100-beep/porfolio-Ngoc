const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/browser',
    fullyParallel: true,
    workers: 2,
    timeout: 30000,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:4173',
        channel: process.platform === 'win32' ? 'chrome' : undefined,
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure'
    },
    webServer: {
        command: 'node scripts/serve.mjs',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 30000
    }
});
