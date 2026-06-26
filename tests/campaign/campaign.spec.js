/**
 * Campaign Manager Test Suite
 * Login Method: User ID + Password (Login happens ONCE via beforeAll)
 * All tests in this file share the same logged-in browser session.
 *
 * Run commands:
 *   npm run test:campaign                  → All campaign tests (Chromium)
 *   npm run test:campaign:headed           → With visible browser
 *   npm run test:campaign:ui               → Playwright UI mode
 *
 * Credentials loaded from .env.uat:
 *   USER_ID=<your_user_id>
 *   USER_PASSWORD=<your_password>
 */

const { test, expect } = require('../../src/fixtures/baseFixture');
const { LoginPage } = require('../../src/pages/LoginPage');
const { DashboardPage } = require('../../src/pages/DashboardPage');
const { CampaignPage } = require('../../src/pages/CampaignPage');
const { resolveCredentials } = require('../../src/utils/credentialsHelper');

// ── IMPORTANT: Serial mode ensures tests run one-by-one and share the browser context ──
// retries = 0 intentionally — serial+retries causes beforeAll to restart, expiring the session
test.describe.configure({ mode: 'serial', retries: 0 });

test.describe('Campaign Manager Suite | CX-Connect', () => {
  
  // Shared page object — logged in ONCE and reused across all tests below
  let sharedPage;
  let campaignPage;
  let activeRole = 'admin';

  // ── Login ONCE before all campaign tests ─────────────────────────────
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();

    // Retrieve credentials dynamically based on active USER_ROLE
    const credentials = resolveCredentials();
    activeRole = credentials.role;
    const { userId, password } = credentials;

    if (!userId || !password) {
      throw new Error(`[Campaign Suite] Credentials for role "${activeRole}" must be set in your .env.uat file`);
    }

    console.log(`[Campaign Suite] Logging in once as: ${userId} (${activeRole})`);

    const loginPage = new LoginPage(sharedPage);
    await loginPage.goto();
    await loginPage.loginWithUserIdAndPassword(userId, password);

    // Verify we reached the dashboard (login was successful)
    const dashboardPage = new DashboardPage(sharedPage);
    await dashboardPage.expectDashboardLoaded();
    console.log(`[Campaign Suite] ✅ Login successful for role "${activeRole}". Session will be reused for all campaign tests.`);

    // Initialise the CampaignPage POM with the shared (logged-in) page
    campaignPage = new CampaignPage(sharedPage);
  });

  // ── Close the shared session after all tests are done ────────────────
  test.afterAll(async () => {
    if (sharedPage) {
      try {
        const dashboardPage = new DashboardPage(sharedPage);
        await dashboardPage.logout();
        console.log('[Campaign Suite] ✅ Logged out successfully');
      } catch (e) {
        console.log('[Campaign Suite] ⚠️ Failed to log out during afterAll cleanup:', e.message);
      }
      await sharedPage.context().close();
    }
  });

  // ─────────────────────────────────────────────────────────────
  // TC_CAMP_001 | Navigate to Campaign Manager and verify page loads
  // ─────────────────────────────────────────────────────────────
  test('TC_CAMP_001 | Campaign Manager page loads after login', async () => {
    console.log('[TC_CAMP_001] Navigating to Campaign Manager...');
    // goto() navigates to /campaign%20manager/voice/outbound and closes any open modals
    await campaignPage.goto();

    if (activeRole === 'agent') {
      console.log('[TC_CAMP_001] Checking permission: Agent should be redirected to access-denied');
      await expect(sharedPage).toHaveURL(/.*\/app\/access-denied/, { timeout: 15000 });
      console.log('[TC_CAMP_001] ✅ Verified: Agent redirected to access-denied successfully.');
      return;
    }

    await campaignPage.expectCampaignPageLoaded();
    console.log('[TC_CAMP_001] ✅ Campaign Manager page loaded successfully');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_CAMP_002 | Outbound sub-tab is visible and active
  // ─────────────────────────────────────────────────────────────
  test('TC_CAMP_002 | Outbound tab is visible on Campaign Manager page', async () => {
    if (activeRole === 'agent') {
      console.log('[TC_CAMP_002] Skipped for Agent (page is restricted).');
      return;
    }
    await campaignPage.expectOutboundTabActive();
    console.log('[TC_CAMP_002] ✅ Outbound tab is visible');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_CAMP_003 | Open "Add new Outbound Campaign" modal
  // ─────────────────────────────────────────────────────────────
  test('TC_CAMP_003 | "Add new Outbound Campaign" modal opens correctly', async () => {
    if (activeRole === 'agent') {
      console.log('[TC_CAMP_003] Checking permission: Agent should NOT see "+ New Campaign" button');
      await expect(campaignPage.addCampaignButton).toBeHidden();
      console.log('[TC_CAMP_003] ✅ Verified: "+ New Campaign" button is hidden for Agent.');
      return;
    }

    // Ensure modal is closed before opening
    const isOpen = await campaignPage.modalTitle.isVisible().catch(() => false);
    if (!isOpen) {
      await campaignPage.openAddCampaignModal();
    }
    await campaignPage.expectModalVisible();
    console.log('[TC_CAMP_003] ✅ Add Campaign modal opened successfully');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_CAMP_004 | Verify all required form fields are visible in the modal
  // ─────────────────────────────────────────────────────────────
  test('TC_CAMP_004 | All required form fields are visible in Add Campaign modal', async () => {
    if (activeRole === 'agent') {
      console.log('[TC_CAMP_004] Skipped for Agent (creation modal is restricted).');
      return;
    }
    // Modal should still be open from TC_CAMP_003 (serial mode)
    await campaignPage.expectAllFormFieldsVisible();
    console.log('[TC_CAMP_004] ✅ All required form fields are visible');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_CAMP_005 | Campaign name input accepts text
  // ─────────────────────────────────────────────────────────────
  test('TC_CAMP_005 | Campaign name input accepts text', async () => {
    if (activeRole === 'agent') {
      console.log('[TC_CAMP_005] Skipped for Agent (creation modal is restricted).');
      return;
    }
    // Note: this input strips special chars like underscores — use alphanumeric only
    const testCampaignName = 'AutoTestCampaign001';
    await campaignPage.enterCampaignName(testCampaignName);

    // Assert the value was entered correctly
    await expect(campaignPage.campaignNameInput).toHaveValue(testCampaignName);
    console.log(`[TC_CAMP_005] ✅ Campaign name "${testCampaignName}" entered successfully`);
  });

  // ─────────────────────────────────────────────────────────────
  // TC_CAMP_006 | Add button is visible (form interaction available)
  // ─────────────────────────────────────────────────────────────
  test('TC_CAMP_006 | "Add" and "Cancel" buttons are visible in the modal', async () => {
    if (activeRole === 'agent') {
      console.log('[TC_CAMP_006] Skipped for Agent (creation modal is restricted).');
      return;
    }
    await expect(campaignPage.addButton).toBeVisible();
    await expect(campaignPage.cancelButton).toBeVisible();
    console.log('[TC_CAMP_006] ✅ Add and Cancel buttons are visible');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_CAMP_007 | Cancel button closes the modal without saving
  // ─────────────────────────────────────────────────────────────
  test('TC_CAMP_007 | Clicking Cancel closes the modal without creating a campaign', async () => {
    if (activeRole === 'agent') {
      console.log('[TC_CAMP_007] Skipped for Agent (creation modal is restricted).');
      return;
    }
    await campaignPage.cancelCampaignCreation();
    await campaignPage.expectModalClosed();
    console.log('[TC_CAMP_007] ✅ Cancel button closes the modal correctly');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_CAMP_008 | Modal re-opens after Cancel (form is clean)
  // ─────────────────────────────────────────────────────────────
  test('TC_CAMP_008 | Modal re-opens with a clean empty form after Cancel', async () => {
    if (activeRole === 'agent') {
      console.log('[TC_CAMP_008] Skipped for Agent (creation modal is restricted).');
      return;
    }
    // Open modal again
    await campaignPage.openAddCampaignModal();
    await campaignPage.expectModalVisible();

    // Campaign name field should be empty (form was reset)
    await expect(campaignPage.campaignNameInput).toHaveValue('');
    console.log('[TC_CAMP_008] ✅ Modal re-opened with empty form after Cancel');

    // Close it for cleanup
    await campaignPage.cancelCampaignCreation();
  });

});
