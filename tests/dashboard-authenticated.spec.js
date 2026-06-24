/**
 * Authenticated Dashboard Test Suite
 * Reuses the storage state saved during setup to avoid logging in again before each test.
 *
 * Execution commands:
 *   npm run test:authenticated             → Runs these tests in headless mode
 *   npm run test:authenticated:headed      → Runs in headed mode
 *   npm run test:authenticated:ui          → Runs in Playwright UI mode
 */

const { test, expect } = require('../fixtures/baseFixture');

// Load the shared authentication state (session cookies and local storage)
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Authenticated Dashboard Suite | CX-Connect', () => {

  // Before each test, navigate directly to the Dashboard page.
  // Because we load the storageState, the page will load the logged-in view directly.
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  // ─────────────────────────────────────────────────────────────
  // TC_AUTH_DASH_001 | Bypassing Login Page Direct Navigation
  // ─────────────────────────────────────────────────────────────
  test('TC_AUTH_DASH_001 | Direct navigation to dashboard does not redirect to login page', async ({ page, dashboardPage }) => {
    // Verify that we are on the dashboard URL
    await dashboardPage.expectDashboardLoaded();

    // Verify we are not redirected to the login page
    expect(page.url()).not.toContain('/login');
    console.log('[TC_AUTH_DASH_001] ✅ Verified direct access to dashboard without login redirect');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_AUTH_DASH_002 | Verify Stats Cards
  // ─────────────────────────────────────────────────────────────
  test('TC_AUTH_DASH_002 | Dashboard displays Agents Overview stats cards using shared session', async ({ dashboardPage }) => {
    await dashboardPage.expectDashboardLoaded();
    
    // Assert stats cards (Total agents, logged in, queue, etc.) are visible
    await dashboardPage.expectStatsCardsVisible();
    console.log('[TC_AUTH_DASH_002] ✅ Dashboard stats cards are visible and loaded');
  });

  // ─────────────────────────────────────────────────────────────
  // TC_AUTH_DASH_003 | Verify Action Buttons
  // ─────────────────────────────────────────────────────────────
  test('TC_AUTH_DASH_003 | Dashboard action buttons (Refresh, Add Widget) are visible', async ({ dashboardPage }) => {
    await dashboardPage.expectDashboardLoaded();

    // Assert action buttons (Refresh, Add Widget) are visible
    await dashboardPage.expectActionButtonsVisible();
    console.log('[TC_AUTH_DASH_003] ✅ Refresh and Add Widget buttons are visible');
  });

});
