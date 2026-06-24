const { test: base, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { CampaignPage } = require('../pages/CampaignPage');

/**
 * Base Playwright Test Fixture extended with POM classes.
 * Usage:
 *   const { test, expect } = require('../fixtures/baseFixture');
 * 
 *   test('some test', async ({ loginPage, dashboardPage }) => {
 *     await loginPage.goto();
 *     ...
 *   });
 */
const test = base.extend({
  // Instantiate LoginPage POM
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  // Instantiate DashboardPage POM
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  // Instantiate CampaignPage POM
  campaignPage: async ({ page }, use) => {
    const campaignPage = new CampaignPage(page);
    await use(campaignPage);
  },
});

module.exports = { test, expect };
