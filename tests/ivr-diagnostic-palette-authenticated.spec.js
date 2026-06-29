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

test('Diagnostic | Inspect Block Palette DOM', async ({ page }) => {
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

  // Locate the sidebar area
  const sidebar = page.locator('aside, .sidebar, div.border-r').first();
  console.log('Sidebar inner text excerpt:');
  console.log((await sidebar.innerText())?.substring(0, 1000));

  // Find all child div elements in sidebar that have text 'Play Prompt'
  const playPromptElements = page.locator('div:has-text("Play Prompt"), p:has-text("Play Prompt"), span:has-text("Play Prompt"), button:has-text("Play Prompt")');
  const count = await playPromptElements.count();
  console.log(`Total elements with "Play Prompt": ${count}`);
  
  for (let i = 0; i < count; i++) {
    const el = playPromptElements.nth(i);
    const tagName = await el.evaluate(e => e.tagName);
    const className = await el.getAttribute('class');
    const draggable = await el.getAttribute('draggable');
    const outerHtml = await el.evaluate(e => e.outerHTML);
    console.log(`Element [${i}]: tag=${tagName}, class="${className}", draggable=${draggable}`);
    console.log(`HTML: ${outerHtml.substring(0, 300)}`);
    console.log('---');
  }
});
