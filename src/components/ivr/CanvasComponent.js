const { expect } = require('@playwright/test');
const { NodeComponent } = require('./NodeComponent');

/**
 * CanvasComponent Class
 * Represents the main flowchart canvas area.
 */
class CanvasComponent {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.pane = page.locator('.react-flow__pane, [class*="react-flow__pane"], [class*="pane"]').first();
    this.nodes = page.locator('.react-flow__node');
    this.edges = page.locator('.react-flow__edge');
  }

  /**
   * Drags a block from the palette and drops it onto the canvas at a relative offset.
   * @param {string} blockName - Name of the block in the left palette
   * @param {number} offsetX - X offset from the top-left of the canvas pane
   * @param {number} offsetY - Y offset from the top-left of the canvas pane
   */
  async dropBlock(blockName, offsetX, offsetY) {
    const paletteItem = this.page.locator(`div[class*="cursor-move"]:has-text("${blockName}"), .cursor-move:has-text("${blockName}")`).first();
    await paletteItem.waitFor({ state: 'visible', timeout: 5000 });

    const paneBox = await this.pane.boundingBox();
    if (!paneBox) {
      throw new Error('Canvas pane bounding box not found.');
    }

    const dropX = paneBox.x + offsetX;
    const dropY = paneBox.y + offsetY;

    console.log(`Dragging "${blockName}" to canvas coordinate (${dropX}, ${dropY})`);
    
    // Perform mouse drag sequence
    await paletteItem.hover();
    await this.page.mouse.down();
    await this.page.mouse.move(dropX, dropY, { steps: 10 });
    await this.page.mouse.up();
    
    await this.page.waitForTimeout(1000); // Wait for canvas state to register node drop
  }

  /**
   * Returns a NodeComponent for a specific node title.
   * @param {string} title - The visible title of the node on the canvas (e.g. "Play Prompt 1")
   * @returns {NodeComponent}
   */
  getNodeByTitle(title) {
    // Find node matching the text content exactly or containing it
    const nodeLocator = this.page.locator(`.react-flow__node:has-text("${title}")`).first();
    return new NodeComponent(this.page, nodeLocator, title);
  }

  /**
   * Fits the entire flow builder canvas within the visible viewport.
   */
  async fitView() {
    const btn = this.page.locator('.react-flow__controls-fitview, [class*="fitview"]').first();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    await btn.click();
    await this.page.waitForTimeout(1000); // Allow zoom-to-fit animation to settle
  }

  /**
   * Returns total node count on canvas.
   * @returns {Promise<number>}
   */
  async getNodeCount() {
    return await this.nodes.count();
  }

  /**
   * Returns total edge count on canvas.
   * @returns {Promise<number>}
   */
  async getEdgeCount() {
    return await this.edges.count();
  }
}

module.exports = { CanvasComponent };
