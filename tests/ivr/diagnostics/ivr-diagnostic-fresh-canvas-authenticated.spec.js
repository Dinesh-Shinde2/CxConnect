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

test('Diagnostic | Verify fresh IVR canvas node count', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.evaluate((sessionData) => {
    const data = JSON.parse(sessionData);
    for (const [key, value] of Object.entries(data)) {
      sessionStorage.setItem(key, value);
    }
  }, sessionStorageData);

  await page.goto('/app/master/ivr');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Click New IVR
  console.log('Creating fresh IVR...');
  const createBtn = page.locator('button:has-text("New IVR")').first();
  await createBtn.click();
  await page.waitForTimeout(1000);

  const rand = Math.floor(1000 + Math.random() * 9000);
  const name = `FreshIVR_${rand}`;
  await page.locator('input[placeholder="Enter Call Flow name"], input[name="name"], input[placeholder="Enter Name"]').first().fill(name);
  await page.locator('button[type="submit"], button:has-text("Confirm"), button:has-text("Create"), button:has-text("Add")').first().click();
  await page.waitForTimeout(2000);

  // Open the newly created IVR
  console.log('Opening fresh IVR canvas...');
  const nameLink = page.locator(`tr:has-text("${name}") td, tr:has-text("${name}") a`).filter({ hasText: name }).first();
  await nameLink.click();
  await page.waitForURL(/\/app\/master\/ivr-designer\//, { timeout: 15000 });
  await page.waitForTimeout(3000);

  const nodeCount = await page.locator('.react-flow__node').count();
  console.log(`--- FRESH CANVAS NODE COUNT: ${nodeCount} ---`);
  const nodes = page.locator('.react-flow__node');
  for (let i = 0; i < nodeCount; i++) {
    const text = await nodes.nth(i).innerText();
    console.log(`Node [${i}]: ${text.replace(/\n/g, ' ')}`);
  }
  console.log('---------------------------------------------');
});
