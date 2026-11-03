import { defineConfig } from '@playwright/test'
export default defineConfig({
  outputDir: './test-results/docs',
  testDir: './tests/docs', testMatch: '*.e2e.ts', workers: 1, timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:4323/skydial/', viewport: { width: 1280, height: 900 },
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: { command: 'node scripts/serve-docs.mjs', url: 'http://127.0.0.1:4323/skydial/', reuseExistingServer: !process.env.CI },
})
