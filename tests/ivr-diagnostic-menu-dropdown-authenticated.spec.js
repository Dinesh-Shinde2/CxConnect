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

test('Diagnostic | Inspect Menu Options Dropdown Options list', async ({ page }) => {
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

  // Locate all list elements or overlay items on the page
  const overlayItems = page.locator('[role="listbox"] *, [class*="option"] *, ul *');
  const count = await overlayItems.count();
  console.log(`Total overlay child elements: ${count}`);
  for (let i = 0; i < count; i++) {
    const item = overlayItems.nth(i);
    const text = await item.innerText();
    const tagName = await item.evaluate(e => e.tagName);
    const className = await item.getAttribute('class');
    console.log(`Overlay Element [${i}]: tag=${tagName}, class="${className}", text="${text.replace(/\n/g, ' ')}"`);
  }

  // Let's also print all active options text directly on the body to see where they are
  const allDivs = page.locator('div');
  const divCount = await allDivs.count();
  console.log('Searching all divs on page for digit options...');
  for (let i = 0; i < divCount; i++) {
    const div = allDivs.nth(i);
    const classVal = await div.getAttribute('class');
    const text = await div.innerText();
    if (classVal && (classVal.includes('option') || classVal.includes('menu') || classVal.includes('select')) && (text === '1' || text === '2' || text === '3')) {
      console.log(`Div Option [${i}]: class="${classVal}", text="${text}"`);
    }
  }
});
