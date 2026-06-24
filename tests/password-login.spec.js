/**
 * Password Login Test Suite
 * Login Method: User ID + Password
 *
 * Run command:
 *   npm run test:login:password:chromium   → Chromium only (fastest)
 *   npm run test:login:password            → All browsers
 *   npm run test:login:password:headed     → Visual/headed mode
 *
 * Credentials loaded from .env.uat (or active TEST_ENV):
 *   USER_ID=<your_user_id>
 *   USER_PASSWORD=<your_password>
 */

const { test, expect } = require('../fixtures/baseFixture');

test.describe('Password Login | CX-Connect', () => {
  // Serial mode: prevents parallel login conflicts on the same UAT environment
  test.describe.configure({ mode: 'serial' });

  // Navigate to login page and switch to password mode before every test
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.switchToPasswordMode();
  });

  // ─────────────────────────────────────────────────────────────
  // TC_PWD_001 | Successful login with valid credentials
  // ─────────────────────────────────────────────────────────────
  test('TC_PWD_001 | Valid User ID + Password redirects to dashboard @smoke', async ({ loginPage, dashboardPage }) => {
    const userId   = process.env.USER_ID;
    const password = process.env.USER_PASSWORD;

    if (!userId || !password) {
      throw new Error('USER_ID and USER_PASSWORD must be set in your .env.uat file');
    }

    console.log(`[TC_PWD_001] Logging in as: ${userId}`);
    await loginPage.loginWithUserIdAndPassword(userId, password);

    // Assert: URL must redirect to dashboard
    await dashboardPage.expectDashboardLoaded();
    console.log('[TC_PWD_001] ✅ Dashboard loaded successfully');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_PWD_002 | Dashboard shows Agents Overview stats cards
  // ─────────────────────────────────────────────────────────────
  test('TC_PWD_002 | Dashboard shows Agents Overview stats after login', async ({ loginPage, dashboardPage }) => {
    await loginPage.loginWithUserIdAndPassword(
      process.env.USER_ID,
      process.env.USER_PASSWORD
    );
    await dashboardPage.expectDashboardLoaded();
    await dashboardPage.expectStatsCardsVisible();
    console.log('[TC_PWD_002] ✅ Agents Overview stats are visible');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_PWD_003 | Dashboard shows Refresh and Add Widget buttons
  // ─────────────────────────────────────────────────────────────
  test('TC_PWD_003 | Dashboard action buttons are visible after login', async ({ loginPage, dashboardPage }) => {
    await loginPage.loginWithUserIdAndPassword(
      process.env.USER_ID,
      process.env.USER_PASSWORD
    );
    await dashboardPage.expectDashboardLoaded();
    await dashboardPage.expectActionButtonsVisible();
    console.log('[TC_PWD_003] ✅ Refresh and Add Widget buttons are visible');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_PWD_004 | Invalid credentials show "Invalid credentials" error
  // ─────────────────────────────────────────────────────────────
  test('TC_PWD_004 | Invalid credentials show error message', async ({ loginPage, page }) => {
    // Fill both fields with wrong data so the Login button becomes enabled
    await loginPage.userIdInput.fill('invalid_user_999');
    await loginPage.passwordInput.fill('WrongPass@000');

    // Wait for button to become enabled (app enables it when both fields are filled)
    await expect(loginPage.loginButton).toBeEnabled({ timeout: 8000 });
    await loginPage.loginButton.click();

    // Should stay on login page
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });

    // Assert "Invalid credentials" error text is visible (actual text from app screenshot)
    await expect(page.getByText(/invalid credentials/i)).toBeVisible({ timeout: 10000 });
    console.log('[TC_PWD_004] ✅ "Invalid credentials" error shown');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_PWD_005 | Login button disabled when User ID is empty
  // ─────────────────────────────────────────────────────────────
  test('TC_PWD_005 | Empty User ID keeps Login button disabled', async ({ loginPage }) => {
    // Fill only password — app disables Login button until both fields have values
    await loginPage.passwordInput.fill(process.env.USER_PASSWORD || 'AnyPass@123');

    // Assert button remains disabled (this IS the app's built-in validation)
    const isDisabled = await loginPage.isLoginButtonDisabled();
    expect(isDisabled).toBeTruthy();
    console.log('[TC_PWD_005] ✅ Login button correctly disabled when User ID is empty');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_PWD_006 | "Or login with OTP" switches to OTP mode
  // ─────────────────────────────────────────────────────────────
  test('TC_PWD_006 | "Or login with OTP" link switches to OTP mode', async ({ loginPage }) => {
    await loginPage.switchToOtpMode();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.getOtpButton).toBeVisible();
    console.log('[TC_PWD_006] ✅ Switched to OTP mode successfully');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_PWD_007 | Password field is masked by default
  // ─────────────────────────────────────────────────────────────
  test('TC_PWD_007 | Password field is masked by default', async ({ loginPage }) => {
    const inputType = await loginPage.passwordInput.getAttribute('type');
    expect(inputType).toBe('password');
    console.log('[TC_PWD_007] ✅ Password is masked by default');
  });

});
