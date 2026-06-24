# Playwright Automation Framework (JavaScript)

This repository contains a production-ready, highly scalable test automation framework using **Playwright** and **JavaScript** for a MERN stack application. It follows industry best practices, such as the Page Object Model (POM), Custom Fixtures, Environment-based Configurations, dynamic OTP handling, and polymorphic/unified test execution.

---

## 📁 Folder Structure

The directory layout is organized logically to separate concerns and support a scaling suite of tests:

```text
CxConnect/
├── fixtures/                  # Custom Playwright fixtures
│   └── baseFixture.js         # Extensions for automatically instantiating Page Objects
├── pages/                     # Page Object Models (POM) representing UI pages
│   ├── LoginPage.js           # Selectors and interactions for the Login page
│   └── DashboardPage.js       # Selectors and interactions for the Dashboard page
├── tests/                     # Test spec files
│   └── login.spec.js          # Unified login test case
├── utils/                     # Utility and helper functions
│   └── otpHelper.js           # Simulates/Fetches dynamic OTP codes
├── .env                       # Global default configurations
├── .env.prod                  # Environment configuration: Production
├── .env.qa                    # Environment configuration: QA
├── .env.uat                   # Environment configuration: UAT
├── package.json               # Dependencies, metadata, and execution scripts
├── playwright.config.js       # Playwright global configurations
└── README.md                  # Framework documentation (this file)
```

### Folder Explanations
* **`fixtures/`**: Playwright allows extending test contexts. This is used to instantiate Page Objects (`LoginPage`, `DashboardPage`) and inject them into tests. Tests do not need to perform `new LoginPage(page)` manual declarations.
* **`pages/`**: Contains the Page Object Models. Each page has a single class capturing its elements (as locators) and actions (as methods).
* **`tests/`**: Contains actual spec files. Tests remain clean of selector definitions and coordinate page actions.
* **`utils/`**: Shared functions like database queries, data generators, loggers, or OTP retrievals.

---

## ⚙️ Environment Configuration

The framework supports multiple environments (**UAT**, **QA**, **PROD**) and authentication mechanisms (**Password** vs **OTP**) via environment variables.

### Environment Selection
The environment is selected by setting `TEST_ENV` (defaults to `uat`). Playwright will load:
1. `.env.${TEST_ENV}` (e.g. `.env.uat`)
2. `.env` (global defaults)

### Authentication Selection
The login type is selected via `LOGIN_TYPE` environment variable:
* `LOGIN_TYPE=password`: Runs the User ID + Password login flow.
* `LOGIN_TYPE=otp`: Runs the Email + OTP login flow.

---

## 🔐 Unified Login Pattern

To ensure the **same test runs both login methods without code changes**, we implement a routing/polymorphic layer inside `LoginPage.js`. 

The test case is written abstractly:
```javascript
test('Verify login', async ({ loginPage, dashboardPage }) => {
  await loginPage.login(credentials, OtpHelper.getDynamicOTP);
  await dashboardPage.expectDashboardLoaded();
});
```

Internally, `LoginPage.js` evaluates `process.env.LOGIN_TYPE` and branches:
```javascript
async login(credentials, fetchOtpCallback) {
  const loginType = (process.env.LOGIN_TYPE || 'password').toLowerCase();
  if (loginType === 'otp') {
    await this.loginWithEmailOTP(credentials.email, fetchOtpCallback);
  } else {
    await this.loginWithUserIdAndPassword(credentials.userId, credentials.password);
  }
}
```

---

## 🏷️ Naming Conventions

Adhering to strict naming conventions ensures codebase readability and consistency:

1. **Files**:
   * **Page Objects**: PascalCase suffixing page name (`LoginPage.js`, `DashboardPage.js`).
   * **Specs**: kebab-case or dot-notation ending with `.spec.js` (`login.spec.js`, `create-campaign.spec.js`).
   * **Fixtures / Utilities**: camelCase (`baseFixture.js`, `otpHelper.js`).

2. **Locators & Variables**:
   * **Locators**: camelCase suffixing the control type (`emailInput`, `loginButton`, `errorMessage`).
   * **Variables**: camelCase (`loginType`, `credentials`).

3. **Classes & Methods**:
   * **Classes**: PascalCase (`LoginPage`, `OtpHelper`).
   * **Methods**: camelCase describing the action (`goto`, `loginWithEmailOTP`, `expectLoginSuccess`).

---

## 🚀 Commands to Execute Tests

To run tests against different environments and authentication modes, use the pre-configured NPM scripts or raw commands:

### UAT Environment (Default)
* **Run Password Login**:
  ```bash
  npm run test:uat:password
  ```
* **Run OTP Login**:
  ```bash
  npm run test:uat:otp
  ```

### QA Environment
* **Run Password Login**:
  ```bash
  npm run test:qa:password
  ```
* **Run OTP Login**:
  ```bash
  npm run test:qa:otp
  ```

### Production Environment
* **Run Password Login**:
  ```bash
  npm run test:prod:password
  ```
* **Run OTP Login**:
  ```bash
  npm run test:prod:otp
  ```

### General / Debug Commands
* **Run in Headed Mode**:
  ```bash
  npx playwright test --headed
  ```
* **Run in Playwright UI Mode**:
  ```bash
  npx playwright test --ui
  ```
* **Show HTML Report**:
  ```bash
  npm run report
  ```

---

## 📈 Scalability Recommendations

For a MERN stack application, as the automation suite grows to hundreds of tests, implement the following architected strategies:

1. **Storage State & Authentication Sharing**:
   * Use a global authentication setup (via Playwright projects) to log in once at the start of execution, write cookies and storage state to a JSON file (e.g. `playwright/.auth/user.json`), and reuse that state across all specs. This reduces execution times by avoiding logging in before every single test.

2. **API-Based Seeding (No UI Dependency)**:
   * To test features like Campaign Management or IVR routing, do not create prerequisite data (users, campaigns) via the UI. Seed them by executing API requests inside a `beforeAll` block, then run the UI test, and delete them via API in `afterAll`.

3. **Database Helper integration**:
   * Connect to the MongoDB (or PostgreSQL) backend directly from test hooks (e.g. via `mongoose` or `pg` clients) to inspect DB state for validations (like checking if a SMS notification was logged in the collection) or cleaning up test artifacts.

4. **Dynamic Data Generation**:
   * Use libraries like `@faker-js/faker` to generate unique names, emails, and phone numbers. This prevents test collisions when running specs in parallel.

5. **Parallelism & Sharding**:
   * Configure `fullyParallel: true` in `playwright.config.js`. When executing in a CI pipeline (GitHub Actions, GitLab CI), shard the tests across multiple runners (e.g., `playwright test --shard=1/3`) to scale compute and minimize build duration.
