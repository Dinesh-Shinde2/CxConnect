const { test, expect } = require('../../../src/fixtures/baseFixture');
const fs = require('fs');
const path = require('path');

test.use({ storageState: 'playwright/.auth/user.json' });

const sessionStoragePath = path.resolve(__dirname, '../../../playwright/.auth/sessionStorage.json');
let sessionStorageData = '{}';
try {
  sessionStorageData = fs.readFileSync(sessionStoragePath, 'utf-8');
} catch (e) {}

test('Diagnostic | Print property panel aside HTML', async ({ page }) => {
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

  // Click Menu 1 node to open panel
  console.log('Clicking Menu 1...');
  const menuNode = page.locator('.react-flow__node:has-text("Menu 1")').first();
  await menuNode.click();
  await page.waitForTimeout(2000);

  // Print HTML of the aside or property panel container
  const aside = page.locator('aside, div[class*="panel"], div[class*="properties"]').first();
  const asideHTML = await aside.innerHTML().catch(() => 'NOT FOUND');
  console.log('--- ASIDE CONTAINER HTML ---');
  console.log(asideHTML);
  console.log('---------------------------');
});
