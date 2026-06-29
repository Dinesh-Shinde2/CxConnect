/**
 * NodeComponent Class
 * Represents a single block/node on the designer canvas.
 */
class NodeComponent {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {import('@playwright/test').Locator} locator
   * @param {string} title
   */
  constructor(page, locator, title) {
    this.page = page;
    this.locator = locator;
    this.title = title;
  }

  /**
   * Clicks the node on the canvas to select it and open its property panel.
   */
  async click() {
    await this.locator.click({ force: true });
    await this.page.waitForTimeout(500); // Allow slide transition for panel
  }

  /**
   * Retrieves the target handle (input port at the top).
   * @returns {import('@playwright/test').Locator}
   */
  getInputHandle() {
    return this.locator.locator('.react-flow__handle-top, [data-handlepos="top"]').first();
  }

  /**
   * Retrieves the source handle (output port at the bottom).
   * @returns {import('@playwright/test').Locator}
   */
  getOutputHandle() {
    return this.locator.locator('.react-flow__handle-bottom, [data-handlepos="bottom"]').first();
  }

  /**
   * Retrieves a specific handle for Decision nodes (True/False).
   * @param {'true'|'false'} type - 'true' for green/yes branch, 'false' for red/no branch
   * @returns {import('@playwright/test').Locator}
   */
  getDecisionHandle(type) {
    return this.locator.locator(`.react-flow__handle[data-handleid="${type}"]`).first();
  }

  /**
   * Retrieves the bounding box of this node.
   * @returns {Promise<{x: number, y: number, width: number, height: number} | null>}
   */
  async boundingBox() {
    return await this.locator.boundingBox();
  }
}

module.exports = { NodeComponent };
