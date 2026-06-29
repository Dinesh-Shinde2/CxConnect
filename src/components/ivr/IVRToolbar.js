const { expect } = require('@playwright/test');

/**
 * IVRToolbar Class
 * Represents the top toolbar containing Save Draft and Deploy buttons.
 */
class IVRToolbar {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.saveDraftButton = page.locator('button:has-text("Save Draft"), button:has-text("Save draft")').first();
    this.deployButton = page.locator('button:has-text("Deploy IVR"), button:has-text("Deploy")').first();
    this.draftStatusText = page.locator('[class*="status"], [class*="badge"], [class*="text-gray-500"]:has-text("Draft")').first();
  }

  /**
   * Clicks Save Draft and intercepts the save call to ensure success.
   */
  async saveDraft() {
    await this.saveDraftButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Intercept/await the response from the IVR save API
    const savePromise = this.page.waitForResponse(
      response => response.url().includes('/api/v1/ivr/') && response.status() === 200,
      { timeout: 15000 }
    );
    
    await this.saveDraftButton.click();
    await savePromise;
    await this.page.waitForTimeout(1000); // Settle UI
  }

  /**
   * Clicks Deploy and intercepts response to ensure deployment completes.
   */
  async deploy() {
    await this.deployButton.waitFor({ state: 'visible', timeout: 5000 });

    const deployPromise = this.page.waitForResponse(
      response => response.url().includes('/api/v1/ivr/') && response.status() === 200,
      { timeout: 15000 }
    );

    await this.deployButton.click();
    await deployPromise;
    await this.page.waitForTimeout(1000); // Settle UI
  }
}

module.exports = { IVRToolbar };
