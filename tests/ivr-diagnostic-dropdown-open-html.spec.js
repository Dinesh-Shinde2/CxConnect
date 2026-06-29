const { test } = require('../src/fixtures/baseFixture');
const fs = require('fs');
const path = require('path');

test.use({ storageState: 'playwright/.auth/user.json' });

const sessionStoragePath = path.resolve(__dirname, '../playwright/.auth/sessionStorage.json');
let sessionStorageData = '{}';
try { sessionStorageData = fs.readFileSync(sessionStoragePath, 'utf-8'); } catch (e) {}

test('Diagnostic | Inspect open dropdown HTML structure', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.evaluate((sd) => {
    const data = JSON.parse(sd);
    for (const [k, v] of Object.entries(data)) sessionStorage.setItem(k, v);
  }, sessionStorageData);

  // Navigate to a known existing IVR designer
  await page.goto('/app/master/ivr-designer/ab35df25-ba58-4ee1-8da8-e7c7a2f9985d');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(4000);

  // Click on Play Prompt node
  const ppNode = page.locator('.react-flow__node:has-text("Play Prompt")').first();
  await ppNode.click();
  await page.waitForTimeout(2000);

  // Click the Audio File dropdown button to open it
  const audioBtn = page.locator('#audioFile').first();
  await audioBtn.waitFor({ state: 'visible', timeout: 10000 });
  await audioBtn.click();
  await page.waitForTimeout(1500);

  // Dump the right panel/aside HTML after dropdown is open
  const panelHTML = await page.locator('aside, div[class*="panel"], div[class*="properties"]').first().innerHTML().catch(() => '');
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);

  // Save to file for inspection
  const outPath = path.resolve(__dirname, '../test-results/dropdown-open-body.html');
  fs.writeFileSync(outPath, bodyHTML);
  console.log('Body HTML saved to:', outPath);

  // Also log just the section after the audio button's parent
  const audioParent = await page.locator('#audioFile').locator('xpath=..').innerHTML().catch(() => 'NOT FOUND');
  console.log('=== AUDIO BUTTON PARENT HTML ===');
  console.log(audioParent.substring(0, 3000));
  console.log('================================');

  // Look for any element that appeared after clicking (search input)
  const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
  const searchVisible = await searchInput.isVisible().catch(() => false);
  console.log('Search input visible:', searchVisible);
  if (searchVisible) {
    const searchParent = await searchInput.locator('xpath=../..').innerHTML().catch(() => 'N/A');
    console.log('=== SEARCH INPUT GRANDPARENT HTML ===');
    console.log(searchParent.substring(0, 3000));
    console.log('=====================================');
  }
});
