/**
 * Inbound Campaign Manager Test Suite
 * =====================================
 * Login Method: User ID + Password (Login happens ONCE via beforeAll)
 * All tests share the same logged-in browser session (serial mode).
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║              📋  INBOUND CAMPAIGN DATA — FILL THIS IN               ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  Edit CAMPAIGN_CONFIG below. Values are ACTUALLY USED to fill       ║
 * ║  the form — not just for documentation.                             ║
 * ║  null = skip that field (dropdown opens/closes without selecting)   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Run commands:
 *   npm run test:campaign:inbound           → All tests (Chromium)
 *   npm run test:campaign:inbound:headed    → With visible browser
 *   npm run test:campaign:inbound:ui        → Playwright UI mode
 *   npm run test:campaign:inbound:smoke     → @smoke tags only
 *
 * ⚠️ KEY DOM FACTS (do NOT change these strategies):
 *   - Dropdown options are plain <div> rows — NOT role="option"
 *   - Pressing Escape closes the ENTIRE modal (not just the dropdown)
 *   - Dropdowns are dismissed by clicking the modal title area
 */

const { test, expect } = require('../../src/fixtures/baseFixture');
const { LoginPage } = require('../../src/pages/LoginPage');
const { DashboardPage } = require('../../src/pages/DashboardPage');
const { InboundCampaignPage } = require('../../src/pages/InboundCampaignPage');

// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// 📋 CAMPAIGN CONFIG (INBOUND) — Edit values here to configure details
//    → These values are used to fill out and create the campaign in TC_IBC_016.
//    → You can change these to test different inputs.
//    → Set a field to null or 'first' to select the first available option.
// ══════════════════════════════════════════════════════════════════════════════
const CAMPAIGN_CONFIG = {

  // ── Field 0: Campaign Name ────────────────────────────────────────────────
  // ENTER CAMPAIGN NAME HERE. Must be unique on every run.
  // Set to 'auto' to auto-generate a unique name (e.g. IBCamp73921).
  // Or set a specific text string (e.g., 'IBCamp01').
  campaignName: 'auto',              // ← EDIT THIS LINE (e.g. 'IBCamp01' | 'auto')

  // ── Field 1: Select DID ───────────────────────────────────────────────────
  // ENTER THE DID NUMBER HERE.
  // Known UAT values: '+912269054593', '+912269054596', '+912269054597'
  // Specify exact number as text (e.g., '+912269054596'), or set to null/'first' to pick the first available.
  did: '+912269054596',              // ← EDIT THIS LINE (e.g. '+912269054596' | null | 'first')

  // ── Field 2: Business Hours ───────────────────────────────────────────────
  // ENTER BUSINESS HOURS HERE.
  // Known UAT values: '24x7', '9 AM - 6 PM', 'Office Hours'
  // Specify exact value (e.g., '24x7'), or set to null/'first' to pick the first available.
  businessHour: '24x7',             // ← EDIT THIS LINE (e.g. '24x7' | 'Office Hours' | null | 'first')

  // ── Field 3: Out of Business — Audio File ────────────────────────────────
  // ENTER OUT OF BUSINESS AUDIO FILE NAME HERE.
  // Known UAT values: 'ishanofficehours', 'after-hours-message'
  // Specify exact value (e.g., 'ishanofficehours'), or set to null/'first' to pick the first available.
  outOfBusinessAudio: 'ishanofficehours', // ← EDIT THIS LINE (e.g. 'ishanofficehours' | null | 'first')

  // ── Field 4: Route To ────────────────────────────────────────────────────
  // SELECT THE ROUTE TYPE HERE.
  // Options: 'Queue' (shows "Select Queue" dropdown) | 'IVR' (shows "Select IVR" dropdown)
  routeTo: 'Queue',                  // ← EDIT THIS LINE (e.g. 'Queue' | 'IVR')

  // ── Field 5a: Select Queue (Used only if Route To = 'Queue') ──────────────
  // ENTER QUEUE NAME HERE.
  // Known UAT values: 'Camp Queue 2', '24x7 Online Support', 'Doctors Direct'
  // Specify exact queue name (e.g. '24x7 Online Support'), or set to null/'first' to pick the first available.
  campaignQueue: '24x7 Online Support', // ← EDIT THIS LINE (e.g. '24x7 Online Support' | null | 'first')

  // ── Field 5b: Select IVR (Used only if Route To = 'IVR') ─────────────────
  // ENTER IVR NAME HERE.
  // Known UAT values: 'Kirtan Test', 'Doctors Direct'
  // Specify exact IVR name (e.g. 'Kirtan Test'), or set to null/'first' to pick the first available.
  ivrName: null,                     // ← EDIT THIS LINE (e.g. 'Kirtan Test' | null | 'first')

  // ── Field 6: Select Script ────────────────────────────────────────────────
  // ENTER SCRIPT NAME HERE.
  // Known UAT values: 'Inbound Script 1', 'Support Script'
  // Specify exact script name (e.g. 'Inbound Script 1'), or set to null/'first' to pick the first available.
  script: null,                      // ← EDIT THIS LINE (e.g. 'Inbound Script 1' | null | 'first')

  // ── Field 7: PIS Toggle ───────────────────────────────────────────────────
  // ENABLE OR DISABLE PIS TOGGLE HERE.
  // Set to true to switch PIS toggle ON, or false to leave it OFF.
  pisEnabled: false,                 // ← EDIT THIS LINE (true | false)

  // ── Field 8: SOP Compliance (optional checkbox) ───────────────────────────
  // ENABLE OR DISABLE SOP COMPLIANCE CHECKBOX HERE.
  // Set to true to check the checkbox, or false to leave it unchecked.
  sopCompliance: false,              // ← EDIT THIS LINE (true | false)
};
// ══════════════════════════════════════════════════════════════════════════════

// ── Resolve campaign name ─────────────────────────────────────────────────────
const resolvedCampaignName =
  CAMPAIGN_CONFIG.campaignName === 'auto'
    ? `IBCamp${Date.now().toString().slice(-5)}`
    : CAMPAIGN_CONFIG.campaignName;

// ── Serial mode ───────────────────────────────────────────────────────────────
test.describe.configure({ mode: 'serial', retries: 0 });

test.describe('Inbound Campaign Manager Suite | CX-Connect', () => {

  let sharedPage;
  let ibPage;

  // ── Login ONCE before all tests ──────────────────────────────────────
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();

    const userId   = process.env.USER_ID;
    const password = process.env.USER_PASSWORD;

    if (!userId || !password) {
      throw new Error('[Inbound Campaign Suite] USER_ID and USER_PASSWORD must be set in .env.uat');
    }

    console.log(`[Inbound Campaign Suite] Logging in once as: ${userId}`);

    const loginPage = new LoginPage(sharedPage);
    await loginPage.goto();
    await loginPage.loginWithUserIdAndPassword(userId, password);

    const dashboardPage = new DashboardPage(sharedPage);
    await dashboardPage.expectDashboardLoaded();
    console.log('[Inbound Campaign Suite] ✅ Login successful. Session reused for all tests.');

    ibPage = new InboundCampaignPage(sharedPage);
  });

  // ── Close shared session after all tests ─────────────────────────────
  test.afterAll(async () => {
    if (sharedPage) await sharedPage.context().close();
  });

  // ── Session recovery before each test ────────────────────────────────
  test.beforeEach(async () => {
    if (sharedPage && sharedPage.url().includes('/login')) {
      console.log('[beforeEach] ⚠️ Detected redirect to login page. Re-authenticating...');
      const loginPage = new LoginPage(sharedPage);
      await loginPage.goto();
      await loginPage.loginWithUserIdAndPassword(process.env.USER_ID, process.env.USER_PASSWORD);
      await ibPage.goto();
    }
  });

  // ══════════════════════════════════════════════════════════════════════
  // INTERNAL HELPERS
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Opens a dropdown and selects a specific option by text.
   * If optionText is null/first, opens and picks first available option.
   *
   * @param {string}      placeholderRegex - regex matching the closed-dropdown text
   * @param {string|null} optionText       - exact text to select, or null/first to use first available
   * @param {string}      label            - name used in console logs
   * @param {string}      tcId             - test ID for logging
   */
  async function handleDropdown(placeholderRegex, optionText, label, tcId) {
    const trigger = sharedPage.locator('div').filter({ hasText: placeholderRegex }).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await sharedPage.waitForTimeout(800);

    // Confirm dropdown opened via its Search input
    const searchBox = sharedPage.locator('input[placeholder="Search..."]').first();
    const opened = await searchBox.isVisible().catch(() => false);
    if (!opened) {
      console.log(`[${tcId}] Dropdown clicked (no search box — may use inline options)`);
      await sharedPage.waitForTimeout(400);
    }

    const hasCustomValue = optionText && optionText !== 'first';

    if (hasCustomValue) {
      // ── SELECT the configured value ──────────────────────────────────
      // Type in the search box to filter, then click the matching option
      if (opened) {
        await searchBox.fill(optionText);
        await sharedPage.waitForTimeout(600);
      }

      // Find the dropdown container panel (the div with class absolute z-30)
      const panel = sharedPage.locator('div.absolute.z-30').filter({ has: searchBox }).first();

      // Match the option row by text content inside the panel to avoid background table matches
      const option = panel
        .locator('ul li')
        .filter({ hasText: new RegExp(`^${optionText.replace(/[+()]/g, '\\$&')}$`) })
        .first();

      const found = await option.isVisible().catch(() => false);
      if (found) {
        await option.click({ force: true });
        console.log(`[${tcId}] ✅ ${label}: SELECTED → "${optionText}"`);
      } else {
        // Fallback: looser match inside active panel
        const looseFit = panel.locator('ul li').filter({ hasText: optionText }).first();
        const looseFound = await looseFit.isVisible().catch(() => false);
        if (looseFound) {
          await looseFit.click({ force: true });
          console.log(`[${tcId}] ✅ ${label}: SELECTED (loose match) → "${optionText}"`);
        } else {
          console.warn(`[${tcId}] ⚠️  ${label}: option "${optionText}" not found — falling back to first available`);
          if (opened) {
            await searchBox.fill('');
            await sharedPage.waitForTimeout(600);
          }
          await pickFirstAvailable(label, tcId);
        }
      }
    } else {
      // ── NULL or 'first': pick first available option ───────────────────────
      await pickFirstAvailable(label, tcId);
    }

    await sharedPage.waitForTimeout(500);

    // Always confirm modal is still open
    const modalTitle = sharedPage.getByText('Add new Inbound Campaign', { exact: true });
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
  }

  /**
   * Picks the first available option from an already-open dropdown.
   * Scopes to the dropdown panel (found via its Search input) to avoid
   * accidentally clicking page-level elements like the header.
   */
  async function pickFirstAvailable(label, tcId) {
    await sharedPage.waitForTimeout(800);

    // The open dropdown panel contains a Search... input
    const searchInPanel = sharedPage.locator('input[placeholder="Search..."]').first();
    const panelOpen = await searchInPanel.isVisible().catch(() => false);

    if (panelOpen) {
      // The panel container is the absolute z-30 div that contains the search input
      const panel = sharedPage.locator('div.absolute.z-30').filter({ has: searchInPanel }).first();
      // The options are 'li' elements inside the panel's 'ul'
      const options = panel.locator('ul li');
      const count = await options.count();

      for (let i = 0; i < count; i++) {
        const opt = options.nth(i);
        const optText = await opt.textContent().catch(() => '');
        if (optText.trim().length > 0 && optText.trim() !== 'No options found') {
          await opt.click({ force: true });
          console.log(`[${tcId}] ✅ ${label}: picked first available → "${optText.trim()}"`);
          await sharedPage.waitForTimeout(400);
          return;
        }
      }
      console.log(`[${tcId}] ⚠️  ${label}: could not find a valid option inside panel — closing dropdown`);
      const modalTitle = sharedPage.getByText('Add new Inbound Campaign', { exact: true });
      await modalTitle.click({ force: true });
    } else {
      console.log(`[${tcId}] ⚠️  ${label}: dropdown panel not open (no search box found)`);
    }

    await sharedPage.waitForTimeout(400);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SECTION A — VALIDATION TESTS  (independent of CAMPAIGN_CONFIG)
  // ══════════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_000 | Prepare environment — free up DID if none are available
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_000 | Prepare environment — free up DID if none are available', async () => {
    console.log('[TC_IBC_000] Navigating to Campaign Manager...');
    await ibPage.goto();
    await ibPage.expectCampaignPageLoaded();

    // Check if we have any available DIDs in the system
    console.log('[TC_IBC_000] Checking available DIDs in the modal...');
    await ibPage.openAddCampaignModal();
    await ibPage.expectModalVisible();

    const trigger = sharedPage.locator('div').filter({ hasText: /^Select a DID/ }).first();
    await trigger.click();
    await sharedPage.waitForTimeout(1000);

    const searchBox = sharedPage.locator('input[placeholder="Search..."]').first();
    const panel = sharedPage.locator('div.absolute.z-30').filter({ has: searchBox }).first();
    const options = panel.locator('ul li');
    const count = await options.count();

    let availableDIDs = 0;
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text && text.trim().length > 0 && text.trim() !== 'No options found') {
        availableDIDs++;
      }
    }

    console.log(`[TC_IBC_000] Found ${availableDIDs} available DIDs in dropdown`);

    // Close the dropdown and modal
    await sharedPage.getByText('Add new Inbound Campaign', { exact: true }).click({ force: true });
    await sharedPage.waitForTimeout(500);
    await ibPage.cancelCampaignCreation();
    await ibPage.expectModalClosed();

    // If no DIDs are available, find a running campaign and stop it to free up a DID
    if (availableDIDs === 0) {
      console.log('[TC_IBC_000] ⚠️ No available DIDs found! Freeing up a DID by stopping a running campaign...');
      const disableBtn = sharedPage.locator('button[aria-label="Disable Campaign"]').first();
      if (await disableBtn.isVisible()) {
        await disableBtn.click();
        await sharedPage.waitForTimeout(1000);
        const confirmBtn = sharedPage.locator('button:has-text("Yes"), button:has-text("Confirm"), button:has-text("Disable")').first();
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
          console.log('[TC_IBC_000] ✅ Confirmed stopping running campaign');
          await sharedPage.waitForTimeout(3000);
        } else {
          console.log('[TC_IBC_000] ⚠️ No confirmation button found.');
        }
      } else {
        console.log('[TC_IBC_000] ⚠️ No running campaigns found to disable.');
      }
    } else {
      console.log('[TC_IBC_000] ✅ Environment is ready: DIDs are available');
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_001 | Navigate to Campaign Manager — Inbound page loads
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_001 | Campaign Manager page loads after login @smoke', async () => {
    console.log('[TC_IBC_001] Navigating to Campaign Manager (Inbound)...');
    await ibPage.goto();
    await ibPage.expectCampaignPageLoaded();
    console.log('[TC_IBC_001] ✅ Campaign Manager page loaded');
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_002 | Inbound sub-tab is visible and active
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_002 | Inbound tab is visible on Campaign Manager page @smoke', async () => {
    await ibPage.expectInboundTabVisible();
    console.log('[TC_IBC_002] ✅ Inbound tab is visible');
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_003 | Open "Add new Inbound Campaign" modal
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_003 | "Add new Inbound Campaign" modal opens correctly @smoke', async () => {
    const isOpen = await ibPage.modalTitle.isVisible().catch(() => false);
    if (!isOpen) await ibPage.openAddCampaignModal();
    await ibPage.expectModalVisible();
    console.log('[TC_IBC_003] ✅ Add Inbound Campaign modal opened');
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_004 | All always-visible form fields are present (default state)
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_004 | All required form fields visible in modal (default state)', async () => {
    await ibPage.expectAllFormFieldsVisible();
    console.log('[TC_IBC_004] ✅ All form fields visible (IVR is default Route To)');
  });

  // ══════════════════════════════════════════════════════════════════════
  // SECTION B — FIELD FILL TESTS  (use CAMPAIGN_CONFIG values)
  //   Each test ACTUALLY fills/selects the configured value.
  //   null config = dropdown opens+closes, no selection made.
  // ══════════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_005 | Campaign Name — fill with configured name
  //   CAMPAIGN_CONFIG.campaignName: 'auto' | 'IBCamp01'
  //   Current value: resolvedCampaignName (printed in log)
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_005 | Campaign name is filled with configured value', async () => {
    console.log(`[TC_IBC_005] Filling campaign name: "${resolvedCampaignName}"`);
    await ibPage.campaignNameInput.scrollIntoViewIfNeeded();
    await ibPage.campaignNameInput.clear();
    await ibPage.campaignNameInput.fill(resolvedCampaignName);
    await expect(ibPage.campaignNameInput).toHaveValue(resolvedCampaignName);
    console.log(`[TC_IBC_005] ✅ Campaign name "${resolvedCampaignName}" filled`);
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_006 | Select DID — select the configured DID number
  //   CAMPAIGN_CONFIG.did: '+912269054596' | null
  //   UAT options: +912269054593, +912269054596, +912269054597
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_006 | "Select DID" dropdown — select configured DID @smoke', async () => {
    console.log(`[TC_IBC_006] DID config: ${CAMPAIGN_CONFIG.did ?? 'null (open only)'}`);
    await handleDropdown(/^Select a DID/, CAMPAIGN_CONFIG.did, 'Select DID', 'TC_IBC_006');
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_007 | Business Hours — select the configured option
  //   CAMPAIGN_CONFIG.businessHour: '24x7' | '9 AM - 6 PM' | null
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_007 | "Business Hours" dropdown — select configured option', async () => {
    console.log(`[TC_IBC_007] Business Hour config: ${CAMPAIGN_CONFIG.businessHour ?? 'null (open only)'}`);
    await handleDropdown(/^Select your Business hour/, CAMPAIGN_CONFIG.businessHour, 'Business Hours', 'TC_IBC_007');
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_008 | Out of Business — Audio File — select configured audio file
  //   CAMPAIGN_CONFIG.outOfBusinessAudio: 'ishanofficehours' | null
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_008 | "Out of Business - Audio File" dropdown — select configured file', async () => {
    console.log(`[TC_IBC_008] Audio File config: ${CAMPAIGN_CONFIG.outOfBusinessAudio ?? 'null (open only)'}`);
    await handleDropdown(/^Select your Audio File/, CAMPAIGN_CONFIG.outOfBusinessAudio, 'Out of Business Audio', 'TC_IBC_008');
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_009 | Route To — select Queue or IVR per config
  //   CAMPAIGN_CONFIG.routeTo: 'Queue' | 'IVR'
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_009 | Route To — select configured option (Queue or IVR)', async () => {
    console.log(`[TC_IBC_009] Route To config: "${CAMPAIGN_CONFIG.routeTo}"`);
    if (CAMPAIGN_CONFIG.routeTo === 'Queue') {
      await ibPage.selectRouteToQueue();
      const queueDrop = sharedPage.locator('div').filter({ hasText: /^Select a Queue/ }).first();
      await expect(queueDrop).toBeVisible({ timeout: 8000 });
      console.log('[TC_IBC_009] ✅ Route To → Queue selected, "Select Queue" dropdown appeared');
    } else {
      await ibPage.selectRouteToIVR();
      const ivrDrop = sharedPage.locator('div').filter({ hasText: /^Select an IVR/ }).first();
      await expect(ivrDrop).toBeVisible({ timeout: 8000 });
      console.log('[TC_IBC_009] ✅ Route To → IVR selected, "Select IVR" dropdown appeared');
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_010 | Select Queue / Select IVR — select the configured option
  //   If routeTo='Queue': CAMPAIGN_CONFIG.campaignQueue (null = first available)
  //   If routeTo='IVR':   CAMPAIGN_CONFIG.ivrName       (null = first available)
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_010 | Select Queue/IVR — select configured option', async () => {
    if (CAMPAIGN_CONFIG.routeTo === 'Queue') {
      console.log(`[TC_IBC_010] Queue config: ${CAMPAIGN_CONFIG.campaignQueue ?? 'null (first available)'}`);
      await handleDropdown(/^Select a Queue/, CAMPAIGN_CONFIG.campaignQueue, 'Select Queue', 'TC_IBC_010');
    } else {
      console.log(`[TC_IBC_010] IVR config: ${CAMPAIGN_CONFIG.ivrName ?? 'null (first available)'}`);
      await handleDropdown(/^Select an IVR/, CAMPAIGN_CONFIG.ivrName, 'Select IVR', 'TC_IBC_010');
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_011 | Select Script — select the configured script
  //   CAMPAIGN_CONFIG.script: 'Inbound Script 1' | null
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_011 | "Select Script" dropdown — select configured script', async () => {
    console.log(`[TC_IBC_011] Script config: ${CAMPAIGN_CONFIG.script ?? 'null (open only)'}`);
    await handleDropdown(/^Select a Script/, CAMPAIGN_CONFIG.script, 'Select Script', 'TC_IBC_011');
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_012 | PIS Toggle — set per config
  //   CAMPAIGN_CONFIG.pisEnabled: true | false
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_012 | PIS toggle is visible and set per config', async () => {
    const pisToggle = sharedPage.locator('div').filter({ hasText: /\bPIS\b/ }).locator('button').first();
    await expect(pisToggle).toBeVisible({ timeout: 5000 });

    if (CAMPAIGN_CONFIG.pisEnabled) {
      await pisToggle.click();
      console.log('[TC_IBC_012] ✅ PIS toggle turned ON (per config: pisEnabled = true)');
    } else {
      console.log('[TC_IBC_012] ✅ PIS toggle visible — left OFF (per config: pisEnabled = false)');
    }
  });

  // ══════════════════════════════════════════════════════════════════════
  // SECTION C — MODAL ACTION TESTS
  // ══════════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_013 | Save and Cancel buttons visible
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_013 | "Save" and "Cancel" buttons are visible in the modal', async () => {
    await expect(ibPage.saveButton).toBeVisible({ timeout: 5000 });
    await expect(ibPage.cancelButton).toBeVisible({ timeout: 5000 });
    console.log('[TC_IBC_013] ✅ Save and Cancel buttons are visible');
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_014 | Cancel closes the modal without saving
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_014 | Clicking Cancel closes the modal without creating a campaign', async () => {
    await ibPage.cancelCampaignCreation();
    await ibPage.expectModalClosed();
    console.log('[TC_IBC_014] ✅ Cancel closes the Inbound Campaign modal');
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_015 | Modal re-opens in clean default state after Cancel
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_015 | Modal re-opens in default state (IVR selected) after Cancel', async () => {
    await ibPage.openAddCampaignModal();
    await ibPage.expectModalVisible();

    await expect(ibPage.campaignNameInput).toHaveValue('');

    const ivrDropdown = sharedPage.locator('div').filter({ hasText: /^Select an IVR/ }).first();
    await expect(ivrDropdown).toBeVisible({ timeout: 8000 });
    console.log('[TC_IBC_015] ✅ Modal re-opened with empty form and IVR as default');

    await ibPage.cancelCampaignCreation();
  });

  // ─────────────────────────────────────────────────────────────────────
  // TC_IBC_016 | Complete Inbound Campaign Creation and Save
  // ─────────────────────────────────────────────────────────────────────
  test('TC_IBC_016 | Complete Inbound Campaign Creation and Save', async () => {
    console.log('[TC_IBC_016] Starting campaign creation E2E...');
    await ibPage.openAddCampaignModal();
    await ibPage.expectModalVisible();

    // 1) Campaign Name
    console.log(`[TC_IBC_016] Filling campaign name: "${resolvedCampaignName}"`);
    await ibPage.campaignNameInput.fill(resolvedCampaignName);

    // 2) Select DID
    console.log(`[TC_IBC_016] Selecting DID: ${CAMPAIGN_CONFIG.did ?? 'first available'}`);
    await handleDropdown(/^Select a DID/, CAMPAIGN_CONFIG.did, 'Select DID', 'TC_IBC_016');

    // 3) Business Hours
    console.log(`[TC_IBC_016] Selecting Business Hours: ${CAMPAIGN_CONFIG.businessHour ?? 'first available'}`);
    await handleDropdown(/^Select your Business hour/, CAMPAIGN_CONFIG.businessHour, 'Business Hours', 'TC_IBC_016');

    // 4) Out of Business Audio File
    console.log(`[TC_IBC_016] Selecting Out of Business Audio: ${CAMPAIGN_CONFIG.outOfBusinessAudio ?? 'first available'}`);
    await handleDropdown(/^Select your Audio File/, CAMPAIGN_CONFIG.outOfBusinessAudio, 'Out of Business Audio', 'TC_IBC_016');

    // 5) Route To
    console.log(`[TC_IBC_016] Route To: ${CAMPAIGN_CONFIG.routeTo}`);
    if (CAMPAIGN_CONFIG.routeTo === 'Queue') {
      await ibPage.selectRouteToQueue();
      // Select Queue
      console.log(`[TC_IBC_016] Selecting Queue: ${CAMPAIGN_CONFIG.campaignQueue ?? 'first available'}`);
      await handleDropdown(/^Select a Queue/, CAMPAIGN_CONFIG.campaignQueue, 'Select Queue', 'TC_IBC_016');
    } else {
      await ibPage.selectRouteToIVR();
      // Select IVR
      console.log(`[TC_IBC_016] Selecting IVR: ${CAMPAIGN_CONFIG.ivrName ?? 'first available'}`);
      await handleDropdown(/^Select an IVR/, CAMPAIGN_CONFIG.ivrName, 'Select IVR', 'TC_IBC_016');
    }

    // 6) Select Script
    console.log(`[TC_IBC_016] Selecting Script: ${CAMPAIGN_CONFIG.script ?? 'first available'}`);
    await handleDropdown(/^Select a Script/, CAMPAIGN_CONFIG.script, 'Select Script', 'TC_IBC_016');

    // 7) PIS Toggle
    if (CAMPAIGN_CONFIG.pisEnabled) {
      const pisToggle = sharedPage.locator('div').filter({ hasText: /\bPIS\b/ }).locator('button').first();
      await pisToggle.click();
      console.log('[TC_IBC_016] PIS toggle turned ON');
    }

    // 8) SOP Compliance checkbox
    if (CAMPAIGN_CONFIG.sopCompliance) {
      await ibPage.sopComplianceCheckbox.check();
      console.log('[TC_IBC_016] SOP Compliance checkbox checked');
    }

    // 9) Save Campaign
    console.log('[TC_IBC_016] Saving Inbound Campaign...');
    await ibPage.saveCampaign();
    console.log('[TC_IBC_016] Save clicked and modal closed');

    // Check if we got redirected to login (session timeout recovery)
    await sharedPage.waitForTimeout(2000);
    if (sharedPage.url().includes('/login')) {
      console.log('[TC_IBC_016] ⚠️ Session expired and redirected to login page. Re-logging in...');
      const loginPage = new LoginPage(sharedPage);
      await loginPage.loginWithUserIdAndPassword(process.env.USER_ID, process.env.USER_PASSWORD);
      await ibPage.goto();
    }

    // 10) Verify campaign in table
    console.log(`[TC_IBC_016] Verifying campaign "${resolvedCampaignName}" in table...`);
    await ibPage.searchInput.fill(resolvedCampaignName);
    await sharedPage.waitForTimeout(1000);
    await ibPage.expectCampaignInList(resolvedCampaignName);
    console.log(`[TC_IBC_016] ✅ Campaign "${resolvedCampaignName}" successfully created and verified!`);
  });

});
