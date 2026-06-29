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

test('Diagnostic | Inspect dropdown list container elements', async ({ page }) => {
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

  // Run JS to find elements at the root level of body that appeared and contain the options
  const bodyChildren = await page.evaluate(() => {
    // Find all direct children of body or modal-root
    const roots = Array.from(document.querySelectorAll('body > div, #modal-root > div'));
    return roots.map(el => ({
      tag: el.tagName,
      className: el.className,
      id: el.id,
      style: el.getAttribute('style'),
      outerHtmlExcerpt: el.outerHTML.substring(0, 1000)
    }));
  });

  console.log('--- BODY/MODAL-ROOT LEVEL DIVS AFTER CLICK ---');
  console.log(JSON.stringify(bodyChildren, null, 2));
  console.log('----------------------------------------------');
});
