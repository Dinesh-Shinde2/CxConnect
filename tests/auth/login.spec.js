const { test } = require('../../src/fixtures/baseFixture');
const { OtpHelper } = require('../../src/utils/otpHelper');

test.describe('CX-Connect Authentication Suite', () => {
  
  test.beforeEach(async ({ loginPage }) => {
    // Navigate to the login page prior to each test run
    await loginPage.goto();
    await loginPage.expectLoginPageVisible();
  });

  test('TC_AUTH_001 | Verify successful user authentication and dashboard redirection', async ({ loginPage, dashboardPage }) => {
    const loginType = (process.env.LOGIN_TYPE || 'password').toLowerCase();
    
    // Dynamically retrieve credentials from environment variables loaded by Dotenv
    const credentials = {
      userId: process.env.USER_ID,
      password: process.env.USER_PASSWORD,
      email: process.env.ADMIN_EMAIL
    };

    console.log(`[Test Suite] Initiating test run. Method: ${loginType.toUpperCase()}`);

    // Perform login - The Page Object internally handles routing between
    // username/password or OTP authentication.
    await loginPage.login(credentials, OtpHelper.getDynamicOTP);

    // Verify dashboard loaded successfully
    await dashboardPage.expectDashboardLoaded();
    console.log(`[Test Suite] Authentication successful and dashboard loaded.`);
  });
});
