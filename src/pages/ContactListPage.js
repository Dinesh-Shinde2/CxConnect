/**
 * ContactListPage.js — Page Object Model for Contact List (CRM → Contact List)
 *
 * URL: /app/master/contact-list
 *
 * Key UI elements confirmed from screenshots:
 *  - "+ New List" button (top-right, blue)
 *  - "Add New Contact List" modal
 *    - Contact List Name input  (placeholder: "Enter a Name")
 *    - Description textarea     (placeholder: "Enter description")
 *    - Radio: "Select Contact Manually" (default)
 *    - "Add Leads" section: search combobox → results table with "Add" buttons
 *    - Footer: Cancel | Add
 */

const { expect } = require('@playwright/test');

class ContactListPage {
  constructor(page) {
    this.page = page;

    // ── List Page ─────────────────────────────────────────────────────────
    this.newListButton = page.getByRole('button', { name: /new list/i });
    this.pageHeading   = page.getByText('Contact List', { exact: true });

    // ── "Add New Contact List" Modal ──────────────────────────────────────
    this.modalTitle = page.getByText('Add New Contact List', { exact: true });

    // Form fields inside modal
    this.contactListNameInput = page.locator('input[placeholder="Enter a Name"]');
    this.descriptionInput     = page.locator('textarea[placeholder="Enter description"]');

    // "Add Leads" search combobox (placeholder confirmed from screenshots)
    this.searchLeadsInput = page.locator('input[placeholder*="Search leads"]');

    // Modal footer buttons
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
    // NOTE: saveListButton uses .last() since search results also have "Add" buttons
    // Clearing the search before saving ensures only the footer "Add" is present
    this.saveListButton = page.getByRole('button', { name: 'Add', exact: true }).last();
  }

  // ── Navigation ────────────────────────────────────────────────────────

  async goto() {
    // Contact List direct URL (confirmed from DOM snapshot: href="/app/master/contact-list")
    await this.page.goto('/app/master/contact-list');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1500);

    const url = this.page.url();
    if (url.includes('/login')) {
      throw new Error('[ContactListPage.goto] Session expired — redirected to login.');
    }
    if (!url.includes('contact-list')) {
      // Fallback: click sidebar link by href
      const link = this.page.locator('a[href="/app/master/contact-list"]');
      if (await link.count() > 0) {
        await link.first().click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000);
      } else {
        throw new Error(`[ContactListPage.goto] Failed to navigate. Current URL: ${url}`);
      }
    }
  }

  // ── Modal Interactions ────────────────────────────────────────────────

  async clickNewList() {
    await this.newListButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.newListButton.click();
    await this.modalTitle.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);
    console.log('  [ContactListPage] Modal opened: Add New Contact List');
  }

  async fillContactListName(name) {
    await this.contactListNameInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.contactListNameInput.fill(name);
  }

  /**
   * Search for a contact by name and click Add on the first matching row
   * that has an "Add" button (skips rows already showing "Added").
   *
   * From screenshots:
   *  - Search results appear as a table inside the modal
   *  - Each row has: Sr No | Full Name | Lead ID | Phone Number | Actions (Add / Added)
   */
  async searchAndAddContact(contactName) {
    // Open/focus the search combobox
    const searchBox = this.searchLeadsInput;
    await searchBox.waitFor({ state: 'visible', timeout: 10000 });
    await searchBox.click();
    await this.page.waitForTimeout(300);

    // Clear existing and type contact name
    await searchBox.fill('');
    await searchBox.type(contactName, { delay: 60 });
    await this.page.waitForTimeout(1500); // wait for search API results

    // Find a row that:
    //  (a) contains the contact name text
    //  (b) has an "Add" button (not "Added" state)
    const matchingRows = this.page.locator('tr').filter({
      has: this.page.getByRole('button', { name: 'Add', exact: true }),
    }).filter({ hasText: new RegExp(contactName, 'i') });

    const rowCount = await matchingRows.count();

    if (rowCount > 0) {
      await matchingRows.first().getByRole('button', { name: 'Add', exact: true }).click();
      await this.page.waitForTimeout(700);
      console.log(`  ✅ Added contact: "${contactName}"`);
    } else {
      // Check if already added
      const alreadyAdded = this.page.locator('tr').filter({ hasText: contactName });
      if (await alreadyAdded.count() > 0) {
        console.log(`  ℹ️ "${contactName}" already added (button shows "Added")`);
      } else {
        console.warn(`  ⚠️ Contact "${contactName}" not found in search results`);
      }
    }

    // Clear search to hide results before next search
    await searchBox.fill('');
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(400);
  }

  /**
   * Save the contact list by clicking the footer "Add" button.
   * Clears search first so search-result "Add" buttons are hidden.
   */
  async saveContactList() {
    // Clear search to ensure only footer "Add" is visible
    const searchVisible = await this.searchLeadsInput.isVisible().catch(() => false);
    if (searchVisible) {
      await this.searchLeadsInput.fill('');
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(500);
    }

    // Click footer "Add" (last Add button on page)
    await this.saveListButton.click();

    // Wait for modal to close
    await this.modalTitle.waitFor({ state: 'hidden', timeout: 15000 });
    await this.page.waitForTimeout(1000);
    console.log('  [ContactListPage] Contact list saved successfully');
  }

  // ── Assertions ────────────────────────────────────────────────────────

  async expectContactListInTable(listName) {
    await expect(this.page.getByText(listName)).toBeVisible({ timeout: 10000 });
  }
}

module.exports = { ContactListPage };
