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

test('Diagnostic | Inspect Edge Group Attributes', async ({ page }) => {
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

  // Print all attributes of the edge group elements
  const edges = page.locator('.react-flow__edge');
  const count = await edges.count();
  console.log(`Total edges: ${count}`);
  for (let i = 0; i < count; i++) {
    const edge = edges.nth(i);
    const attrs = await edge.evaluate(el => {
      const result = {};
      for (const attr of el.attributes) {
        result[attr.name] = attr.value;
      }
      return result;
    });
    console.log(`Edge [${i}] attributes:`, JSON.stringify(attrs));
  }
});
