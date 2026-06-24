const { test } = require('../fixtures/baseFixture');

test('inspect dashboard sidebar and menus with direct login', async ({ loginPage, page }) => {
  // 1. Goto login
  await loginPage.goto();
  
  // 2. Login
  const userId = process.env.USER_ID || 'tena003-a15';
  const password = process.env.USER_PASSWORD || 'Mayur9898@';
  await loginPage.loginWithUserIdAndPassword(userId, password);
  
  // Wait for URL to be dashboard
  await page.waitForURL(/\/app\/dashboard/, { timeout: 30000 });
  await page.waitForTimeout(4000); // Wait for initial loads

  // Get all HTML elements on the left side
  const navHtml = await page.evaluate(() => {
    // Find the navigation container or anything styled as a sidebar
    const possibleNavs = Array.from(document.querySelectorAll('nav, [class*="nav"], [class*="sidebar"], [class*="side-bar"], [class*="aside"], [class*="left"]'));
    return possibleNavs.map((nav, idx) => ({
      index: idx,
      className: nav.className,
      id: nav.id,
      html: nav.outerHTML.substring(0, 1500)
    }));
  });

  console.log('--- DETECTED SIDEBARS ---');
  console.log(JSON.stringify(navHtml, null, 2));

  // Find all links on the dashboard
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button, [role="button"]')).map(el => {
      return {
        tag: el.tagName.toLowerCase(),
        text: el.textContent ? el.textContent.trim() : '',
        href: el.getAttribute('href') || '',
        class: el.className || '',
        id: el.id || '',
        ariaExpanded: el.getAttribute('aria-expanded') || ''
      };
    }).filter(item => item.text || item.href);
  });

  console.log('--- ALL CLICKABLE ELEMENTS ---');
  console.log(JSON.stringify(links, null, 2));

  // Take screenshot
  await page.screenshot({ path: 'dashboard-after-login-inspect.png' });
  console.log('Saved dashboard screenshot');
});
