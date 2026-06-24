/**
 * Campaign Creation E2E Flow Test
 *
 * Complete flow:
 * 1) Login with User ID + Password
 * 2) Navigate to Contact List page via direct URL
 * 3) Click "New List" button
 * 4) Fill contact list name, search & add 5 contacts
 * 5) Save by clicking footer "Add"
 * 6) Navigate to Campaign Manager > Outbound
 * 7) Click "+ New Campaign"
 * 8) Fill all mandatory fields and save
 * 9) Verify campaign appears in list
 *
 * Selectors confirmed from live DOM screenshots:
 *   - New List btn:     button with text "New List" (exact)
 *   - Name input:       input[placeholder="Enter a Name"]
 *   - Search leads:     input[placeholder="Search leads by ID, Name or Phone"]
 *   - Add lead btn:     button 'Add' inside a table row  
 *   - Cancel/Add (footer): the Cancel & Add buttons at the bottom of the modal
 */

const { test, expect } = require('../fixtures/baseFixture');
const { CampaignPage } = require('../pages/CampaignPage');

test.describe('Campaign E2E Creation Flow', () => {
  test.describe.configure({ mode: 'serial', retries: 0 });

  test('E2E_CAMP_001 | Complete Campaign Creation Flow', async ({ loginPage, page }) => {
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

    // Confirm modal opened by waiting for "Enter a Name" placeholder
    const nameInput = page.locator('input[placeholder="Enter a Name"]');
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ "Add New Contact List" modal is open');

    // ── STEP 7: Fill contact list name ────────────────────────────────────────
    const uniqueListName = 'AutoList' + Date.now();
    console.log(`[Step 7] Contact list name: "${uniqueListName}"`);
    await nameInput.fill(uniqueListName);

    // ── STEP 7b: Search and add 5 contacts ────────────────────────────────────
    // The search is a combobox — clicking opens <input>, Escape closes it.
    // Strategy: keep it open between contacts; if it closes after Add, reopen by clicking the placeholder.
    const searchInput = page.locator('input[placeholder="Search leads by ID, Name or Phone"]');
    // The visible trigger when the combobox is closed (shows placeholder text)
    const searchTrigger = page.locator('text=Search leads by ID, Name or Phone').first();
    const contacts = ['dinesh shinde', 'mrinal patil', 'vipul data', 'gopal verma', 'vivek gangani'];

    for (const contact of contacts) {
      console.log(`Searching for: "${contact}"...`);

      // Open combobox if input not visible
      if (!await searchInput.isVisible()) {
        // Click the visible placeholder text to reopen
        if (await searchTrigger.isVisible()) {
          await searchTrigger.click();
        } else {
          // Fallback: click anywhere in the Add Leads section area
          await page.locator('text=Add Leads').click();
        }
        await page.waitForTimeout(500);
      }

      await searchInput.waitFor({ state: 'visible', timeout: 10000 });
      await searchInput.fill('');
      await searchInput.type(contact, { delay: 60 });
      await page.waitForTimeout(2000); // Wait for API results

      // If >1 "Add" buttons: first ones are row-level, last is footer
      const addButtons = page.getByRole('button', { name: 'Add', exact: true });
      const buttonCount = await addButtons.count();

      if (buttonCount > 1) {
        await addButtons.first().click({ force: true });
        await page.waitForTimeout(800);
        console.log(`  ✅ Added: "${contact}"`);
      } else if (buttonCount === 1) {
        // Check if result row exists (vs just the footer Add)
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

      // Just clear the text — do NOT press Escape (it would collapse the combobox)
      await searchInput.fill('');
      await page.waitForTimeout(400);
    }

    // ── STEP 8: Save contact list (footer Add) ────────────────────────────────
    console.log('[Step 8] Saving contact list...');
    // Click the name input to steal focus from the search combobox — this closes
    // the dropdown WITHOUT closing the modal (Escape closes the entire modal).
    await nameInput.click();
    await page.waitForTimeout(600);

    // The footer Add button is the LAST one (larger: px-4 py-2 vs row-level px-3 py-1.5)
    await page.getByRole('button', { name: 'Add', exact: true }).last().click();
    await page.waitForTimeout(3000);

    // Verify in table
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
    const campaignPage = new CampaignPage(page);
    await campaignPage.openAddCampaignModal();
    console.log('✅ Modal open');

    // ── STEP 12: Fill all mandatory campaign fields ───────────────────────────
    const uniqueCampaignName = 'AutoCamp' + Math.floor(Math.random() * 99999);
    console.log(`[Step 12] Campaign name: "${uniqueCampaignName}"`);
    await campaignPage.enterCampaignName(uniqueCampaignName);
    await page.waitForTimeout(500);

    // Campaign Mode → Preview
    console.log('  → Mode: Preview');
    await campaignPage.selectDropdownOption(campaignPage.campaignModeDropdown, 'Preview');
    await page.waitForTimeout(800);

    // Contact List → newly created list
    console.log(`  → Contact List: "${uniqueListName}"`);
    await campaignPage.selectDropdownOption(campaignPage.contactListDropdown, uniqueListName);
    await page.waitForTimeout(800);

    // Caller ID → first available option
    console.log('  → Caller ID...');
    await campaignPage.callerIdDropdown.click();
    await page.waitForTimeout(1200);
    const firstCallerOption = page.locator('li.flex.items-center.gap-3').first();
    if (await firstCallerOption.count() > 0) {
      const callerText = await firstCallerOption.textContent();
      console.log(`     Picked: "${callerText.trim()}"`);
      await firstCallerOption.click({ force: true });
    }
    await page.waitForTimeout(800);

    // Queue → first available option
    console.log('  → Queue...');
    await campaignPage.queueDropdown.click();
    await page.waitForTimeout(1200);
    const firstQueueOption = page.locator('li.flex.items-center.gap-3').first();
    if (await firstQueueOption.count() > 0) {
      const queueText = await firstQueueOption.textContent();
      console.log(`     Picked: "${queueText.trim()}"`);
      await firstQueueOption.click({ force: true });
    }
    await page.waitForTimeout(800);

    // Dial Ratio → first available option (mandatory field present in CampaignPage)
    // Only click and select if Dial Ratio is enabled (it is disabled in Preview mode)
    const dialRatioVisible = await campaignPage.dialRatioDropdown.isVisible().catch(() => false);
    const dialRatioEnabled = dialRatioVisible && await campaignPage.dialRatioDropdown.isEnabled().catch(() => false);
    if (dialRatioEnabled) {
      console.log('  → Dial Ratio...');
      await campaignPage.dialRatioDropdown.click();
      await page.waitForTimeout(1000);
      const firstDialOption = page.locator('li.flex.items-center.gap-3, li[class*="option"], [role="option"]').first();
      if (await firstDialOption.count() > 0) {
        const dialText = await firstDialOption.textContent();
        console.log(`     Picked: "${dialText.trim()}"`);
        await firstDialOption.click({ force: true });
      }
      await page.waitForTimeout(800);
    }

    // Retries — use CampaignPage's proper locator
    console.log('  → Retries: 3');
    const retriesVisible = await campaignPage.retriesInput.isVisible().catch(() => false);
    if (retriesVisible) {
      await campaignPage.retriesInput.fill('3');
    }
    await page.waitForTimeout(400);

    // Max Wait Time — use CampaignPage's proper locator
    console.log('  → Max Wait Time: 30');
    const maxWaitVisible = await campaignPage.maxWaitTimeInput.isVisible().catch(() => false);
    if (maxWaitVisible) {
      await campaignPage.maxWaitTimeInput.fill('30');
    }
    await page.waitForTimeout(400);

    // DND Check → No
    console.log('  → DND Check: No');
    await campaignPage.selectDropdownOption(campaignPage.dndCheckDropdown, 'No');
    await page.waitForTimeout(800);

    // ── Diagnostic screenshot before saving ───────────────────────────────────
    await page.screenshot({ path: 'before-campaign-add.png' });

    // Log whether the Add button is enabled
    const isDisabled = await page.getByRole('button', { name: 'Add', exact: true }).last().getAttribute('disabled');
    console.log(`[DEBUG] Add button disabled attribute: ${isDisabled}`);
    if (isDisabled !== null) {
      console.warn('⚠️  Add button is still DISABLED — dumping all visible form inputs:');
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

    // ── SAVE CAMPAIGN ─────────────────────────────────────────────────────────
    console.log('[Save] Clicking last Add button...');
    await page.getByRole('button', { name: 'Add', exact: true }).last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // ── VERIFY ────────────────────────────────────────────────────────────────
    console.log('Verifying campaign in table...');
    await campaignPage.expectCampaignInList(uniqueCampaignName);
    console.log(`🎉 Campaign "${uniqueCampaignName}" created and verified!`);
  });
});
