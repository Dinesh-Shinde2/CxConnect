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

test('Diagnostic | Inspect Canvas Nodes Text & Attributes', async ({ page }) => {
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

  // Print class and innerText of all nodes on canvas
  const nodes = page.locator('.react-flow__node');
  const count = await nodes.count();
  console.log(`Total nodes on canvas: ${count}`);
  for (let i = 0; i < count; i++) {
    const node = nodes.nth(i);
    const text = await node.innerText();
    const className = await node.getAttribute('class');
    const dataId = await node.getAttribute('data-id');
    console.log(`Node [${i}]: id="${dataId}", class="${className}", text="${text.replace(/\n/g, ' ')}"`);
  }
});
