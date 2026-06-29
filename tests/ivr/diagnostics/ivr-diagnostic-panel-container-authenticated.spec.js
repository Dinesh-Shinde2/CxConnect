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

test('Diagnostic | Find exact Property Panel container tag & classes', async ({ page }) => {
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

  // Click Play Prompt 1 node to open panel
  console.log('Clicking Play Prompt 1...');
  const playPromptNode = page.locator('.react-flow__node:has-text("Play Prompt 1")').first();
  await playPromptNode.click();
  await page.waitForTimeout(2000);

  // Run JS in page to locate the container wrapping "Block ID"
  const containerInfo = await page.evaluate(() => {
    // Find text node containing "Block ID"
    const els = Array.from(document.querySelectorAll('*'));
    const blockIdEl = els.find(el => el.textContent === 'Block ID');
    if (!blockIdEl) return 'Block ID element not found';

    // Walk up the DOM to find the parent container that looks like a sidebar panel on the right side
    let current = blockIdEl;
    const path = [];
    while (current) {
      path.push({
        tag: current.tagName,
        className: current.className,
        id: current.id,
        style: current.getAttribute('style')
      });
      // A typical side panel might have class with width (w-96, sidebar, overflow-y, flex, etc.) or aside tag
      if (current.tagName === 'ASIDE' || (current.className && (current.className.includes('w-') || current.className.includes('sidebar') || current.className.includes('panel')) && current.offsetWidth > 200)) {
        return {
          found: true,
          matchedParent: {
            tag: current.tagName,
            className: current.className,
            outerHtml: current.outerHTML.substring(0, 2000) // first 2k chars
          },
          path
        };
      }
      current = current.parentElement;
    }
    return { found: false, path };
  });

  console.log('--- CONTAINER INFO ---');
  console.log(JSON.stringify(containerInfo, null, 2));
  console.log('----------------------');
});
