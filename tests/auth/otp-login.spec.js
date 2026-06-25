/**
 * OTP Login Test Suite
 * Login Method: Email + OTP (One-Time Password)
 *
 * Run command:
 *   npm run test:login:otp
 *
 * Credentials loaded from .env.uat (or the active TEST_ENV):
 *   ADMIN_EMAIL=<your_email>
 *
 * ⚠️  OTP Retrieval:
 *   The `OtpHelper.getDynamicOTP()` is a placeholder.
 *   Replace it with your actual OTP source:
 *     - Mailosaur / Mailtrap API
 *     - Gmail API
 *     - MongoDB / PostgreSQL query
 *     - SMS provider (Twilio, etc.)
 */

const { test, expect } = require('../../src/fixtures/baseFixture');
const { OtpHelper } = require('../../src/utils/otpHelper');

test.describe('OTP Login | CX-Connect', () => {

  // Navigate to login page before every test
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    // Ensure we start in OTP mode (default view)
    await loginPage.switchToOtpMode();
  });

  // ─────────────────────────────────────────────────────────────
  // TC_OTP_001 | OTP mode shows Email input and Get OTP button
  // ─────────────────────────────────────────────────────────────
  test('TC_OTP_001 | OTP mode shows Email input and Get OTP button @smoke', async ({ loginPage }) => {
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.getOtpButton).toBeVisible();
    console.log('[TC_OTP_001] ✅ OTP mode elements are visible');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_OTP_002 | Entering email and clicking Get OTP triggers OTP input
  // ─────────────────────────────────────────────────────────────
  test('TC_OTP_002 | Entering email and clicking Get OTP shows OTP input field @smoke', async ({ loginPage }) => {
    const email = process.env.ADMIN_EMAIL;
    if (!email) {
      throw new Error('ADMIN_EMAIL must be set in your .env.uat file');
    }

    await loginPage.emailInput.fill(email);
    await loginPage.getOtpButton.click();

    // OTP input should appear
    await loginPage.expectOtpFieldVisible();
    console.log('[TC_OTP_002] ✅ OTP input is visible after clicking Get OTP');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_OTP_003 | Full OTP login flow: email → OTP → dashboard
  // (uses placeholder OTP — replace OtpHelper with real retrieval)
  // ─────────────────────────────────────────────────────────────
  test('TC_OTP_003 | Valid email + OTP redirects to dashboard @smoke', async ({ loginPage, dashboardPage }) => {
    const email = process.env.ADMIN_EMAIL;
    if (!email) {
      throw new Error('ADMIN_EMAIL must be set in your .env.uat file');
    }

    console.log(`[TC_OTP_003] Initiating OTP login for: ${email}`);

    // The loginWithEmailOTP method:
    //   1. Fills email
    //   2. Clicks "Get OTP"
    //   3. Calls OtpHelper.getDynamicOTP(email) to fetch the OTP
    //   4. Fills OTP digits
    //   5. Clicks Login/Verify
    await loginPage.loginWithEmailOTP(email, OtpHelper.getDynamicOTP);

    await dashboardPage.expectDashboardLoaded();
    console.log('[TC_OTP_003] ✅ OTP login successful — dashboard loaded');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_OTP_004 | Empty email shows validation error
  // ─────────────────────────────────────────────────────────────
  test('TC_OTP_004 | Empty email field shows validation error', async ({ loginPage }) => {
    await loginPage.getOtpButton.click();
    // Should remain on login page with some error/validation
    await expect(loginPage.page).toHaveURL(/.*login/, { timeout: 5000 });
    console.log('[TC_OTP_004] ✅ Stayed on login page for empty email');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_OTP_005 | Switching to password mode shows User ID + Password
  // ─────────────────────────────────────────────────────────────
  test('TC_OTP_005 | "Or login with Password" link switches to password mode', async ({ loginPage }) => {
    await loginPage.switchToPasswordMode();
    await expect(loginPage.userIdInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    console.log('[TC_OTP_005] ✅ Switched to password mode successfully');
  });

});
