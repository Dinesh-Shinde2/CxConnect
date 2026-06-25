# 🚀 Playwright Automation Framework — CX-Connect

This repository contains a production-ready, highly optimized, and scalable test automation framework using **Playwright** and **JavaScript** for the **CX-Connect** platform. 

It is architected using best-in-class automation patterns, including the **Page Object Model (POM)**, **Custom Fixtures**, **Shared Authentication Session State (Login Once)**, and **Environment-driven Multi-mode execution**.

---

## 📁 Clean Directory Structure

The repository is structured to maintain a strict separation of concerns, keeping test specs clean, readable, and highly maintainable:

```text
CxConnect/
├── src/                                # Framework Core Source
│   ├── fixtures/                       # Custom Playwright Fixtures
│   │   └── baseFixture.js              # Page Object pre-instantiation & injection
│   ├── pages/                          # Page Object Models (POM) representing application screens
│   │   ├── LoginPage.js
│   │   ├── DashboardPage.js
│   │   ├── CampaignPage.js
│   │   └── ContactListPage.js
│   ├── utils/                          # Common Helper Utilities
│   │   └── otpHelper.js
│   └── constants/                      # Static Application constants, routes & configurations
│       └── config.js                   # Application-wide static values & select dropdown options
├── tests/                              # Spec execution files grouped by application modules
│   ├── setup/                          # Global setup & state initialization
│   │   └── auth.setup.js
│   ├── auth/                           # Authentication testing suite
│   │   ├── login.spec.js
│   │   ├── password-login.spec.js
│   │   └── otp-login.spec.js
│   ├── dashboard/                      # Dashboard testing suite
│   │   └── dashboard-authenticated.spec.js
│   └── campaign/                       # Campaign management testing suite
│       ├── campaign.spec.js
│       └── campaign-creation-flow.spec.js
├── .env.example                        # Template for configuring local environments
├── package.json                        # Scripts, dependencies, and project metadata
├── playwright.config.js                # Global Playwright configuration and project engines
└── README.md                           # Framework documentation (this file)
```

---

## ⚙️ Environment & Authentication Configuration

The framework supports multiple environments (**UAT**, **QA**, **Production**) and authentication modes (**Password** vs **OTP**) via environment variables.

### Local Configuration Setup
1. Copy the `.env.example` file to create your environment-specific files:
   * `.env.uat` (for UAT environment)
   * `.env.qa` (for QA environment)
   * `.env.prod` (for Production environment)
2. Fill in the values for the respective environment:
   ```env
   TEST_ENV=uat
   BASE_URL=https://uat.ishancxconnect.com
   USER_ID=your_username
   USER_PASSWORD=your_password
   ADMIN_EMAIL=your_email@yopmail.com
   ```

### Mode Switching
* **`TEST_ENV`**: Determines which file (`.env.uat`, `.env.qa`, or `.env.prod`) is loaded.
* **`LOGIN_TYPE`**: Selects the login route:
  * `LOGIN_TYPE=password`: Runs User ID + Password login.
  * `LOGIN_TYPE=otp`: Runs Email + OTP login.

---

## 🔐 Session Sharing Strategy (Login Once)

To avoid logging in before every single test case—which causes test suites to run slowly and increases flakiness—we implement Playwright's `storageState` session-caching:

```
                      ┌─────────────────────────────────────────┐
                      │        npm run test:authenticated       │
                      └────────────────────┬────────────────────┘
                                           │
                                ┌──────────▼──────────┐
                                │   [setup] project   │
                                │    auth.setup.js    │
                                │   ───────────────   │
                                │   1. Goto /login    │
                                │   2. Fill User ID   │
                                │   3. Fill Password  │
                                │   4. Verify Login   │
                                │   5. Save state to  │
                                │     .auth/user.json │
                                └──────────┬──────────┘
                                           │  (Runs ONCE)
                 ┌─────────────────────────▼──────────────────────────────┐
                 │          [chromium-authenticated] project               │
                 │         Loads storageState from .auth/user.json        │
                 │   ──────────────────────────────────────────────────   │
                 │    Runs all tests directly on the authenticated state  │
                 │    without visiting the login page again.              │
                 └────────────────────────────────────────────────────────┘
```

* **`tests/setup/auth.setup.js`** logs in using your configured credentials and saves cookies/localStorage into `playwright/.auth/user.json` (which is excluded from Git).
* Authenticated specs load this state using `test.use({ storageState: 'playwright/.auth/user.json' })`.

---

## 🚀 Execution Commands

Pre-configured execution commands are available in [package.json](file:///c:/Users/Ishan/Desktop/CxConnect/package.json):


### npx playwright test

### Password Login Tests
Run direct password-based login tests in headed/headless/specific browsers:
```bash
# Run headless password login tests
npm run test:login:password

# Run headed password login tests
npm run test:login:password:headed

# Run Chromium-only password login tests
npm run test:login:password:chromium
```

### OTP Login Tests
Run email OTP-based login tests:
```bash
# Run headless OTP login tests
npm run test:login:otp

# Run headed OTP login tests
npm run test:login:otp:headed
```

### Unified Login Tests (Environment Driven)
Test the polymorphic login flow across different targets:
```bash
# UAT Environment
npm run test:uat:password
npm run test:uat:otp

# QA Environment
npm run test:qa:password
npm run test:qa:otp

# Production Environment
npm run test:prod:password
npm run test:prod:otp
```

### Authenticated Suite (Using cached session)
Run tests that bypass the login screen completely and start directly on the authenticated dashboard:
```bash
# Run authenticated suite in headless mode
npm run test:authenticated

# Run authenticated suite in headed mode
npm run test:authenticated:headed

# Run authenticated suite in Playwright Interactive UI Mode
npm run test:authenticated:ui
```

### Campaign Suite
```bash
# Run campaign tests
npm run test:campaign

# Run campaign tests in headed mode
npm run test:campaign:headed

# Run campaign tests in Playwright Interactive UI Mode
npm run test:campaign:ui
```

### General / Report Commands
```bash
# View last execution HTML report
npm run report
```

---

## 🛠️ Framework Implementation Standards

### 1. Custom Fixtures (`src/fixtures/baseFixture.js`)
Instead of manually instantiating page models in every test case:
```javascript
// Before
const loginPage = new LoginPage(page);
```
We use custom fixtures so Page Objects are automatically initialized and passed as arguments directly to tests:
```javascript
// Inside tests
test('Verify Dashboard widgets', async ({ loginPage, dashboardPage }) => {
  await loginPage.goto();
  // ...
});
```

### 2. Strict Naming Conventions
* **Page Object files**: Suffix with `Page.js` (e.g. `LoginPage.js`).
* **Specs files**: Suffix with `.spec.js` (e.g. `campaign.spec.js`).
* **Locator variables**: camelCase suffixed by control type (e.g. `emailInput`, `submitButton`, `campaignNameField`).
* **Actions/Methods**: camelCase describing actions (e.g. `goto()`, `loginWithCredentials()`, `createCampaign()`).

### 3. Scalability Best Practices
* **API Seeding**: Avoid navigating the UI to create preconditions (e.g. creating test contacts or mock campaigns). Use backend API calls inside `test.beforeAll` to seed data and `test.afterAll` to clean up.
* **No Hardcoded Sleep Timeouts**: Avoid using `page.waitForTimeout()`. Instead, prefer locator-based assertions like `locator.waitFor({ state: 'visible' })` or `expect(locator).toBeVisible()`.
* **Parallelism**: The configuration is optimized to run test files concurrently. Ensure test cases remain independent of one another.
