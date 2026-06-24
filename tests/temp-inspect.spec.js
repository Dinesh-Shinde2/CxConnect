const { test } = require('../fixtures/baseFixture');

test('inspect contact list page elements', async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.loginWithUserIdAndPassword(process.env.USER_ID || 'tena003-a15', process.env.USER_PASSWORD || 'Mayur9898@');
  await page.waitForURL(/\/app\/dashboard/, { timeout: 30000 });
  await page.waitForTimeout(2000);

  // Navigate to contact-list directly
  await page.goto('/app/master/contact-list');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(4000);

  console.log('Landed URL:', page.url());

  // Dump all button texts and link texts
  const elements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button, h1, h2, h3, [role="button"]')).map(el => {
      return {
        tag: el.tagName.toLowerCase(),
        text: el.textContent ? el.textContent.trim() : '',
        href: el.getAttribute('href') || '',
        class: el.className || '',
        id: el.id || ''
      };
    }).filter(item => item.text || item.href);
  });

  console.log('--- CONTACT LIST PAGE ELEMENTS ---');
  console.log(JSON.stringify(elements, null, 2));
  console.log('-----------------------------------');
  
  // Take screenshot
  await page.screenshot({ path: 'contact-list-inspect.png' });
  console.log('Saved contact-list screenshot');
});
