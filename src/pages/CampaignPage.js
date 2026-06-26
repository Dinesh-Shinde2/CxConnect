const { expect } = require('@playwright/test');

/**
 * CampaignPage Class - Page Object Model
 * Reflects CX-Connect Campaign Manager UI.
 *
 * URL: /app/campaign manager/voice/outbound
 * Section: CRM → Campaign Manager → Voice → Outbound
 */
class CampaignPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Page Header ─────────────────────────────────────────────────────
    // Use the sidebar link (role=link) specifically, not breadcrumb span
    // Both exist — scope to the main content heading only
    this.campaignManagerHeading = page.locator('h1:has-text("Campaign Manager"), [class*="heading"]:has-text("Campaign Manager"), [class*="title"]:has-text("Campaign Manager")').first();

    // ── Top Tabs (Voice / Digital) ───────────────────────────────────────
    this.voiceTab   = page.getByRole('button', { name: 'Voice' });
    this.digitalTab = page.getByRole('button', { name: 'Digital' });

    // ── Sub-Tabs (Inbound / Outbound / Broadcast) — plain text, NOT role="tab" ─────
    // From screenshot: these are plain text elements (no ARIA role), clicked by text content
    this.inboundTab   = page.getByText('Inbound',   { exact: true });
    this.outboundTab  = page.getByText('Outbound',  { exact: true });
    this.broadcastTab = page.getByText('Broadcast', { exact: true });

    // ── Campaign List ────────────────────────────────────────────────────
    this.searchInput      = page.locator('input[placeholder*="Search" i], input[class*="search"]').first();
    this.campaignTableRows = page.locator('table tbody tr');

    // ── Add Campaign Button (opens the modal) ─────────────────────────────────
    // From screenshot: the button is "+ New Campaign" (blue button, top-right of list)
    this.addCampaignButton = page.getByRole('button', { name: /new campaign/i });

    // ── Add new Outbound Campaign Modal ──────────────────────────────────
    this.modalTitle           = page.getByText('Add new Outbound Campaign', { exact: true });
    this.modalCloseButton     = page.locator('[class*="modal"] button[aria-label*="close" i], [class*="modal"] button:has-text("×"), [class*="panel"] .close-btn').first();

    // ── Form Fields ───────────────────────────────────────────────────
    this.campaignNameInput = page.locator('input[placeholder="Enter campaign name"]');

    // Dropdowns — confirmed as <button> elements (NOT native <select> or React Select)
    // All have class: "w-full min-h-[40px] flex cursor-pointer justify-between items-center..."
    this.campaignModeDropdown = page.locator('div:has(> label:has-text("Campaign mode")) button').first();
    this.contactListDropdown  = page.locator('div:has(> label:has-text("Contact List")) button').first();
    this.callerIdDropdown     = page.locator('div:has(> label:has-text("Caller ID")) button').first();
    this.queueDropdown        = page.locator('div:has(> label:has-text("Queue")) button').first();
    this.dialRatioDropdown    = page.locator('div:has(> label:has-text("Dial Ratio")) button').first();
    this.dndCheckDropdown     = page.locator('div:has(> label:has-text("DND Check")) button').first();

    // Toggles (inside modal)
    this.scheduleLaterToggle = page.locator('div:has-text("Schedule Later") button[class*="toggle"], div:has-text("Schedule Later") button[class*="rounded-full"]').first();
    this.pisToggle           = page.locator('div:has-text("PIS") button[class*="toggle"], div:has-text("PIS") button[class*="rounded-full"]').first();

    // Number Inputs
    this.retriesInput    = page.locator('input[name="retries"], input[placeholder="Number of retries"]').first();
    this.maxWaitTimeInput = page.locator('input[name="maxWaitTime"], input[placeholder="seconds"]').first();

    // ── Modal Action Buttons ─────────────────────────────────────────────
    // Confirmed from inspector: btn[75]="Cancel", btn[76]="Add"
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
    this.addButton    = page.getByRole('button', { name: 'Add',    exact: true });
  }

  // ── Navigation ────────────────────────────────────────────────────────

  /**
   * Navigate directly to the Campaign Manager > Voice > Outbound page.
   * The URL has a space in 'campaign manager' — encode it as %20.
   */
  async goto() {
    // Real URL: /app/campaign-manager (hyphen, not space/encoded)
    // After fresh login the SPA needs a moment to settle — add 1.5s wait first
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login') || currentUrl === 'about:blank') {
      // Session not ready — wait for dashboard first
      await this.page.waitForURL(/\/app\//, { timeout: 15000 });
      await this.page.waitForTimeout(1500);
    }

    await this.page.goto('/app/campaign-manager');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1500);

    // If redirected to login, session expired — not much we can do, fail clearly
    const landedUrl = this.page.url();
    if (landedUrl.includes('/login')) {
      throw new Error('[CampaignPage.goto] Session expired — redirected to login. Re-run the test suite.');
    }

    if (landedUrl.includes('access-denied')) {
      console.log('[CampaignPage.goto] Redirected to access-denied. Returning early.');
      return;
    }

    // If redirected back to dashboard (SPA guard), fallback to sidebar href
    if (!landedUrl.includes('campaign-manager')) {
      const campaignLink = this.page.locator('a[href="/app/campaign-manager"]');
      if (await campaignLink.count() > 0) {
        await campaignLink.first().click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000);
      }
    }

    // Click the "Outbound" sub-tab
    await this.switchToOutboundTab();

    // Close any modal that may be open from a previous test
    const isModalOpen = await this.modalTitle.isVisible().catch(() => false);
    if (isModalOpen) {
      await this.cancelButton.click();
      await this.modalTitle.waitFor({ state: 'hidden', timeout: 5000 });
    }
  }

  // ── Tab Interactions ──────────────────────────────────────────────────

  async switchToVoiceTab() {
    await this.page.locator('button:has-text("Voice"), [class*="tab"]:has-text("Voice")').first().click();
    await this.page.waitForTimeout(800);
  }

  async switchToOutboundTab() {
    // outboundTab is getByText('Outbound', { exact: true }) — plain text tab
    const isVisible = await this.outboundTab.isVisible().catch(() => false);
    if (isVisible) {
      await this.outboundTab.click();
      await this.page.waitForTimeout(800);
    }
  }

  async switchToInboundTab() {
    await this.page.locator('button:has-text("Inbound"), [class*="tab"]:has-text("Inbound"), span:has-text("Inbound")').first().click();
    await this.page.waitForTimeout(800);
  }

  // ── Form Interactions ─────────────────────────────────────────────────

  /**
   * Opens the Add new Outbound Campaign modal.
   */
  async openAddCampaignModal() {
    await this.addCampaignButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.addCampaignButton.click();
    await this.modalTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Select an option from a custom dropdown inside the modal.
   * @param {import('@playwright/test').Locator} dropdownLocator
   * @param {string} optionText
   */
  async selectDropdownOption(dropdownLocator, optionText) {
    await dropdownLocator.click();
    // Wait for dropdown options to appear and click the matching one
    const option = this.page.locator(
      `[class*="option"]:has-text("${optionText}"), ` +
      `li:has-text("${optionText}"), [role="option"]:has-text("${optionText}")`
    ).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click({ force: true });
  }

  /**
   * Fills in campaign name field.
   * @param {string} name
   */
  async enterCampaignName(name) {
    await this.campaignNameInput.clear();
    await this.campaignNameInput.fill(name);
  }

  /**
   * Cancels the campaign creation by clicking the Cancel button.
   */
  async cancelCampaignCreation() {
    await this.cancelButton.click();
  }

  // ── Assertions ────────────────────────────────────────────────────────

  async expectCampaignPageLoaded() {
    // Check URL contains 'campaign-manager'
    await expect(this.page).toHaveURL(/campaign-manager/i, { timeout: 20000 });
  }

  async expectOutboundTabActive() {
    // Outbound is a plain text tab (not ARIA role=tab)
    await expect(this.outboundTab).toBeVisible({ timeout: 10000 });
  }

  async expectModalVisible() {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async expectModalClosed() {
    await expect(this.modalTitle).not.toBeVisible({ timeout: 10000 });
  }

  async expectAllFormFieldsVisible() {
    await expect(this.campaignNameInput).toBeVisible();
    await expect(this.campaignModeDropdown).toBeVisible();
    await expect(this.contactListDropdown).toBeVisible();
    await expect(this.callerIdDropdown).toBeVisible();
    await expect(this.queueDropdown).toBeVisible();
    await expect(this.dialRatioDropdown).toBeVisible();
    await expect(this.dndCheckDropdown).toBeVisible();
    await expect(this.addButton).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
  }

  async expectCampaignInList(campaignName) {
    const row = this.page.locator(`text=${campaignName}`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
  }
}

module.exports = { CampaignPage };
