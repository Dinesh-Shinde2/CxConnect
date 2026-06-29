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

test('Diagnostic | Inspect All Handles in DOM', async ({ page }) => {
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

  // Print all elements matching [class*="handle"]
  const handles = page.locator('[class*="handle"]');
  const count = await handles.count();
  console.log(`Total handle-like elements: ${count}`);
  for (let i = 0; i < count; i++) {
    const handle = handles.nth(i);
    const tagName = await handle.evaluate(el => el.tagName);
    const className = await handle.getAttribute('class');
    const dataId = await handle.getAttribute('data-id');
    const text = await handle.innerText();
    console.log(`Handle [${i}]: tag="${tagName}", data-id="${dataId}", class="${className}", text="${text.trim()}"`);
  }
});
