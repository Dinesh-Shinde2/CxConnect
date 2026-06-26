/**
 * Global Authentication Setup
 * Logs in once with User ID + Password and saves the storage state (cookies/localStorage)
 * to playwright/.auth/user.json. This state is reused by authenticated test cases.
 */

const { test } = require('../../src/fixtures/baseFixture');

const authFile = 'playwright/.auth/user.json';

test('authenticate and save storage state', async ({ loginPage, dashboardPage, page }) => {
  // Navigate to the login page
  await loginPage.goto();

  // Retrieve credentials from environment variables dynamically using the helper
  const { resolveCredentials } = require('../../src/utils/credentialsHelper');
  const { role, userId, password } = resolveCredentials();

  if (!userId || !password) {
    throw new Error(`Credentials for role "${role}" (USER_ROLE) are required but not configured in the environment file.`);
  }

  console.log(`[Setup] Performing login for user: ${userId}`);

  // Use the LoginPage POM to login with password flow
  await loginPage.loginWithUserIdAndPassword(userId, password);

  // Verify dashboard loads (ensures we are logged in successfully)
  await dashboardPage.expectDashboardLoaded();
  
  // Wait for all background requests to complete and tokens to be written to storage
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Debug cookies and localStorage
  const activeCookies = await page.context().cookies();
  console.log('[Setup Debug] ACTIVE COOKIES:', JSON.stringify(activeCookies, null, 2));
  const activeLocalStorage = await page.evaluate(() => JSON.stringify(localStorage, null, 2));
  console.log('[Setup Debug] LOCAL STORAGE:', activeLocalStorage);
  const activeSessionStorage = await page.evaluate(() => JSON.stringify(sessionStorage, null, 2));
  console.log('[Setup Debug] SESSION STORAGE:', activeSessionStorage);

  console.log('[Setup] Dashboard loaded successfully. Saving session state...');
 
  const fs = require('fs');
  const path = require('path');
  const sessionFilePath = path.resolve(__dirname, '../../playwright/.auth/sessionStorage.json');
  fs.writeFileSync(sessionFilePath, activeSessionStorage, 'utf-8');
  console.log(`[Setup] Session storage saved to: ${sessionFilePath}`);

  // Save the authenticated context state to file
  await page.context().storageState({ path: authFile });
  console.log(`[Setup] Authentication state saved successfully to: ${authFile}`);
});
