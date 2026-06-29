const { expect } = require('@playwright/test');
const { CanvasComponent } = require('../components/ivr/CanvasComponent');
const { BlockPalette } = require('../components/ivr/BlockPalette');
const { PropertyPanel } = require('../components/ivr/PropertyPanel');
const { IVRToolbar } = require('../components/ivr/IVRToolbar');
const { IVRValidator } = require('../validators/IVRValidator');

/**
 * IVRDesignerPage Class - Page Object Model
 * Reflects CX-Connect IVR Designer Flow Builder UI and actions.
 * 
 * URL: /app/master/ivr-designer
 * Navigation: Automation / Flows → Call Flows (IVR)
 */
class IVRDesignerPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Sub-components
    this.canvas = new CanvasComponent(page);
    this.palette = new BlockPalette(page);
    this.propertyPanel = new PropertyPanel(page);
    this.toolbar = new IVRToolbar(page);
    this.validator = new IVRValidator(page, this);

    // List Page Locators
    this.sidebarAutomationFlows = page.locator('span:has-text("Automation / Flows"), [class*="sidebar"] button:has-text("Automation / Flows")').first();
    this.sidebarCallFlowsIVR = page.locator('a[href="/app/master/ivr"], span:has-text("Call Flows (IVR)")').first();
    this.createIVRButton = page.getByRole('button', { name: /new ivr/i }).or(page.locator('button:has-text("New IVR")')).first();
    this.ivrNameInput = page.locator('input[placeholder="Enter Call Flow name"], input[name="name"], input[placeholder="Enter Name"]').first();
    this.ivrSubmitButton = page.locator('button[type="submit"], button:has-text("Confirm"), button:has-text("Create"), button:has-text("Add")').first();

    // Dialogs / Modals
    this.modalTitle = page.locator('[class*="modal"] h2, [class*="modal"] h3, [class*="dialog"] h2').first();
    this.confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
  }

  /**
   * Navigates to the IVR designer list page.
   */
  async goto() {
    // Navigate to dashboard first to initialize layout state
    if (!this.page.url().includes('/app/dashboard')) {
      await this.page.goto('/app/dashboard');
      await this.page.waitForURL(/\/app\/dashboard/, { timeout: 15000 });
      await this.page.waitForTimeout(1000);
    }
    
    await this.page.goto('/app/master/ivr');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1500);

    const landedUrl = this.page.url();
    if (landedUrl.includes('/login')) {
      throw new Error('[IVRDesignerPage.goto] Session expired - redirected to login.');
    }
  }

  /**
   * Navigates via sidebar navigation.
   */
  async navigateViaSidebar() {
    await this.sidebarAutomationFlows.click();
    await this.page.waitForTimeout(500);
    await this.sidebarCallFlowsIVR.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Creates a new IVR flow.
   * @param {string} ivrName
   */
  async createNewIVR(ivrName) {
    await this.createIVRButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.createIVRButton.click();
    await this.ivrNameInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.ivrNameInput.fill(ivrName);
    
    // Save draft trigger on creation dialog
    await this.ivrSubmitButton.click();
    await this.modalTitle.waitFor({ state: 'hidden', timeout: 5000 });
    await this.page.waitForTimeout(1000);

    // Click on the newly created IVR name link in the list to open canvas
    const nameLink = this.page.locator(`tr:has-text("${ivrName}") td, tr:has-text("${ivrName}") a, tr:has-text("${ivrName}") span`).filter({ hasText: ivrName }).first();
    await nameLink.waitFor({ state: 'visible', timeout: 5000 });
    await nameLink.click();
    
    // Wait for the designer canvas URL
    await this.page.waitForURL(/\/app\/master\/ivr-designer\//, { timeout: 15000 });
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }

  /**
   * Saves the current designer changes as draft.
   */
  async saveDraft() {
    await this.toolbar.saveDraft();
  }

  /**
   * Deploys the current IVR flow.
   */
  async deploy() {
    await this.toolbar.deploy();
  }

  /**
   * Deletes an IVR flow by name from the list page.
   * @param {string} ivrName
   */
  async deleteIVR(ivrName) {
    await this.goto();
    // Search or find the row
    const row = this.page.locator(`tr:has-text("${ivrName}")`).first();
    await expect(row).toBeVisible({ timeout: 5000 });
    
    const deleteButton = row.locator('button[aria-label*="delete" i], button[aria-label*="Delete" i], .delete-btn').first();
    await deleteButton.click();
    await this.confirmButton.click();
    await this.page.waitForTimeout(1000);
  }
}

module.exports = { IVRDesignerPage };
