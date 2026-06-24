/**
 * Modal Form Inspector - dumps HTML of the Add Campaign modal fields
 */
const { chromium } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.uat') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Login
  await page.goto(process.env.BASE_URL + '/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[placeholder*="user id" i], input#login-username').first().fill(process.env.USER_ID);
  await page.locator('input[type="password"]').first().fill(process.env.USER_PASSWORD);
  await page.locator('button:has-text("Login"), button[type="submit"]').first().click();
  await page.waitForURL(/\/app\/dashboard/, { timeout: 30000 });
  console.log('[Inspector] ✅ Logged in');

  // Navigate to Campaign Manager
  await page.goto(process.env.BASE_URL + '/app/campaign-manager');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log('[Inspector] URL:', page.url());

  // Click Outbound tab
  const outbound = page.getByText('Outbound', { exact: true });
  if (await outbound.isVisible()) {
    await outbound.click();
    await page.waitForTimeout(1000);
  }

  // Click + New Campaign button
  const newBtn = page.getByRole('button', { name: /new campaign/i });
  await newBtn.waitFor({ state: 'visible', timeout: 10000 });
  await newBtn.click();
  await page.waitForTimeout(2000);
  console.log('[Inspector] Clicked New Campaign button');

  // Check if modal appeared
  const modalVisible = await page.getByText('Add new Outbound Campaign').isVisible().catch(() => false);
  console.log('[Inspector] Modal visible:', modalVisible);

  if (modalVisible) {
    // Screenshot
    await page.screenshot({ path: 'playwright-modal-open.png' });
    console.log('[Inspector] Screenshot: playwright-modal-open.png');

    // Dump all visible inputs
    console.log('\n[Inspector] --- INPUTS ---');
    const inputs = await page.locator('input:visible').all();
    for (let i = 0; i < inputs.length; i++) {
      const ph = await inputs[i].getAttribute('placeholder');
      const nm = await inputs[i].getAttribute('name');
      const id = await inputs[i].getAttribute('id');
      const tp = await inputs[i].getAttribute('type');
      const cls = (await inputs[i].getAttribute('class') || '').substring(0, 80);
      console.log(`  input[${i}]: placeholder="${ph}" | name="${nm}" | id="${id}" | type="${tp}"`);
    }

    // Dump all visible dropdowns/selects
    console.log('\n[Inspector] --- REACT SELECT / DROPDOWN CONTAINERS ---');
    // React Select uses specific class names
    const reactSelects = await page.locator('[class*="react-select"], [class*="Select"], [class*="control"], [class*="dropdown"]').all();
    for (let i = 0; i < Math.min(reactSelects.length, 20); i++) {
      const text = (await reactSelects[i].textContent()).trim().substring(0, 60);
      const cls = (await reactSelects[i].getAttribute('class') || '').substring(0, 120);
      const visible = await reactSelects[i].isVisible().catch(() => false);
      if (visible && text) {
        console.log(`  dropdown[${i}]: text="${text}" | class="${cls}"`);
      }
    }

    // Dump all visible text inside the modal area
    console.log('\n[Inspector] --- ALL LABELS IN MODAL ---');
    const labels = await page.locator('label:visible, [class*="label"]:visible').all();
    for (let i = 0; i < Math.min(labels.length, 20); i++) {
      const text = (await labels[i].textContent()).trim();
      const forAttr = await labels[i].getAttribute('for');
      if (text) console.log(`  label[${i}]: "${text}" | for="${forAttr}"`);
    }

    // Dump all SVG/clickable elements with placeholder text visible
    console.log('\n[Inspector] --- PLACEHOLDER TEXTS VISIBLE ---');
    const placeholderEls = await page.locator('[class*="placeholder"]:visible').all();
    for (let i = 0; i < Math.min(placeholderEls.length, 15); i++) {
      const text = (await placeholderEls[i].textContent()).trim();
      const cls = (await placeholderEls[i].getAttribute('class') || '').substring(0, 100);
      if (text) console.log(`  placeholder[${i}]: "${text}" | class="${cls}"`);
    }

    // Dump all visible buttons in modal
    console.log('\n[Inspector] --- MODAL BUTTONS ---');
    const btns = await page.locator('button:visible').all();
    for (let i = 0; i < btns.length; i++) {
      const text = (await btns[i].textContent()).trim();
      const cls = (await btns[i].getAttribute('class') || '').substring(0, 80);
      console.log(`  btn[${i}]: "${text}" | class="${cls}"`);
    }
  }

  console.log('\n[Inspector] Waiting 15s...');
  await page.waitForTimeout(15000);
  await browser.close();
})();
