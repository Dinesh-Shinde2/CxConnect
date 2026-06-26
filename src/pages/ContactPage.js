const { expect } = require('@playwright/test');

/**
 * ContactPage Class - Page Object Model
 * Represents the CRM -> Contacts page and the "Add new Contact" slide-out form drawer.
 *
 * URL: /app/master/contact
 */
class ContactPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Table / List Page ────────────────────────────────────────────────
    this.pageHeading = page.locator('h1, h2, [class*="heading"], [class*="title"]').filter({ hasText: /^Contact$/i }).first();
    // The search textbox (fills search term)
    this.searchInput = page.locator('input[placeholder*="Search" i]').first();
    // The magnifying-glass "Search button" that submits the search (separate from the textbox)
    this.searchButton = page.locator('button[aria-label="Search button"], button:has-text("Search button")').first();
    this.contactTableRows = page.locator('table tbody tr');

    // Trigger to open the Add Contact drawer
    // Locates buttons matching: "New Contact", "Add Contact", "Add new Contact", etc.
    this.addContactButton = page.locator('button:has-text("New Contact"), button:has-text("Add Contact"), button:has-text("Add new Contact"), button:has-text("Create Contact")').first();

    // ── Add new Contact Drawer / Slide-over ──────────────────────────────
    this.drawerTitle = page.getByText('Add new Contact', { exact: true });

    // 1) Title dropdown (Mr, Mrs, Ms, etc.)
    this.titleDropdown = page.locator('div:has(> label:has-text("Title")) button, div:has(> label:has-text("Title")) div.flex.cursor-pointer, [placeholder="Select Title"]').first();

    // 2) First name
    this.firstNameInput = page.locator('input[placeholder="First Name"], input[name="firstName"]');

    // 3) Middle name
    this.middleNameInput = page.locator('input[placeholder="Middle Name"], input[name="middleName"]');

    // 4) Last name
    this.lastNameInput = page.locator('input[placeholder="Last Name"], input[name="lastName"]');

    // 5) Email
    this.emailInput = page.locator('input[placeholder="Email"], input[type="email"]');

    // 6) Phone Information
    // Input for phone digits (located as the text field inside Phone Information group)
    this.phoneInput = page.locator('input.PhoneInputInput, input[type="tel"]').first();

    // Checkboxes (Primary, WhatsApp, Add Social Accounts)
    this.primaryCheckboxLabel = page.locator('label:has-text("Primary Number"), span:has-text("Primary Number")').first();
    this.whatsappCheckboxLabel = page.locator('label:has-text("WhatsApp Number"), span:has-text("WhatsApp Number")').first();
    
    this.primaryCheckbox = page.locator('input[type="checkbox"]').nth(0);
    this.whatsappCheckbox = page.locator('input[type="checkbox"]').nth(1);

    this.addPhoneIconBtn = page.locator('button[class*="!w-11"][class*="!h-11"]').first();

    // 7) Add Social Accounts
    this.socialAccountsCheckboxLabel = page.locator('label:has-text("Add Social Accounts"), span:has-text("Add Social Accounts")').first();
    this.socialAccountsCheckbox = page.locator('input[type="checkbox"]').nth(2);

    // 8) Address Information
    this.addressLine1Input = page.locator('input[placeholder="Enter address line 1"], input[placeholder*="address line 1" i]');
    this.addressLine2Input = page.locator('input[placeholder="Enter address line 2"], input[placeholder*="address line 2" i]');
    this.cityInput         = page.locator('input[placeholder="Enter city"], input[placeholder*="city" i]');
    this.stateInput        = page.locator('input[placeholder="Enter state"], input[placeholder*="state" i], input[placeholder*="province" i]');
    this.postalCodeInput   = page.locator('input[placeholder="Enter postal code"], input[placeholder*="postal" i], input[placeholder*="zip" i]');
    this.countryInput      = page.locator('input#country, input[name="country"], input[placeholder="Enter country"]');

    this.dobInput = page.locator('input[type="date"], input[placeholder="DD-MM-YYYY"], input[placeholder*="date of birth" i]').first();

    // 10) Other Details - Contact List dropdown
    this.contactListDropdown = page.locator('div:has(> label:has-text("Contact List")) button, div:has(> label:has-text("Contact List")) div.flex.cursor-pointer').first();

    // ── Drawer Footer Buttons ───────────────────────────────────────────
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
    this.addButton    = page.getByRole('button', { name: 'Add', exact: true });
  }

  // ── Action Methods ─────────────────────────────────────────────────────

  /**
   * Navigate directly to the Contacts management page.
   */
  async goto() {
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login') || currentUrl === 'about:blank') {
      await this.page.waitForURL(/\/app\//, { timeout: 15000 });
      await this.page.waitForTimeout(1500);
    }

    await this.page.goto('/app/master/contact');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1500);

    const landedUrl = this.page.url();
    if (landedUrl.includes('/login')) {
      throw new Error('[ContactPage.goto] Session expired — redirected to login.');
    }

    if (landedUrl.includes('access-denied')) {
      console.log('[ContactPage.goto] Redirected to access-denied. Returning early.');
      return;
    }

    // SPA Guard check
    if (!landedUrl.includes('contact')) {
      const link = this.page.locator('a[href="/app/master/contact"]');
      if (await link.count() > 0) {
        await link.first().click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Click "+ New Contact" button to open the form drawer.
   */
  async openAddContactDrawer() {
    await this.addContactButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.addContactButton.click();
    await this.drawerTitle.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);
  }

  /**
   * Assert the contact page has loaded successfully.
   */
  async expectContactPageLoaded() {
    await expect(this.page).toHaveURL(/.*\/app\/master\/contact/, { timeout: 20000 });
  }

  /**
   * Select an option from a custom React dropdown.
   * Works for Title and Contact List selectors.
   *
   * @param {import('@playwright/test').Locator} dropdownLocator
   * @param {string} optionText
   */
  async selectDropdownOption(dropdownLocator, optionText) {
    await dropdownLocator.scrollIntoViewIfNeeded();

    // ── Guard: check if the desired value is already selected ──────────────
    // The dropdown trigger button usually shows the current selected value as
    // its inner text. If it already matches, clicking it would *deselect* the
    // option (toggle behavior). In that case we skip the interaction entirely.
    const currentText = await dropdownLocator.innerText().catch(() => '');
    if (currentText.trim().toLowerCase() === optionText.trim().toLowerCase()) {
      console.log(`[selectDropdownOption] "${optionText}" is already selected — skipping click.`);
      return;
    }

    // Open the dropdown
    await dropdownLocator.click();
    await this.page.waitForTimeout(800);

    // Locate the dropdown panel option
    // It usually renders as 'ul li' or 'div' items inside absolute container
    const option = this.page.locator('ul li, div.absolute.z-30 ul li, div[class*="select"] li')
      .filter({ hasText: new RegExp(`^${optionText.replace(/[+()]/g, '\\$&')}$`, 'i') })
      .first();

    const isVisible = await option.isVisible().catch(() => false);
    if (isVisible) {
      await option.click({ force: true });
    } else {
      // Fallback: broader match
      const fallbackOption = this.page.locator('ul li, div.absolute.z-30 ul li, li, div')
        .filter({ hasText: optionText })
        .first();
      await fallbackOption.click({ force: true });
    }
    await this.page.waitForTimeout(500);
  }

  /**
   * Closes the drawer without saving.
   */
  async cancelContactCreation() {
    await this.cancelButton.click();
    await this.drawerTitle.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Clicks the save/Add button.
   */
  async saveContact() {
    await this.addButton.click();
    await this.drawerTitle.waitFor({ state: 'hidden', timeout: 15000 });
    await this.page.waitForTimeout(1500);
  }

  /**
   * Verify that a contact exists in the table by searching via firstName.
   * - Fills the search textbox and clicks the Search button (Enter alone doesn't trigger it).
   * - Uses a case-insensitive regex filter because the table may capitalise differently
   *   (e.g. 'AutoFirst' filled in → 'Autofirst' displayed).
   *
   * @param {string} firstName - Unique first name to search for (has random suffix)
   * @param {string} [displayHint] - Optional full name label for console logging
   */
  async expectContactInList(firstName, displayHint) {
    console.log(`[expectContactInList] Searching table for: "${firstName}"`);

    // Fill search box
    await this.searchInput.fill(firstName);

    // Try clicking the dedicated Search button first; fall back to Enter key
    const searchBtnVisible = await this.searchButton.isVisible().catch(() => false);
    if (searchBtnVisible) {
      await this.searchButton.click();
    } else {
      await this.page.keyboard.press('Enter');
    }

    // Wait for the search API to return and the table to re-render
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(2000);

    // Case-insensitive match — table may render 'Autofirst' even though we typed 'AutoFirst'
    const nameRegex = new RegExp(firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matchingRow = this.page.locator('table tbody tr').filter({ hasText: nameRegex }).first();
    await expect(matchingRow).toBeVisible({ timeout: 12000 });
    console.log(`[expectContactInList] ✅ Found contact "${displayHint || firstName}" in table.`);
  }
}

module.exports = { ContactPage };
