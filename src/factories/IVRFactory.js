/**
 * IVRFactory Class
 * Orchestrates canvas element placement, block configuration, and connection routing.
 */
class IVRFactory {
  static SUPPORTED_NODE_TYPES = new Set([
    'START',
    'END',
    'WAIT_DELAY',
    'DECISION',
    'GOTO_FLOW',
    'PLAY_PROMPT',
    'COLLECT_DTMF',
    'MENU_BLOCK',
    'TRANSFER_TO_QUEUE',
    'REST_API_CALL',
    'SET_VARIABLE',
    'GET_VARIABLE'
  ]);

  /**
   * Validates and filters a flow before any UI action is performed.
   * Entries with `enabled: false` are ignored.
   * @param {object} flowSpec
   * @returns {{nodes: object[], connections: object[]}}
   */
  static validateFlowSpec(flowSpec) {
    if (!flowSpec || !Array.isArray(flowSpec.nodes) || !Array.isArray(flowSpec.connections)) {
      throw new Error('IVR flow config must contain nodes[] and connections[] arrays.');
    }

    const nodes = flowSpec.nodes.filter((node) => node.enabled !== false);
    const connections = flowSpec.connections.filter((connection) => connection.enabled !== false);
    const titles = new Set();

    for (const node of nodes) {
      if (!node.title || !node.type || !Number.isFinite(node.x) || !Number.isFinite(node.y)) {
        throw new Error('Every enabled IVR node requires title, type, numeric x, and numeric y values.');
      }
      if (titles.has(node.title)) {
        throw new Error(`Duplicate enabled IVR node title: "${node.title}".`);
      }
      if (!this.SUPPORTED_NODE_TYPES.has(node.type)) {
        throw new Error(`Unsupported IVR node type "${node.type}" on "${node.title}".`);
      }
      titles.add(node.title);
    }

    for (const connection of connections) {
      if (!titles.has(connection.from) || !titles.has(connection.to)) {
        throw new Error(
          `Connection "${connection.from}" -> "${connection.to}" must reference enabled node titles.`
        );
      }
      if (connection.branch && !['true', 'false'].includes(connection.branch)) {
        throw new Error(
          `Connection "${connection.from}" -> "${connection.to}" has invalid branch "${connection.branch}".`
        );
      }
    }

    return { nodes, connections };
  }

  /**
   * Orchestrates the construction of an entire IVR flow based on a specification object.
   * @param {CanvasComponent} canvas
   * @param {ConnectionManager} connectionManager
   * @param {PropertyPanel} propertyPanel
   * @param {object} flowSpec - Declarative specification of the IVR
   * @param {object[]} flowSpec.nodes - List of nodes to drop and configure
   * @param {object[]} flowSpec.connections - List of edges to connect
   */
  static async buildFlow(canvas, connectionManager, propertyPanel, flowSpec) {
    console.log('--- IVR Flow Construction Started ---');
    const { nodes, connections } = this.validateFlowSpec(flowSpec);

    // Step 1: Drop nodes on canvas
    for (const nodeSpec of nodes) {
      console.log(`Placing node: ${nodeSpec.type} (titled: "${nodeSpec.title}") at offset (${nodeSpec.x}, ${nodeSpec.y})`);
      // Maps block type enum to palette drag item
      const paletteName = this._getPaletteName(nodeSpec.type);
      await canvas.dropBlock(paletteName, nodeSpec.x, nodeSpec.y);
    }

    // Step 2: Configure each node's properties
    console.log('Fitting view before node configuration...');
    await canvas.fitView();

    for (const nodeSpec of nodes) {
      if (!nodeSpec.config) continue;
      console.log(`Configuring properties for node: "${nodeSpec.title}"`);
      const node = canvas.getNodeByTitle(nodeSpec.title);

      // Click node and wait for the property panel form to open before proceeding
      await node.click();
      await canvas.page.waitForSelector('form#node-config-form', { state: 'visible', timeout: 15000 });
      await canvas.page.waitForTimeout(500); // Allow form fields to hydrate

      switch (nodeSpec.type) {
        case 'PLAY_PROMPT':
          await propertyPanel.configurePlayPrompt(nodeSpec.config.audioFile);
          break;
        case 'MENU_BLOCK':
          await propertyPanel.configureMenu(nodeSpec.config);
          break;
        case 'COLLECT_DTMF':
          await propertyPanel.configureCollectDTMF(nodeSpec.config);
          break;
        case 'DECISION':
          await propertyPanel.configureDecision(nodeSpec.config.expression);
          break;
        case 'TRANSFER_TO_QUEUE':
          await propertyPanel.configureTransferToQueue(nodeSpec.config.queue);
          break;
        default:
          console.warn(`Unrecognized block type: ${nodeSpec.type}`);
      }

      // Deselect node by clicking canvas background to close panel cleanly
      await canvas.pane.click();
      await canvas.page.waitForTimeout(300);
    }

    // Step 3: Connect nodes
    console.log('Fitting view before connection routing...');
    await canvas.pane.click();
    await canvas.page.waitForTimeout(500);
    await canvas.fitView();

    for (const conn of connections) {
      console.log(`Routing connection: ${conn.from} → ${conn.to}`);
      const sourceNode = canvas.getNodeByTitle(conn.from);
      const targetNode = canvas.getNodeByTitle(conn.to);

      if (conn.branch) {
        // For decision true/false outputs
        await connectionManager.connectDecision(sourceNode, conn.branch, targetNode);
      } else {
        // Standard single output connections (includes Menu sequential routing)
        await connectionManager.connect(sourceNode, targetNode);
      }
    }

    console.log('--- IVR Flow Construction Completed ---');
    return { nodeCount: nodes.length, connectionCount: connections.length };
  }

  /**
   * Maps internal code block types to visible sidebar palette item labels.
   * @param {string} type
   * @returns {string}
   * @private
   */
  static _getPaletteName(type) {
    const map = {
      'START': 'Start',
      'END': 'End',
      'WAIT_DELAY': 'Wait / Delay',
      'DECISION': 'Decision / If',
      'GOTO_FLOW': 'Goto Flow / Subflow',
      'PLAY_PROMPT': 'Play Prompt',
      'COLLECT_DTMF': 'Collect DTMF Input',
      'MENU_BLOCK': 'Menu Block',
      'TRANSFER_TO_QUEUE': 'Transfer to Queue',
      'REST_API_CALL': 'REST API Call',
      'SET_VARIABLE': 'Set Variable',
      'GET_VARIABLE': 'Get Variable'
    };
    return map[type] || type;
  }
}

module.exports = { IVRFactory };
