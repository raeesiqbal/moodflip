import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3005';
const startServer = process.env.PLAYWRIGHT_START_SERVER === '1';
const authEnabled = Boolean(process.env.PLAYWRIGHT_TEST_EMAIL && process.env.PLAYWRIGHT_TEST_PASSWORD);
const allowWrites = process.env.PLAYWRIGHT_ALLOW_WRITES === '1';
const serverCommand = process.env.PLAYWRIGHT_SERVER_MODE === 'production'
  ? 'node node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3005'
  : 'node node_modules/next/dist/bin/next dev -H 0.0.0.0 -p 3005';

export default defineConfig({
  testDir: './playwright/tests',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    navigationTimeout: 20_000,
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', testIgnore: ['**/*.auth.spec.ts', '**/auth.setup.ts', '**/controlled-writes.spec.ts'], use: { ...devices['Desktop Chrome'] } },
    ...(allowWrites ? [{ name: 'controlled-writes', testMatch: '**/controlled-writes.spec.ts', use: { ...devices['Desktop Chrome'] } }] : []),
    ...(authEnabled ? [{
      name: 'chromium-authenticated',
      testMatch: '**/*.auth.spec.ts',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/customer.json' },
      dependencies: ['auth-setup'],
    }, {
      name: 'auth-setup',
      testMatch: '**/auth.setup.ts',
      use: { ...devices['Desktop Chrome'] },
    }] : []),
  ],
  webServer: startServer ? {
    command: serverCommand,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  } : undefined,
});
