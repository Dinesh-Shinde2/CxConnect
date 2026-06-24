const { defineConfig, devices } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

// ── Environment Configuration Setup ─────────────────────────────
// Load environment-specific configuration (e.g. .env.uat, .env.qa, .env.prod)
// followed by the global .env defaults.
const env = process.env.TEST_ENV || 'uat';
dotenv.config({ path: path.resolve(__dirname, `.env.${env}`) });
dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI 2 times, locally use config or retry 1 time */
  retries: process.env.CI ? 2 : (process.env.RETRY_COUNT ? parseInt(process.env.RETRY_COUNT, 10) : 1),
  
  /* Opt out of parallel tests on CI. Number of workers represents concurrency level. */
  workers: process.env.CI ? 4 : (process.env.PARALLEL_WORKERS ? parseInt(process.env.PARALLEL_WORKERS, 10) : 2),
  
  /* Timeout settings */
  timeout: process.env.DEFAULT_TIMEOUT ? parseInt(process.env.DEFAULT_TIMEOUT, 10) : 60000,
  expect: {
    timeout: 10000,
  },

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'https://uat.ishancxconnect.com',

    /* Collect trace when retrying a failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    
    /* Take screenshot only on test failure */
    screenshot: 'only-on-failure',
    
    /* Record video only on test failure */
    video: 'retain-on-failure',
    
    /* Headless mode configuration */
    headless: process.env.HEADLESS !== 'false',
    
    /* Viewport configuration */
    viewport: { width: 1280, height: 720 },
    
    /* Assert timeout on page actions */
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    // ── Global Authentication Setup Project ──
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /.*-authenticated\.spec\.js/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /.*-authenticated\.spec\.js/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /.*-authenticated\.spec\.js/,
    },
    // ── Authenticated Project (Reuses storageState and depends on setup) ──
    {
      name: 'chromium-authenticated',
      use: { 
        ...devices['Desktop Chrome'],
        // Use the saved authentication state
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /.*-authenticated\.spec\.js/,
    },
  ],

  /* Folder for test artifacts like screenshots, videos, traces, etc. */
  outputDir: 'test-results/',
});
