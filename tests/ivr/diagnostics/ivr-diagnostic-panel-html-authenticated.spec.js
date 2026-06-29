const { test, expect } = require('../../../src/fixtures/baseFixture');
const fs = require('fs');
const path = require('path');

test.use({ storageState: 'playwright/.auth/user.json' });

const sessionStoragePath = path.resolve(__dirname, '../../../playwright/.auth/sessionStorage.json');
let sessionStorageData = '{}';
try {
  sessionStorageData = fs.readFileSync(sessionStoragePath, 'utf-8');
} catch (e) {
  console.warn('[Warning] sessionStorage.json not found.');
}

test('Diagnostic | Inspect Property Panel Fields HTML', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.evaluate((sessionData) => {
    const data = JSON.parse(sessionData);
    for (const [key, value] of Object.entries(data)) {
      sessionStorage.setItem(key, value);
    }
  }, sessionStorageData);

  await page.goto('/app/master/ivr-designer/ab35df25-ba58-4ee1-8da8-e7c7a2f9985d');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Click Play Prompt 1 node to open panel
  console.log('Clicking Play Prompt 1...');
  const playPromptNode = page.locator('.react-flow__node:has-text("Play Prompt 1")').first();
  await playPromptNode.click();
  await page.waitForTimeout(2000);

  // Get the property panel container
  const panel = page.locator('aside, [class*="sidebar"], [class*="panel"], [class*="property"]').first();
  const innerHtml = await panel.innerHTML();
  console.log('--- PROPERTY PANEL INNER HTML ---');
  console.log(innerHtml);
  console.log('---------------------------------');
});
