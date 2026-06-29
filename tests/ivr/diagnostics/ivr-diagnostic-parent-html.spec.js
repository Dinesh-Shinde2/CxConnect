const { test, expect } = require('../../../src/fixtures/baseFixture');
const fs = require('fs');
const path = require('path');

test.use({ storageState: 'playwright/.auth/user.json' });

const sessionStoragePath = path.resolve(__dirname, '../../../playwright/.auth/sessionStorage.json');
let sessionStorageData = '{}';
try {
  sessionStorageData = fs.readFileSync(sessionStoragePath, 'utf-8');
} catch (e) {}

test('Diagnostic | Print trigger parent HTML when dropdown is open', async ({ page }) => {
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

  // Locate the Menu Options button and click it
  console.log('Clicking Menu Options trigger...');
  const trigger = page.locator('#menuOptions').first();
  await trigger.click();
  await page.waitForTimeout(2000);

  // Print parent HTML of the trigger
  const parentHTML = await trigger.locator('xpath=../..').innerHTML();
  console.log('--- TRIGGER PARENT CONTAINER HTML ---');
  console.log(parentHTML);
  console.log('------------------------------------');
});
