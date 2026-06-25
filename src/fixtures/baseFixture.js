const { test: base, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { CampaignPage } = require('../pages/CampaignPage');
const { ContactListPage } = require('../pages/ContactListPage');
const { InboundCampaignPage } = require('../pages/InboundCampaignPage');

/**
 * Base Playwright Test Fixture extended with POM classes.
 * Usage:
 *   const { test, expect } = require('../../src/fixtures/baseFixture');
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

  // Instantiate ContactListPage POM
  contactListPage: async ({ page }, use) => {
    const contactListPage = new ContactListPage(page);
    await use(contactListPage);
  },

  // Instantiate InboundCampaignPage POM
  inboundCampaignPage: async ({ page }, use) => {
    const inboundCampaignPage = new InboundCampaignPage(page);
    await use(inboundCampaignPage);
  },
});

module.exports = { test, expect };

