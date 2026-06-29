const { test, expect } = require('../src/fixtures/baseFixture');
const fs = require('fs');
const path = require('path');

test.use({ storageState: 'playwright/.auth/user.json' });

const sessionStoragePath = path.resolve(__dirname, '../playwright/.auth/sessionStorage.json');
let sessionStorageData = '{}';
try {
  sessionStorageData = fs.readFileSync(sessionStoragePath, 'utf-8');
} catch (e) {
  console.warn('[Warning] sessionStorage.json not found.');
}

test('Diagnostic | Find exact IVR list URL', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.evaluate((sessionData) => {
    const data = JSON.parse(sessionData);
    for (const [key, value] of Object.entries(data)) {
      sessionStorage.setItem(key, value);
    }
  }, sessionStorageData);

  console.log('Navigating to dashboard...');
  await page.goto('/app/dashboard');
  await page.waitForURL(/\/app\/dashboard/, { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Find the Call Flows (IVR) link in the sidebar DOM
  const sidebarLinks = page.locator('a');
  const count = await sidebarLinks.count();
  console.log(`Total sidebar/page links: ${count}`);
  for (let i = 0; i < count; i++) {
    const link = sidebarLinks.nth(i);
    const href = await link.getAttribute('href');
    const text = await link.innerText();
    if (text.includes('IVR') || text.includes('Flow') || (href && href.includes('ivr'))) {
      console.log(`Link [${i}]: text="${text.replace(/\n/g, ' ')}", href="${href}"`);
    }
  }

  // Click Automation / Flows to expand sidebar
  const autoFlows = page.locator('span:has-text("Automation / Flows"), button:has-text("Automation / Flows")').first();
  if (await autoFlows.count() > 0) {
    console.log('Clicking "Automation / Flows" sidebar section...');
    await autoFlows.click();
    await page.waitForTimeout(1000);

    const callFlows = page.locator('span:has-text("Call Flows (IVR)"), a:has-text("Call Flows (IVR)")').first();
    if (await callFlows.count() > 0) {
      console.log('Clicking "Call Flows (IVR)"...');
      await callFlows.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      console.log('URL after clicking sidebar Call Flows (IVR):', page.url());
    } else {
      console.log('Could not find Call Flows (IVR) sub-link');
    }
  } else {
    console.log('Could not find Automation / Flows sidebar expander');
  }
});
