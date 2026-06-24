const { expect } = require('@playwright/test');

/**
 * LoginPage Class - Page Object Model
 * Reflects actual CX-Connect UI login options:
 *   - Mode 1: User ID + Password
 *   - Mode 2: Email + OTP
 * Includes a unified login() method that switches modes dynamically based on configurations.
 */
class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Email / OTP Mode Selectors ──────────────────────────────────────
    this.emailInput = page.locator('input#otp-username, input[placeholder="enter your email"], input[type="email"], input[name="email"]');
    this.getOtpButton = page.locator('button:has-text("Get OTP"), [data-testid="get-otp-btn"]');
    this.otpInput = page.locator('input[aria-label="OTP digit 1"], input[placeholder*="OTP" i], input[name="otp"], [data-testid="otp-input"]');
    this.verifyOtpButton = page.locator('button:has-text("Login"), button:has-text("Verify"), button:has-text("Submit OTP"), [data-testid="verify-otp-btn"]');
    this.loginWithPasswordLink = page.locator('span:has-text("Password"), button:has-text("Password"), a:has-text("Password")');

    // ── Password / User-ID Mode Selectors ───────────────────────────────
    this.userIdInput = page.locator('input#login-username, input[placeholder="enter your user id"], input[name="userId"], input[name="username"]');
    this.passwordInput = page.locator('input#login-password, input[type="password"], input[name="password"]');
    this.showPasswordToggle = page.locator('button.absolute.right-3.top-1\\/2, .absolute.right-3.top-1\\/2, .eye-icon, [aria-label="Show password"]');
    this.loginButton = page.locator('button:has-text("Login"), button[type="submit"]:has-text("Login"), [data-testid="login-btn"]');
    this.loginWithOtpLink = page.locator('span:has-text("OTP"), button:has-text("OTP"), a:has-text("OTP")');

    // ── Common/General Selectors ────────────────────────────────────────
    this.logo = page.locator('img[alt*="CX" i], img[alt*="Ishan" i], .logo img, header img');
    // Error message — the app shows a pink box with text like "Invalid credentials"
    // Using broad locator: any element containing error-like text after a failed login
    this.errorMessage = page.locator(
      '[class*="error"], [class*="alert"], [class*="invalid"], [role="alert"], ' +
      '[class*="Error"], [class*="Alert"]'
    ).first();
    this.loadingSpinner = page.locator('.spinner, .loader, [role="progressbar"]');
  }

  // ── Navigation ────────────────────────────────────────────────────────
  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    // Ensure one of the entry fields is visible before proceeding
    await Promise.any([
      this.userIdInput.waitFor({ state: 'visible', timeout: 10000 }),
      this.emailInput.waitFor({ state: 'visible', timeout: 10000 })
    ]).catch(() => {});
  }

  // ── Mode Switchers ───────────────────────────────────────────────────
  async switchToPasswordMode() {
    const isPasswordVisible = await this.userIdInput.isVisible();
    if (!isPasswordVisible) {
      await this.loginWithPasswordLink.click();
      await this.userIdInput.waitFor({ state: 'visible', timeout: 5000 });
    }
  }

  async switchToOtpMode() {
    const isOtpVisible = await this.emailInput.isVisible();
    if (!isOtpVisible) {
      await this.loginWithOtpLink.click();
      await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
    }
  }

  // ── Action Flows ──────────────────────────────────────────────────────
  
  /**
   * Performs login using User ID + Password credentials.
   * @param {string} userId 
   * @param {string} password 
   */
  async loginWithUserIdAndPassword(userId, password) {
    await this.switchToPasswordMode();
    await this.userIdInput.clear();
    await this.userIdInput.fill(userId);
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
    // Wait for button to become enabled (app disables it until both fields have values)
    await this.loginButton.waitFor({ state: 'visible', timeout: 5000 });
    await expect(this.loginButton).toBeEnabled({ timeout: 8000 });
    await this.loginButton.click();
    await this.waitForLoginComplete();
  }

  /**
   * Clicks the Login button only if it is enabled.
   * For negative test cases where only one field is filled — use isLoginButtonDisabled() instead.
   */
  async clickLoginButtonIfEnabled() {
    const isEnabled = await this.loginButton.isEnabled();
    if (isEnabled) {
      await this.loginButton.click();
    }
  }

  /**
   * Returns true if the Login button is currently disabled.
   * Use this in negative tests (empty field validation) instead of trying to click a disabled button.
   * @returns {Promise<boolean>}
   */
  async isLoginButtonDisabled() {
    return !(await this.loginButton.isEnabled());
  }

  /**
   * Performs login using Email and a dynamic OTP.
   * @param {string} email 
   * @param {Function} fetchOtpCallback - callback to fetch the OTP code.
   */
  async loginWithEmailOTP(email, fetchOtpCallback) {
    await this.switchToOtpMode();
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    await this.getOtpButton.click();

    // Wait for the OTP input to display
    await this.otpInput.waitFor({ state: 'visible', timeout: 10000 });

    // Fetch the OTP dynamically from database / mail / API
    const otp = await fetchOtpCallback(email);

    // Some apps use individual input boxes for each OTP digit
    const digit1 = this.page.locator('input[aria-label="OTP digit 1"]');
    if (await digit1.isVisible()) {
      for (let i = 0; i < otp.length; i++) {
        const digitInput = this.page.locator(`input[aria-label="OTP digit ${i + 1}"]`);
        await digitInput.fill(otp[i]);
      }
    } else {
      await this.otpInput.clear();
      await this.otpInput.fill(otp);
    }

    await this.verifyOtpButton.click();
    await this.waitForLoginComplete();
  }

  /**
   * Unified login routing method. Uses LOGIN_TYPE environment variable to decide flow.
   * @param {Object} credentials 
   * @param {string} [credentials.userId] 
   * @param {string} [credentials.password] 
   * @param {string} [credentials.email] 
   * @param {Function} [fetchOtpCallback] 
   */
  async login(credentials, fetchOtpCallback) {
    const loginType = (process.env.LOGIN_TYPE || 'password').toLowerCase();

    if (loginType === 'otp') {
      if (!credentials.email) {
        throw new Error('Email is required for OTP login flow');
      }
      if (!fetchOtpCallback) {
        throw new Error('fetchOtpCallback is required to fetch OTP dynamically');
      }
      await this.loginWithEmailOTP(credentials.email, fetchOtpCallback);
    } else {
      if (!credentials.userId || !credentials.password) {
        throw new Error('User ID and Password are required for password login flow');
      }
      await this.loginWithUserIdAndPassword(credentials.userId, credentials.password);
    }
  }

  // ── Helper Utilities ──────────────────────────────────────────────────
  async waitForLoginComplete() {
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 });
    } catch (e) {
      // Spinner may not show up for instant logins
    }
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  async togglePasswordVisibility() {
    await this.showPasswordToggle.click();
  }

  async getErrorMessage() {
    if (await this.errorMessage.isVisible()) {
      return (await this.errorMessage.textContent()) || '';
    }
    return '';
  }

  // ── Assertions ────────────────────────────────────────────────────────
  async expectLoginPageVisible() {
    await expect(this.page).toHaveURL(/.*login/);
    await expect(this.userIdInput.or(this.emailInput)).toBeVisible();
  }

  async expectOtpFieldVisible() {
    await expect(this.otpInput).toBeVisible({ timeout: 10000 });
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/.*\/app\/dashboard/, { timeout: 20000 });
  }

  async expectErrorMessageVisible() {
    await expect(this.errorMessage).toBeVisible({ timeout: 10000 });
  }
}

module.exports = { LoginPage };
