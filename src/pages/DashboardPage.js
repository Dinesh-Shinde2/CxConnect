const { expect } = require('@playwright/test');

/**
 * DashboardPage Class - Page Object Model
 * Reflects actual CX-Connect Admin Dashboard UI:
 *   - Slim icon-only dark sidebar on the left
 *   - Page heading: "Admin Dashboard"
 *   - Agents Overview stats cards
 * URL: /app/dashboard
 */
class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Sidebar ────────────────────────────────────────────────────────
    // The actual sidebar is a narrow dark icon strip — matching by role or generic nav
    this.sidebar = page.locator('nav, [class*="nav"], [class*="sidebar"], [class*="side-bar"]').first();

    // ── Page Heading ───────────────────────────────────────────────────
    // Actual heading on dashboard is "Admin Dashboard"
    this.pageHeading = page.locator('h1, h2, [class*="heading"], [class*="title"]').filter({ hasText: /dashboard/i }).first();

    // ── User Profile & Logout ──────────────────────────────────────────
    this.userAvatar = page.locator('[class*="avatar"], [class*="user"], header button').last();
    this.logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), li:has-text("Logout")');

    // ── Agents Overview Stats Cards ────────────────────────────────────
    this.agentsOverviewHeading = page.getByText('Agents Overview', { exact: true });
    this.totalAgentCard        = page.getByText('Total agent', { exact: true });
    this.agentLoggedInCard     = page.getByText('Agent logged In', { exact: true });
    this.agentOnCallCard       = page.getByText('Agent on call', { exact: true });
    this.callInQueueCard       = page.getByText('Call in Queue', { exact: true });
    this.abandonedCallsCard    = page.getByText('Abandoned Calls', { exact: true });
    this.scheduledCallbacks    = page.getByText('Scheduled Callbacks', { exact: true });

    // ── Action Buttons ─────────────────────────────────────────────────
    this.refreshButton         = page.getByRole('button', { name: /refresh/i });
    this.addWidgetButton       = page.getByRole('button', { name: /add widget/i });

    // ── Charts ─────────────────────────────────────────────────────────
    this.agentsLoggedByQueueChart = page.getByText('Agents Logged In by Queue');
    this.callsInQueueChart        = page.getByText('Calls in Queue');
    this.liveDataLabel            = page.getByText(/live data/i);
  }

  // ── Navigation ────────────────────────────────────────────────────────
  async goto() {
    await this.page.goto('/app/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Logout Flow ───────────────────────────────────────────────────────
  async logout() {
    if (this.page.url().includes('access-denied')) {
      console.log('[DashboardPage.logout] On access-denied page, navigating to dashboard first.');
      await this.page.goto('/app/dashboard');
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(1000);
    }
    await this.userAvatar.click({ force: true });
    await this.logoutButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.logoutButton.click({ force: true });
    await this.page.waitForURL(/.*login/, { timeout: 20000 });
  }

  // ── Assertions ────────────────────────────────────────────────────────

  /**
   * Core assertion: confirms we are on the dashboard page.
   * Only asserts URL — most reliable signal of a successful login across all browsers.
   * Use expectStatsCardsVisible() or expectActionButtonsVisible() for deeper validation.
   */
  async expectDashboardLoaded() {
    await expect(this.page).toHaveURL(/.*\/app\/dashboard/, { timeout: 25000 });
  }

  /**
   * Extended assertion: checks Agents Overview stats cards are rendered.
   */
  async expectStatsCardsVisible() {
    await expect(this.agentsOverviewHeading).toBeVisible({ timeout: 15000 });
    await expect(this.totalAgentCard).toBeVisible();
    await expect(this.agentLoggedInCard).toBeVisible();
    await expect(this.callInQueueCard).toBeVisible();
  }

  /**
   * Checks dashboard action buttons are visible.
   */
  async expectActionButtonsVisible() {
    await expect(this.refreshButton).toBeVisible();
    await expect(this.addWidgetButton).toBeVisible();
  }
}

module.exports = { DashboardPage };
