const { expect } = require('@playwright/test');

/**
 * InboundCampaignPage Class - Page Object Model
 * Reflects CX-Connect Campaign Manager UI — Inbound section.
 *
 * URL: /app/campaign-manager → Voice tab → Inbound sub-tab
 *
 * Actual form fields observed from live DOM (screenshots confirmed):
 *   0. Campaign Name         — text input (placeholder: "Enter campaign name")
 *   1. Select DID            — custom dropdown (placeholder: "Select a DID")
 *   2. Business Hours        — custom dropdown (placeholder: "Select your Business hour")
 *   3. Out of business - Audio File — custom dropdown (placeholder: "Select your Audio File")
 *   4. Route to              — radio buttons: "Queue" | "IVR" (IVR is default)
 *   5. Select Queue          — dropdown, visible ONLY when Route to = Queue
 *      OR Select IVR         — dropdown, visible ONLY when Route to = IVR (default)
 *   6. Select Script         — custom dropdown (placeholder: "Select a Script")
 *   7. PIS                   — toggle (ON/OFF), NOT a button
 *   8. SOP Compliance        — optional checkbox
 *   9. Save / Cancel         — modal footer buttons
 *
 * Dropdown options render as plain <div> rows (no ARIA role="option").
 * Use locator('p, div').filter({ hasText: /phone|queue|ivr|script/i }) or
 * look for siblings inside the open panel.
 * NOTE: PIS Script button is not present in this modal — PIS is a toggle.
 */
class InboundCampaignPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Sub-Tabs ─────────────────────────────────────────────────────────
    // Plain text tabs (not ARIA role="tab") — matched by visible text
    this.inboundTab  = page.getByText('Inbound',  { exact: true });
    this.outboundTab = page.getByText('Outbound', { exact: true });

    // ── Add Campaign Button ───────────────────────────────────────────────
    this.addCampaignButton = page.getByRole('button', { name: /new campaign/i });

    // ── Modal Title ───────────────────────────────────────────────────────
    // Confirmed text from screenshot: "Add new Inbound Campaign"
    this.modalTitle = page.getByText('Add new Inbound Campaign', { exact: true });

    // ── Campaign Name input ───────────────────────────────────────────────
    // Confirmed in 2nd screenshot: visible at the top of the modal
    this.campaignNameInput = page.locator('input[placeholder="Enter campaign name"]');

    // ── Field 1: Select a DID ─────────────────────────────────────────────
    // Placeholder text confirmed: "Select a DID"
    // These are custom React dropdowns rendered as <div> with a chevron icon (not native <select>)
    this.didDropdown = page.locator('[placeholder="Select a DID"]').first();
    // Fallback: find by placeholder text inside the dropdown trigger
    this.didDropdownBtn = page.locator('div').filter({ hasText: /^Select a DID/ }).first();

    // ── Field 2: Business Hours ───────────────────────────────────────────
    // Label: "Business Hours *", placeholder: "Select your Business hour"
    this.businessHourDropdown = page.locator('[placeholder="Select your Business hour"]').first();
    this.businessHourDropdownBtn = page.locator('div').filter({ hasText: /^Select your Business hour/ }).first();

    // ── Field 3: Out of business - Audio File ────────────────────────────
    // Label: "Out of business - Audio File *", placeholder: "Select your Audio File"
    this.outOfBusinessDropdown = page.locator('[placeholder="Select your Audio File"]').first();
    this.outOfBusinessDropdownBtn = page.locator('div').filter({ hasText: /^Select your Audio File/ }).first();

    // ── Field 4: Route To — Radio Buttons ────────────────────────────────
    // "Route to *" with two options: Queue | IVR
    // IVR is selected by default. Queue reveals "Select Queue" dropdown.
    this.routeToQueueRadio = page.locator('label').filter({ hasText: /^Queue$/ }).locator('input[type="radio"]');
    this.routeToIVRRadio   = page.locator('label').filter({ hasText: /^IVR$/ }).locator('input[type="radio"]');

    // Fallback locators (clickable labels, not the hidden radio input)
    this.routeToQueueLabel = page.locator('label').filter({ hasText: /^Queue$/ });
    this.routeToIVRLabel   = page.locator('label').filter({ hasText: /^IVR$/ });

    // ── Field 5a: Select Queue ────────────────────────────────────────────
    // Visible ONLY after Route To = Queue is selected
    this.queueDropdown = page.locator('[placeholder="Select a Queue"]').first();
    this.queueDropdownBtn = page.locator('div').filter({ hasText: /^Select a Queue/ }).first();

    // ── Field 5b: Select IVR (default) ───────────────────────────────────
    // Visible by default (Route To = IVR)
    this.ivrDropdown = page.locator('[placeholder="Select an IVR"]').first();
    this.ivrDropdownBtn = page.locator('div').filter({ hasText: /^Select an IVR/ }).first();

    // ── Field 6: Select Script ────────────────────────────────────────────
    // Label: "Select Script", placeholder: "Select a Script"
    this.scriptDropdown = page.locator('[placeholder="Select a Script"]').first();
    this.scriptDropdownBtn = page.locator('div').filter({ hasText: /^Select a Script/ }).first();

    // ── Field 7: PIS Toggle ───────────────────────────────────────────────
    // PIS is a toggle switch (ON/OFF), NOT a button or script field
    // Confirmed from screenshot: label "PIS" with a toggle to its right
    this.pisToggle = page.locator('label:has-text("PIS") ~ button, div:has(> span:has-text("PIS")) button').first();
    // Fallback: find the toggle by its sibling relationship to the "PIS" text
    this.pisToggleFallback = page.locator('div').filter({ hasText: /^PIS$/ }).locator('button').first();

    // ── Field 8: SOP Compliance (optional) ───────────────────────────────
    this.sopComplianceCheckbox = page.locator('label:has-text("SOP Compliance") input[type="checkbox"]');

    // ── Modal Action Buttons ─────────────────────────────────────────────
    // Confirmed from screenshot: "Cancel" and "Save" buttons in modal footer
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
    this.saveButton   = page.getByRole('button', { name: 'Save',   exact: true });

    // ── Campaign List ────────────────────────────────────────────────────
    this.campaignTableRows = page.locator('table tbody tr');
    this.searchInput       = page.locator('input[placeholder*="Search" i]').first();
  }

  // ── Navigation ────────────────────────────────────────────────────────

  /**
   * Navigate to Campaign Manager and switch to the Inbound sub-tab.
   */
  async goto() {
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login') || currentUrl === 'about:blank') {
      await this.page.waitForURL(/\/app\//, { timeout: 15000 });
      await this.page.waitForTimeout(1500);
    }

    await this.page.goto('/app/campaign-manager');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1500);

    const landedUrl = this.page.url();
    if (landedUrl.includes('/login')) {
      throw new Error('[InboundCampaignPage.goto] Session expired — redirected to login.');
    }

    if (!landedUrl.includes('campaign-manager')) {
      const campaignLink = this.page.locator('a[href="/app/campaign-manager"]');
      if (await campaignLink.count() > 0) {
        await campaignLink.first().click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000);
      }
    }

    // Switch to Inbound sub-tab
    await this.switchToInboundTab();

    // Close any stale modal from a previous test
    const isModalOpen = await this.modalTitle.isVisible().catch(() => false);
    if (isModalOpen) {
      await this.cancelButton.click();
      await this.modalTitle.waitFor({ state: 'hidden', timeout: 5000 });
    }
  }

  // ── Tab Interactions ──────────────────────────────────────────────────

  async switchToInboundTab() {
    const isVisible = await this.inboundTab.isVisible().catch(() => false);
    if (isVisible) {
      await this.inboundTab.click();
      await this.page.waitForTimeout(800);
    } else {
      // Fallback: broader selector
      await this.page
        .locator('button:has-text("Inbound"), [class*="tab"]:has-text("Inbound"), span:has-text("Inbound")')
        .first()
        .click();
      await this.page.waitForTimeout(800);
    }
  }

  // ── Form Interactions ─────────────────────────────────────────────────

  /**
   * Opens the "Add new Inbound Campaign" modal.
   */
  async openAddCampaignModal() {
    await this.addCampaignButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.addCampaignButton.click();
    await this.modalTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Click a custom dropdown trigger by its placeholder text and select an option.
   * Works for the React custom dropdowns (not native <select>).
   * @param {string} placeholderText  - placeholder visible in the closed dropdown
   * @param {string} optionText       - text of the option to select
   */
  async selectFromDropdown(placeholderText, optionText) {
    // Click the dropdown trigger (div containing the placeholder text)
    const trigger = this.page.locator(`[placeholder="${placeholderText}"]`).first();
    const triggerVisible = await trigger.isVisible().catch(() => false);

    if (triggerVisible) {
      await trigger.click();
    } else {
      // Fallback: click the div that displays the placeholder
      await this.page.locator('div').filter({ hasText: new RegExp(`^${placeholderText}$`) }).first().click();
    }

    await this.page.waitForTimeout(400);

    // Select the matching option from the open dropdown list
    const option = this.page.locator(
      `[role="option"]:has-text("${optionText}"), ` +
      `li:has-text("${optionText}"), ` +
      `[class*="option"]:has-text("${optionText}")`
    ).first();

    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click({ force: true });
    await this.page.waitForTimeout(300);
  }

  /**
   * Selects the "Queue" radio button under "Route to".
   * After this, the "Select Queue" dropdown becomes visible.
   */
  async selectRouteToQueue() {
    // Try clicking the label (more reliable for custom radio buttons)
    const labelVisible = await this.routeToQueueLabel.isVisible().catch(() => false);
    if (labelVisible) {
      await this.routeToQueueLabel.click();
    } else {
      await this.routeToQueueRadio.click();
    }
    await this.page.waitForTimeout(500);
  }

  /**
   * Selects the "IVR" radio button under "Route to".
   * After this, the "Select IVR" dropdown becomes visible.
   */
  async selectRouteToIVR() {
    const labelVisible = await this.routeToIVRLabel.isVisible().catch(() => false);
    if (labelVisible) {
      await this.routeToIVRLabel.click();
    } else {
      await this.routeToIVRRadio.click();
    }
    await this.page.waitForTimeout(500);
  }

  /**
   * Cancels the inbound campaign creation.
   */
  async cancelCampaignCreation() {
    await this.cancelButton.click();
  }

  /**
   * Saves the inbound campaign by clicking the Save button.
   */
  async saveCampaign() {
    await this.saveButton.click();
    await this.modalTitle.waitFor({ state: 'hidden', timeout: 15000 });
  }

  // ── Assertions ────────────────────────────────────────────────────────

  async expectCampaignPageLoaded() {
    await expect(this.page).toHaveURL(/campaign-manager/i, { timeout: 20000 });
  }

  async expectInboundTabVisible() {
    await expect(this.inboundTab).toBeVisible({ timeout: 10000 });
  }

  async expectModalVisible() {
    await expect(this.modalTitle).toBeVisible({ timeout: 10000 });
  }

  async expectModalClosed() {
    await expect(this.modalTitle).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Asserts the always-visible fields in the Inbound Campaign modal.
   *
   * Fields visible IMMEDIATELY after modal opens (Route to = IVR by default):
   *   - Campaign Name text input
   *   - Select a DID dropdown
   *   - Business Hours dropdown
   *   - Out of business - Audio File dropdown
   *   - Route to radios (Queue + IVR)
   *   - Select IVR dropdown (visible because IVR is default)
   *   - Select Script dropdown
   *   - Save + Cancel buttons
   *
   * NOTE: "Select Queue" is NOT checked here — it only appears after
   *       clicking the Queue radio. See TC_IBC_011 for that assertion.
   */
  async expectAllFormFieldsVisible() {
    // ── Campaign Name input ──────────────────────────────────────────────
    await expect(this.campaignNameInput).toBeVisible({ timeout: 10000 });

    // ── Dropdown fields ──────────────────────────────────────────────────
    await expect(
      this.page.locator('div').filter({ hasText: /^Select a DID/ }).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      this.page.locator('div').filter({ hasText: /^Select your Business hour/ }).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      this.page.locator('div').filter({ hasText: /^Select your Audio File/ }).first()
    ).toBeVisible({ timeout: 10000 });

    // ── Route To radios ──────────────────────────────────────────────────
    await expect(this.routeToQueueLabel).toBeVisible({ timeout: 5000 });
    await expect(this.routeToIVRLabel).toBeVisible({ timeout: 5000 });

    // ── IVR dropdown (default Route To = IVR) ───────────────────────────
    await expect(
      this.page.locator('div').filter({ hasText: /^Select an IVR/ }).first()
    ).toBeVisible({ timeout: 10000 });

    // ── Script dropdown ──────────────────────────────────────────────────
    await expect(
      this.page.locator('div').filter({ hasText: /^Select a Script/ }).first()
    ).toBeVisible({ timeout: 10000 });

    // ── Modal action buttons ─────────────────────────────────────────────
    await expect(this.saveButton).toBeVisible({ timeout: 5000 });
    await expect(this.cancelButton).toBeVisible({ timeout: 5000 });
  }

  async expectCampaignInList(campaignName) {
    const row = this.page.locator(`text=${campaignName}`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
  }
}

module.exports = { InboundCampaignPage };
