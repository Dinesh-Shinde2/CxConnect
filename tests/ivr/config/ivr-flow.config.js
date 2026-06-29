/**
 * Editable IVR flow configuration.
 * Add, remove, reorder, or disable nodes and connections here.
 * See ../README.md for supported fields and connection rules.
 */
const ivrFlowConfig = {
  test: {
    namePrefix: 'AutoIVR',
    timeoutMs: 180000,
    deploy: true,
    expectedStatus: 'ACTIVE'
  },

  nodes: [
    { title: 'Start 1', type: 'START', x: 50, y: 120 },
    {
      title: 'Play Prompt 1',
      type: 'PLAY_PROMPT',
      x: 280,
      y: 120,
      config: { audioFile: 'welcomivrtest' }
    },
    {
      title: 'Menu 1',
      type: 'MENU_BLOCK',
      x: 550,
      y: 120,
      config: {
        menuPrompt: 'menu123',
        options: ['1', '2', '3'],
        invalidPrompt: 'invalidinputivr',
        noInputPrompt: 'maxretry',
        maxRetryPrompt: 'maxretry',
        timeout: 5000,
        retryCount: 4
      }
    },
    {
      title: 'Collect DTMF 1',
      type: 'COLLECT_DTMF',
      x: 200,
      y: 260,
      config: {
        minDigits: 1,
        maxDigits: 1,
        terminationKey: '#',
        timeout: 5000,
        retryCount: 3,
        invalidPrompt: 'invalidinputivr'
      }
    },
    {
      title: 'Decision 1',
      type: 'DECISION',
      x: 200,
      y: 400,
      config: { expression: "${dtmf_input} == '1'" }
    },
    {
      title: 'Transfer to Queue 1',
      type: 'TRANSFER_TO_QUEUE',
      x: 200,
      y: 540,
      config: { queue: 'STT Queue' }
    },
    {
      title: 'Decision 2',
      type: 'DECISION',
      x: 550,
      y: 400,
      config: { expression: "${menu_input} == '2'" }
    },
    {
      title: 'Transfer to Queue 2',
      type: 'TRANSFER_TO_QUEUE',
      x: 550,
      y: 540,
      config: { queue: 'STT Queue' }
    },
    {
      title: 'Decision 3',
      type: 'DECISION',
      x: 900,
      y: 400,
      config: { expression: "${menu_input} == '3'" }
    },
    {
      title: 'Transfer to Queue 3',
      type: 'TRANSFER_TO_QUEUE',
      x: 900,
      y: 540,
      config: { queue: 'STT Queue' }
    }
  ],

  connections: [
    { from: 'Start 1', to: 'Play Prompt 1' },
    { from: 'Play Prompt 1', to: 'Menu 1' },

    // Menu options use connection order: first edge = option 1, second = option 2, etc.
    { from: 'Menu 1', to: 'Collect DTMF 1' },
    { from: 'Menu 1', to: 'Decision 2' },
    { from: 'Menu 1', to: 'Decision 3' },

    { from: 'Collect DTMF 1', to: 'Decision 1' },
    { from: 'Decision 1', to: 'Transfer to Queue 1', branch: 'true' },
    { from: 'Decision 2', to: 'Transfer to Queue 2', branch: 'true' },
    { from: 'Decision 3', to: 'Transfer to Queue 3', branch: 'true' }
  ]
};

module.exports = { ivrFlowConfig };
