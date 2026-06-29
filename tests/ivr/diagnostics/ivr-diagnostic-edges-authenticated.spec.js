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

test('Diagnostic | Inspect Canvas Edges and Handles', async ({ page }) => {
  test.setTimeout(90000);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.evaluate((sessionData) => {
    const data = JSON.parse(sessionData);
    for (const [key, value] of Object.entries(data)) {
      sessionStorage.setItem(key, value);
    }
  }, sessionStorageData);

  // Navigate to IVR list
  console.log('Navigating to IVR list...');
  await page.goto('/app/master/ivr');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Click on the first IVR row link/name
  console.log('Finding first IVR in list...');
  const firstIvrLink = page.locator('tr td a, tr td span').first();
  await firstIvrLink.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Print all elements matching [class*="handle"]
  const handles = page.locator('[class*="handle"]');
  const handleCount = await handles.count();
  console.log(`Total handle-like elements: ${handleCount}`);
  for (let i = 0; i < handleCount; i++) {
    const handle = handles.nth(i);
    const id = await handle.getAttribute('id');
    const dataId = await handle.getAttribute('data-id');
    const className = await handle.getAttribute('class');
    const innerText = await handle.innerText();
    const style = await handle.getAttribute('style');
    console.log(`Handle [${i}]: id="${id}", data-id="${dataId}", class="${className}", text="${innerText.trim()}", style="${style}"`);
  }

  // Print all edge elements attributes and text
  const edges = page.locator('.react-flow__edge');
  const edgeCount = await edges.count();
  console.log(`Total edges on canvas: ${edgeCount}`);
  for (let i = 0; i < edgeCount; i++) {
    const edge = edges.nth(i);
    const id = await edge.getAttribute('id');
    const className = await edge.getAttribute('class');
    console.log(`Edge [${i}]: id="${id}", class="${className}"`);
  }
});
