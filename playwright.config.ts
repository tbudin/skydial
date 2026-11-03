import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  outputDir: './test-results/browser',
  testMatch: '*.e2e.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:4175/package-demo/', viewport: { width: 1280, height: 900 } },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } } },
    // Linux CI needs a virtual display for Firefox's WebGL renderer.
    { name: 'firefox', use: { browserName: 'firefox', headless: !(process.env.CI && process.platform === 'linux'), launchOptions: { firefoxUserPrefs: { 'webgl.force-enabled': true, 'webgl.enable-webgl2': true } } } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: { command: 'npm run preview:consumer', url: 'http://127.0.0.1:4175/package-demo/', reuseExistingServer: !process.env.CI },
})
