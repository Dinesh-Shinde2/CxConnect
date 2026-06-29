const { expect } = require('@playwright/test');

/**
 * IVRValidator Class
 * Custom assertions for IVR designer flow configurations and deployment status.
 */
class IVRValidator {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {IVRDesignerPage} designerPage
   */
  constructor(page, designerPage) {
    this.page = page;
    this.designerPage = designerPage;
  }

  /**
   * Asserts total node count on canvas matches expected count.
   * @param {number} expectedCount
   */
  async expectNodeCount(expectedCount) {
    const actualCount = await this.designerPage.canvas.getNodeCount();
    expect(actualCount).toBe(expectedCount);
  }

  /**
   * Asserts total connection edges count matches expected.
   * @param {number} expectedCount
   */
  async expectEdgeCount(expectedCount) {
    const actualCount = await this.designerPage.canvas.getEdgeCount();
    expect(actualCount).toBe(expectedCount);
  }

  /**
   * Asserts a specific node by name exists on the canvas.
   * @param {string} title
   */
  async expectNodeExists(title) {
    const node = this.designerPage.canvas.getNodeByTitle(title);
    await expect(node.locator).toBeVisible({ timeout: 5000 });
  }

  /**
   * Asserts that the IVR list page contains the IVR name and status.
   * @param {string} ivrName
   * @param {string} expectedStatus - e.g. "Draft" or "Published"
   */
  async expectIVRInList(ivrName, expectedStatus) {
    await this.designerPage.goto();
    const row = this.page.locator(`tr:has-text("${ivrName}")`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    if (expectedStatus) {
      const statusCell = row.locator(`td:has-text("${expectedStatus}"), span:has-text("${expectedStatus}")`).first();
      await expect(statusCell).toBeVisible({ timeout: 5000 });
    }
  }
}

module.exports = { IVRValidator };
