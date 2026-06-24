/**
 * Global Authentication Setup
 * Logs in once with User ID + Password and saves the storage state (cookies/localStorage)
 * to playwright/.auth/user.json. This state is reused by authenticated test cases.
 */

const { test } = require('../fixtures/baseFixture');

const authFile = 'playwright/.auth/user.json';

test('authenticate and save storage state', async ({ loginPage, dashboardPage, page }) => {
  // Navigate to the login page
  await loginPage.goto();

  // Retrieve credentials from environment variables
  const userId = process.env.USER_ID;
  const password = process.env.USER_PASSWORD;

  if (!userId || !password) {
    throw new Error('USER_ID and USER_PASSWORD environment variables are required in the environment file.');
  }

  console.log(`[Setup] Performing login for user: ${userId}`);

  // Use the LoginPage POM to login with password flow
  await loginPage.loginWithUserIdAndPassword(userId, password);

  // Verify dashboard loads (ensures we are logged in successfully)
  await dashboardPage.expectDashboardLoaded();
  console.log('[Setup] Dashboard loaded successfully. Saving session state...');

  // Save the authenticated context state to file
  await page.context().storageState({ path: authFile });
  console.log(`[Setup] Authentication state saved successfully to: ${authFile}`);
});
