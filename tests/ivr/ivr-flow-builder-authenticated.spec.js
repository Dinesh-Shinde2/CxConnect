/**
 * IVR Flow Designer E2E Integration and Deployment Test
 * ========================================================
 * Complete flow:
 *   1) Restores authenticated session cookies and sessionStorage.
 *   2) Navigates to Automation / Flows → Call Flows (IVR).
 *   3) Clicks "+ Create IVR" to initialize a new flow canvas.
 *   4) Drags and places 9 additional flow designer blocks:
 *      - 1× Play Prompt
 *      - 1× Menu Block
 *      - 1× Collect DTMF Input
 *      - 3× Decision / If blocks
 *      - 3× Transfer to Queue blocks
 *   5) Configures all properties for each block:
 *      - Play Prompt audio file prompt select
 *      - Menu Block timeout, options, retries, and invalid prompts
 *      - Collect DTMF digits constraints and retry prompt config
 *      - Decision expression formulas (${dtmf_input} == '1' etc.)
 *      - Transfer to Queue destination selections
 *   6) Connects nodes in a multi-option branched topology:
 *      - Start → Play Prompt → Menu
 *      - Menu Option 1 → Collect DTMF → Decision 1 → Transfer Queue 1
 *      - Menu Option 2 → Decision 2 → Transfer Queue 2
 *      - Menu Option 3 → Decision 3 → Transfer Queue 3
 *   7) Saves Draft (intercepts API payload).
 *   8) Deploys Call Flow (verifies version number and deployment status).
 *   9) Cleans up canvas and verifies draft appears in list.
 *
 * Execution command:
 *   npx playwright test tests/ivr/ivr-flow-builder-authenticated.spec.js --project=chromium-authenticated --headed
 */

const { test, expect } = require('../../src/fixtures/baseFixture');
const { IVRFactory } = require('../../src/factories/IVRFactory');
const { ConnectionManager } = require('../../src/components/ivr/ConnectionManager');
const { ivrFlowConfig } = require('./config/ivr-flow.config');
const fs = require('fs');
const path = require('path');

// Re-use authentication cookies and localStorage
test.use({ storageState: 'playwright/.auth/user.json' });

// Load sessionStorage to bypass Next.js SPA guards
const sessionStoragePath = path.resolve(__dirname, '../../playwright/.auth/sessionStorage.json');
let sessionStorageData = '{}';
try {
  sessionStorageData = fs.readFileSync(sessionStoragePath, 'utf-8');
} catch (e) {
  console.warn('[Warning] sessionStorage.json not found. Run setup project first.');
}

// Unique IVR flow name configuration
const rand = Math.floor(1000 + Math.random() * 9000);
const IVR_NAME = `${ivrFlowConfig.test.namePrefix}_${rand}`;

test.describe('IVR Flow Designer E2E Suite', () => {
  test.describe.configure({ mode: 'serial', retries: 0 });

  test.beforeEach(async ({ page }) => {
    // Navigate to login page first to establish target origin context
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Populate token/state directly into session storage
    await page.evaluate((sessionData) => {
      const data = JSON.parse(sessionData);
      for (const [key, value] of Object.entries(data)) {
        sessionStorage.setItem(key, value);
      }
    }, sessionStorageData);
  });

  test('E2E_IVR_001 | Complete IVR Drag-and-Drop Creation, Wiring, and Deployment Flow', async ({ ivrDesignerPage, page }) => {
    test.setTimeout(ivrFlowConfig.test.timeoutMs);

    // ── STEP 1: Create IVR Call Flow ──────────────────────────────────────
    console.log(`[Step 1] Navigating to IVR Designer and creating: ${IVR_NAME}`);
    await ivrDesignerPage.goto();
    await ivrDesignerPage.createNewIVR(IVR_NAME);

    // Verify canvas is loaded (the canvas root element is present)
    await ivrDesignerPage.canvas.pane.waitFor({ state: 'visible', timeout: 15000 });
    console.log('✅ Canvas loaded. Start node is present by default.');

    // Deselect all nodes to prevent accidental deletion during keyboard inputs
    await ivrDesignerPage.canvas.pane.click();
    await page.waitForTimeout(500);

    // Hide Minimap to prevent click interception on bottom-right nodes
    await page.addStyleTag({ content: '.react-flow__minimap { display: none !important; }' });

    // ── STEP 2-4: Drag, Configure, and Connect Nodes ─────────────────────
    console.log('[Step 2-4] Building flowchart nodes and connecting edges...');

    const builtFlow = await IVRFactory.buildFlow(
      ivrDesignerPage.canvas,
      new ConnectionManager(page),
      ivrDesignerPage.propertyPanel,
      ivrFlowConfig
    );

    // ── STEP 5-6: Save Draft and Verify Canvas elements ─────────────────
    console.log('[Step 5-6] Saving draft and validating canvas configuration...');
    await ivrDesignerPage.saveDraft();
    
    // Assert structural integrity on canvas (10 nodes and 9 connection edges)
    await ivrDesignerPage.validator.expectNodeCount(builtFlow.nodeCount);
    await ivrDesignerPage.validator.expectEdgeCount(builtFlow.connectionCount);
    console.log('✅ Canvas state saved as draft successfully.');

    // ── STEP 7: Deploy Call Flow ──────────────────────────────────────────
    if (ivrFlowConfig.test.deploy) {
      console.log('[Step 7] Deploying Call Flow...');
      await ivrDesignerPage.deploy();
      console.log('✅ Call Flow deployed successfully.');
    }

    // ── STEP 8: Verification in Call Flow list ──────────────────────────
    console.log('[Step 8] Verifying Call Flow status in main list page...');
    await ivrDesignerPage.validator.expectIVRInList(
      IVR_NAME,
      ivrFlowConfig.test.deploy ? ivrFlowConfig.test.expectedStatus : undefined
    );
  });
});
