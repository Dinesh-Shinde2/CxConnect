/**
 * BlockPalette Class
 * Controls interaction with the Left Sidebar containing draggable nodes.
 */
class BlockPalette {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.container = page.locator('aside[class*="sidebar"], [class*="palette-container"], div.border-r').first();
  }

  /**
   * Retrieves the locator of a block in the palette by its label/name.
   * @param {string} blockName - The user-friendly name of the block (e.g. 'Play Prompt', 'Menu Block')
   * @returns {import('@playwright/test').Locator}
   */
  getBlockLocator(blockName) {
    // Exact block list texts:
    // 'Start', 'End', 'Wait / Delay', 'Decision / If', 'Goto Flow / Subflow'
    // 'Play Prompt'
    // 'Collect DTMF Input', 'Menu Block'
    // 'Transfer to Queue'
    // 'REST API Call', 'Set Variable', 'Get Variable'
    return this.page.locator(`div[class*="cursor-move"]:has-text("${blockName}"), .cursor-move:has-text("${blockName}")`).first();
  }

  /**
   * Verifies if a block is visible in the palette.
   * @param {string} blockName
   * @returns {Promise<boolean>}
   */
  async isBlockAvailable(blockName) {
    const block = this.getBlockLocator(blockName);
    return await block.isVisible();
  }
}

module.exports = { BlockPalette };
