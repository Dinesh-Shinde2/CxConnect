const { expect } = require('@playwright/test');

/**
 * ConnectionManager Class
 * Handles mouse drag interactions to connect nodes.
 */
class ConnectionManager {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Connects source output handle to target input handle.
   * @param {NodeComponent} sourceNode
   * @param {NodeComponent} targetNode
   */
  async connect(sourceNode, targetNode) {
    const sourceHandle = sourceNode.getOutputHandle();
    const targetHandle = targetNode.getInputHandle();
    await this._dragAndDropHandles(sourceHandle, targetHandle);
  }

  /**
   * Connects a Decision node branch (True/False) to a target node.
   * @param {NodeComponent} decisionNode
   * @param {'true'|'false'} branchType
   * @param {NodeComponent} targetNode
   */
  async connectDecision(decisionNode, branchType, targetNode) {
    const sourceHandle = decisionNode.getDecisionHandle(branchType);
    const targetHandle = targetNode.getInputHandle();
    await this._dragAndDropHandles(sourceHandle, targetHandle);
  }

  /**
   * Performs the mouse drag-and-drop sequence between handle elements.
   * @param {import('@playwright/test').Locator} fromHandle
   * @param {import('@playwright/test').Locator} toHandle
   * @private
   */
  async _dragAndDropHandles(fromHandle, toHandle) {
    await fromHandle.waitFor({ state: 'attached', timeout: 5000 });
    await toHandle.waitFor({ state: 'attached', timeout: 5000 });

    await fromHandle.scrollIntoViewIfNeeded();
    await toHandle.scrollIntoViewIfNeeded();

    console.log(`Connecting ports: from ${await fromHandle.getAttribute('data-id')} to ${await toHandle.getAttribute('data-id')}`);

    // Use native Playwright dragTo which avoids click conflicts on overlapping elements
    await fromHandle.dragTo(toHandle, { force: true });
    await this.page.waitForTimeout(1000); // Settle UI connection
  }
}

module.exports = { ConnectionManager };
