import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '../e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5176',
    screenshot: 'only-on-failure',
  },
  reporter: [['list']],
  webServer: [
    {
      command: 'npm run dev -w server',
      cwd: '..',
      url: 'http://localhost:4004/api/health',
      reuseExistingServer: true,
      timeout: 20000,
    },
    {
      command: 'npm run dev -w client',
      cwd: '..',
      url: 'http://localhost:5176',
      reuseExistingServer: true,
      timeout: 20000,
    },
  ],
});
