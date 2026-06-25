/**
 * Outbound Campaign E2E Creation Flow Test
 * ==========================================
 * Complete flow:
 *   1) Login with User ID + Password
 *   2) Navigate to Contact List page via direct URL
 *   3) Click "New List" button
 *   4) Fill contact list name, search & add contacts
 *   5) Save by clicking footer "Add"
 *   6) Navigate to Campaign Manager > Outbound
 *   7) Click "+ New Campaign"
 *   8) Fill all mandatory fields and save
 *   9) Verify campaign appears in list
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║            📋  OUTBOUND CAMPAIGN DATA — FILL THIS IN                ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  Edit the CAMPAIGN_CONFIG block below before running.               ║
 * ║  Each field maps 1-to-1 to the "Add new Outbound Campaign" form.    ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Run commands:
 *   npx playwright test campaign-creation-flow.spec.js --project=chromium --headed
 *
 * Credentials loaded from .env.uat:
 *   USER_ID=<your_user_id>
 *   USER_PASSWORD=<your_password>
 */

const { test, expect } = require('../../src/fixtures/baseFixture');

// ══════════════════════════════════════════════════════════════════════════════
// 📋 CAMPAIGN CONFIG — Edit values here before running this E2E test
// ══════════════════════════════════════════════════════════════════════════════
const CAMPAIGN_CONFIG = {

  // ── Contact List ──────────────────────────────────────────────────────────
  // Names of contacts to search and add to the new contact list.
  // Add or remove names as needed — each will be searched individually.
  contacts: [
    'dinesh shinde',
    'mrinal patil',
    'vipul data',
    'gopal verma',
    'vivek gangani',
  ],

  // ── Campaign Name ─────────────────────────────────────────────────────────
  // Must be unique every time (the UI rejects duplicate names).
  // 'auto' = auto-generate using random number (e.g. AutoCamp84712)
  // OR set a fixed name like: 'OBCamp01'
  campaignName: 'auto',    // ← change to 'OBCamp01' or any unique name

  // ── Campaign Mode ─────────────────────────────────────────────────────────
  // Exact label as it appears in the "Campaign mode" dropdown.
  // Common values: 'Preview', 'Progressive', 'Power'
  // null = pick first available option automatically
  campaignMode: 'Preview', // ← 'Preview' | 'Progressive' | 'Power' | null

  // ── Contact List (for campaign) ───────────────────────────────────────────
  // The contact list created above is auto-linked.
  // Set to null to let the test use the freshly created list name.
  // OR set to an existing list name: 'MyExistingList'
  contactList: null,       // ← null = use newly created list | 'ExistingListName'

  // ── Caller ID ────────────────────────────────────────────────────────────
  // Exact Caller ID as it appears in the dropdown.
  // Example: '+912269054596', '+912269054593'
  // null = pick first available option automatically
  callerId: null,          // ← e.g. '+912269054596' | null (first available)

  // ── Queue ─────────────────────────────────────────────────────────────────
  // Exact queue name as it appears in the dropdown.
  // Example: 'Camp Queue 2', '24x7 Online Support', 'Doctors Direct'
  // null = pick first available option automatically
  queue: null,             // ← e.g. 'Camp Queue 2' | null (first available)

  // ── Dial Ratio ────────────────────────────────────────────────────────────
  // Only active when Campaign Mode is NOT Preview.
  // Example: '1', '2', '3'
  // null = pick first available option automatically
  dialRatio: null,         // ← e.g. '2' | null (first available)

  // ── Retries ───────────────────────────────────────────────────────────────
  // Number of retry attempts (numeric input).
  retries: '3',            // ← any number as a string, e.g. '3'

  // ── Max Wait Time ─────────────────────────────────────────────────────────
  // Maximum wait time in seconds (numeric input).
  maxWaitTime: '30',       // ← any number as a string, e.g. '30'

  // ── DND Check ────────────────────────────────────────────────────────────
  // Exact label: 'Yes' or 'No'
  dndCheck: 'No',          // ← 'Yes' | 'No'
};
// ══════════════════════════════════════════════════════════════════════════════

// ── Resolve campaign name ─────────────────────────────────────────────────────
const resolvedCampaignName =
  CAMPAIGN_CONFIG.campaignName === 'auto'
    ? 'AutoCamp' + Math.floor(Math.random() * 99999)
    : CAMPAIGN_CONFIG.campaignName;

// ── Helper: pick first visible option from an open dropdown ──────────────────
async function pickFirstOption(page, labelText) {
  await page.waitForTimeout(1200);
  const firstOption = page.locator('li.flex.items-center.gap-3').first();
  if (await firstOption.count() > 0) {
    const text = await firstOption.textContent();
    console.log(`     Picked (first available): "${text?.trim()}"`);
    await firstOption.click({ force: true });
  } else {
    console.warn(`  ⚠️  No options found for "${labelText}"`);
  }
}

test.describe('Campaign E2E Creation Flow', () => {
  test.describe.configure({ mode: 'serial', retries: 0 });

  test('E2E_CAMP_001 | Complete Outbound Campaign Creation Flow', async ({ loginPage, campaignPage, page }) => {
    test.setTimeout(120000);

    // ── STEP 1-2: Login ──────────────────────────────────────────────────────
    console.log('[Step 1-2] Logging in...');
    await loginPage.goto();
    const userId = process.env.USER_ID;
    const password = process.env.USER_PASSWORD;
    if (!userId || !password) throw new Error('USER_ID / USER_PASSWORD not set in .env.uat');
    await loginPage.loginWithUserIdAndPassword(userId, password);
    await page.waitForURL(/\/app\/dashboard/, { timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('✅ Login successful');

    // ── STEP 3-5: Navigate to Contact List (direct URL) ──────────────────────
    console.log('[Step 3-5] Navigating to Contact List...');
    await page.goto('/app/master/contact-list');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // ── STEP 6: Click "New List" button ──────────────────────────────────────
    console.log('[Step 6] Clicking "New List" button...');
    await page.getByRole('button', { name: 'New List', exact: true }).click();
    await page.waitForTimeout(1500);

    // Confirm modal opened
    const nameInput = page.locator('input[placeholder="Enter a Name"]');
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ "Add New Contact List" modal is open');

    // ── STEP 7: Fill contact list name ────────────────────────────────────────
    const uniqueListName = 'AutoList' + Date.now();
    console.log(`[Step 7] Contact list name: "${uniqueListName}"`);
    await nameInput.fill(uniqueListName);

    // ── STEP 7b: Search and add contacts ──────────────────────────────────────
    // Contacts list comes from CAMPAIGN_CONFIG.contacts — edit that array to change who is added.
    // Strategy: keep combobox open between adds; reopen if it closes after clicking Add.
    const searchInput = page.locator('input[placeholder="Search leads by ID, Name or Phone"]');
    const searchTrigger = page.locator('text=Search leads by ID, Name or Phone').first();

    for (const contact of CAMPAIGN_CONFIG.contacts) {
      console.log(`Searching for: "${contact}"...`);

      // Open combobox if not visible
      if (!await searchInput.isVisible()) {
        if (await searchTrigger.isVisible()) {
          await searchTrigger.click();
        } else {
          await page.locator('text=Add Leads').click();
        }
        await page.waitForTimeout(500);
      }

      await searchInput.waitFor({ state: 'visible', timeout: 10000 });
      await searchInput.fill('');
      await searchInput.type(contact, { delay: 60 });
      await page.waitForTimeout(2000); // wait for API results

      const addButtons = page.getByRole('button', { name: 'Add', exact: true });
      const buttonCount = await addButtons.count();

      if (buttonCount > 1) {
        await addButtons.first().click({ force: true });
        await page.waitForTimeout(800);
        console.log(`  ✅ Added: "${contact}"`);
      } else if (buttonCount === 1) {
        const resultRow = page.locator('tr').filter({ hasText: contact.split(' ')[0] });
        if (await resultRow.count() > 0) {
          await addButtons.first().click({ force: true });
          await page.waitForTimeout(800);
          console.log(`  ✅ Added: "${contact}"`);
        } else {
          console.warn(`  ⚠️  No results for "${contact}"`);
        }
      } else {
        console.warn(`  ⚠️  No Add button found for "${contact}"`);
      }

      await searchInput.fill('');
      await page.waitForTimeout(400);
    }

    // ── STEP 8: Save contact list (footer Add) ────────────────────────────────
    console.log('[Step 8] Saving contact list...');
    // Click the name input to steal focus — closes the combobox WITHOUT closing the modal
    await nameInput.click();
    await page.waitForTimeout(600);

    // Footer Add button is the LAST one (larger padding vs row-level buttons)
    await page.getByRole('button', { name: 'Add', exact: true }).last().click();
    await page.waitForTimeout(3000);

    await expect(page.getByText(uniqueListName)).toBeVisible({ timeout: 15000 });
    console.log(`✅ Contact list "${uniqueListName}" saved and visible`);

    // ── STEP 9: Navigate to Campaign Manager ─────────────────────────────────
    console.log('[Step 9] Navigating to Campaign Manager...');
    await page.goto('/app/campaign-manager');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // ── STEP 10: Switch to Outbound tab ──────────────────────────────────────
    console.log('[Step 10] Switching to Outbound tab...');
    const outboundTab = page.getByText('Outbound', { exact: true });
    if (await outboundTab.isVisible()) {
      await outboundTab.click();
      await page.waitForTimeout(1000);
    }
    console.log('✅ On Campaign Manager > Outbound');

    // ── STEP 11: Open Add Campaign modal ─────────────────────────────────────
    console.log('[Step 11] Opening Add Campaign modal...');
    await campaignPage.openAddCampaignModal();
    console.log('✅ Modal open');

    // ── STEP 12: Fill all mandatory campaign fields ───────────────────────────
    // ── 12a: Campaign Name ────────────────────────────────────────────────────
    //   Config: CAMPAIGN_CONFIG.campaignName = 'auto' | 'OBCamp01' | ...
    console.log(`[Step 12a] Campaign name: "${resolvedCampaignName}"`);
    await campaignPage.enterCampaignName(resolvedCampaignName);
    await page.waitForTimeout(500);

    // ── 12b: Campaign Mode ────────────────────────────────────────────────────
    //   Config: CAMPAIGN_CONFIG.campaignMode = 'Preview' | 'Progressive' | 'Power' | null
    if (CAMPAIGN_CONFIG.campaignMode) {
      console.log(`  → Campaign Mode: "${CAMPAIGN_CONFIG.campaignMode}"`);
      await campaignPage.selectDropdownOption(campaignPage.campaignModeDropdown, CAMPAIGN_CONFIG.campaignMode);
    } else {
      // Pick first available mode
      console.log('  → Campaign Mode: picking first available...');
      await campaignPage.campaignModeDropdown.click();
      await pickFirstOption(page, 'Campaign Mode');
    }
    await page.waitForTimeout(800);

    // ── 12c: Contact List ─────────────────────────────────────────────────────
    //   Config: CAMPAIGN_CONFIG.contactList = null (uses newly created) | 'ExistingListName'
    const listToUse = CAMPAIGN_CONFIG.contactList ?? uniqueListName;
    console.log(`  → Contact List: "${listToUse}"`);
    await campaignPage.selectDropdownOption(campaignPage.contactListDropdown, listToUse);
    await page.waitForTimeout(800);

    // ── 12d: Caller ID ────────────────────────────────────────────────────────
    //   Config: CAMPAIGN_CONFIG.callerId = '+912269054596' | null (first available)
    //   Known UAT values: +912269054593, +912269054596, +912269054597
    console.log(`  → Caller ID: ${CAMPAIGN_CONFIG.callerId ?? '(first available)'}`);
    await campaignPage.callerIdDropdown.click();
    if (CAMPAIGN_CONFIG.callerId) {
      const callerOption = page.locator('li, div').filter({ hasText: CAMPAIGN_CONFIG.callerId }).first();
      await callerOption.waitFor({ state: 'visible', timeout: 5000 });
      await callerOption.click({ force: true });
      console.log(`     Selected: "${CAMPAIGN_CONFIG.callerId}"`);
    } else {
      await pickFirstOption(page, 'Caller ID');
    }
    await page.waitForTimeout(800);

    // ── 12e: Queue ────────────────────────────────────────────────────────────
    //   Config: CAMPAIGN_CONFIG.queue = 'Camp Queue 2' | null (first available)
    //   Known UAT values: 'Camp Queue 2', '24x7 Online Support', 'Doctors Direct'
    console.log(`  → Queue: ${CAMPAIGN_CONFIG.queue ?? '(first available)'}`);
    await campaignPage.queueDropdown.click();
    if (CAMPAIGN_CONFIG.queue) {
      const queueOption = page.locator('li, div').filter({ hasText: CAMPAIGN_CONFIG.queue }).first();
      await queueOption.waitFor({ state: 'visible', timeout: 5000 });
      await queueOption.click({ force: true });
      console.log(`     Selected: "${CAMPAIGN_CONFIG.queue}"`);
    } else {
      await pickFirstOption(page, 'Queue');
    }
    await page.waitForTimeout(800);

    // ── 12f: Dial Ratio ───────────────────────────────────────────────────────
    //   Config: CAMPAIGN_CONFIG.dialRatio = '2' | null (first available)
    //   NOTE: Dial Ratio is DISABLED when Campaign Mode = Preview
    const dialRatioVisible = await campaignPage.dialRatioDropdown.isVisible().catch(() => false);
    const dialRatioEnabled = dialRatioVisible && await campaignPage.dialRatioDropdown.isEnabled().catch(() => false);
    if (dialRatioEnabled) {
      console.log(`  → Dial Ratio: ${CAMPAIGN_CONFIG.dialRatio ?? '(first available)'}`);
      await campaignPage.dialRatioDropdown.click();
      if (CAMPAIGN_CONFIG.dialRatio) {
        const ratioOption = page.locator('li, div').filter({ hasText: CAMPAIGN_CONFIG.dialRatio }).first();
        await ratioOption.waitFor({ state: 'visible', timeout: 5000 });
        await ratioOption.click({ force: true });
      } else {
        await pickFirstOption(page, 'Dial Ratio');
      }
      await page.waitForTimeout(800);
    } else {
      console.log('  → Dial Ratio: skipped (disabled in Preview mode)');
    }

    // ── 12g: Retries ──────────────────────────────────────────────────────────
    //   Config: CAMPAIGN_CONFIG.retries = '3' | any number string
    console.log(`  → Retries: ${CAMPAIGN_CONFIG.retries}`);
    const retriesVisible = await campaignPage.retriesInput.isVisible().catch(() => false);
    if (retriesVisible) {
      await campaignPage.retriesInput.fill(CAMPAIGN_CONFIG.retries);
    }
    await page.waitForTimeout(400);

    // ── 12h: Max Wait Time ────────────────────────────────────────────────────
    //   Config: CAMPAIGN_CONFIG.maxWaitTime = '30' | any number string
    console.log(`  → Max Wait Time: ${CAMPAIGN_CONFIG.maxWaitTime} sec`);
    const maxWaitVisible = await campaignPage.maxWaitTimeInput.isVisible().catch(() => false);
    if (maxWaitVisible) {
      await campaignPage.maxWaitTimeInput.fill(CAMPAIGN_CONFIG.maxWaitTime);
    }
    await page.waitForTimeout(400);

    // ── 12i: DND Check ────────────────────────────────────────────────────────
    //   Config: CAMPAIGN_CONFIG.dndCheck = 'Yes' | 'No'
    console.log(`  → DND Check: "${CAMPAIGN_CONFIG.dndCheck}"`);
    await campaignPage.selectDropdownOption(campaignPage.dndCheckDropdown, CAMPAIGN_CONFIG.dndCheck);
    await page.waitForTimeout(800);

    // ── DEBUG: Log Add button state ───────────────────────────────────────────
    const isDisabled = await page.getByRole('button', { name: 'Add', exact: true }).last().getAttribute('disabled');
    console.log(`[DEBUG] Add button disabled: ${isDisabled}`);
    if (isDisabled !== null) {
      console.warn('⚠️  Add button is still DISABLED — dumping form values:');
      const formValues = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, select, textarea');
        return Array.from(inputs).map(el => ({
          tag: el.tagName,
          type: el.type || '',
          placeholder: el.placeholder || '',
          value: el.value || '',
          name: el.name || ''
        }));
      });
      console.log('Form inputs:', JSON.stringify(formValues, null, 2));
    }

    // ── STEP 13: Save Campaign ────────────────────────────────────────────────
    console.log('[Step 13] Clicking Add to save campaign...');
    await page.getByRole('button', { name: 'Add', exact: true }).last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // ── STEP 14: Verify campaign appears in the list ──────────────────────────
    console.log('[Step 14] Verifying campaign in table...');
    await campaignPage.expectCampaignInList(resolvedCampaignName);
    console.log(`🎉 Campaign "${resolvedCampaignName}" created and verified!`);
  });
});
