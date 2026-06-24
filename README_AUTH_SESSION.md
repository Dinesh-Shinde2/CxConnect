# 🔐 Authentication Session Strategy — CX-Connect Playwright Framework

This document explains the **shared authentication session architecture** added to the CX-Connect test framework. It covers how a single login is performed once and reused across all new test cases, the folder structure, available commands, and how to add more tests using this pattern.

---

## 🧠 Why Login Once?

Previously, every test case navigated to `/login` and logged in independently. This means:
- **3 tests = 3 full login flows**
- Slower test execution
- More flakiness due to repeated auth interactions

With shared auth session (Playwright's `storageState`):
- **Login happens exactly once** via `auth.setup.js`
- All subsequent test cases skip the login page entirely
- Cookies + localStorage are reused across tests
- Existing login tests are **untouched and still work independently**

---

## 📐 Architecture Overview

```
                   ┌─────────────────────────────────────────┐
                   │          npm run test:authenticated      │
                   └────────────────────┬────────────────────┘
                                        │
                             ┌──────────▼──────────┐
                             │  [setup] project     │
                             │  auth.setup.js       │
                             │  ──────────────────  │
                             │  1. goto /login      │
                             │  2. Enter USER_ID    │
                             │  3. Enter PASSWORD   │
                             │  4. Verify Dashboard │
                             │  5. Save storageState│
                             │     → .auth/user.json│
                             └──────────┬──────────┘
                                        │  (runs ONCE)
              ┌─────────────────────────▼──────────────────────────────┐
              │         [chromium-authenticated] project                │
              │         Loads storageState from .auth/user.json         │
              │  ──────────────────────────────────────────────────     │
              │   TC_AUTH_DASH_001 → Direct access without login        │
              │   TC_AUTH_DASH_002 → Dashboard stats cards visible      │
              │   TC_AUTH_DASH_003 → Action buttons visible             │
              └────────────────────────────────────────────────────────┘
```

---

## 📁 New Files Added

```text
CxConnect/
├── tests/
│   ├── auth.setup.js                    # 🔑 Runs login once, saves session state
│   └── dashboard-authenticated.spec.js  # ✅ New tests using shared session
├── playwright/
│   └── .auth/
│       └── user.json                    # 💾 Auto-generated session file (do NOT commit to git)
└── README_AUTH_SESSION.md               # 📄 This file
```

> **Note:** The `playwright/.auth/user.json` file is auto-generated at runtime. Make sure it is listed in `.gitignore` to avoid committing credentials.

---

## ⚙️ How It Works — Step by Step

### 1. `auth.setup.js` — The One-Time Login

```javascript
// tests/auth.setup.js
test('authenticate and save storage state', async ({ loginPage, dashboardPage, page }) => {
  await loginPage.goto();
  await loginPage.loginWithUserIdAndPassword(userId, password);
  await dashboardPage.expectDashboardLoaded();

  // Save cookies + localStorage to file
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

This runs **once** before any authenticated test case. The credentials come from your `.env.uat` file:
```env
USER_ID=tena003-a15
USER_PASSWORD=Mayur9898@
```

---

### 2. `dashboard-authenticated.spec.js` — Tests Using Shared Session

```javascript
// tests/dashboard-authenticated.spec.js

// Load the saved auth state — no login needed!
test.use({ storageState: 'playwright/.auth/user.json' });

test.beforeEach(async ({ dashboardPage }) => {
  // Goes straight to dashboard — already authenticated
  await dashboardPage.goto();
});
```

Every test in this file starts on the dashboard directly — **no login UI interaction at all**.

---

### 3. `playwright.config.js` — Project Dependencies

```javascript
projects: [
  // ── Runs first, saves session ──
  { name: 'setup', testMatch: /auth\.setup\.js/ },

  // ── Standard projects (login tests, untouched) ──
  { name: 'chromium', testIgnore: /.*-authenticated\.spec\.js/ },
  { name: 'firefox',  testIgnore: /.*-authenticated\.spec\.js/ },
  { name: 'webkit',   testIgnore: /.*-authenticated\.spec\.js/ },

  // ── Authenticated project — depends on setup ──
  {
    name: 'chromium-authenticated',
    use: { storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],
    testMatch: /.*-authenticated\.spec\.js/,
  },
]
```

---

## 🚀 Commands

### Run Authenticated Tests (Login Once → Run All New Tests)
```bash
npm run test:authenticated
```

### Run in Headed Mode (See the Browser)
```bash
npm run test:authenticated:headed
```

### Run in Playwright UI Mode (Interactive)
```bash
npm run test:authenticated:ui
```

---

## 🧪 Existing Login Tests — Unchanged

All existing tests continue to work exactly as before:

| Command | Description |
|---|---|
| `npm run test:login:password` | All password-login tests across 3 browsers |
| `npm run test:login:password:chromium` | Password login, Chromium only |
| `npm run test:login:otp` | All OTP-login tests |
| `npm run test:uat:password` | Unified login spec — password mode |
| `npm run test:uat:otp` | Unified login spec — OTP mode |
| `npm run test:smoke:password` | Smoke tests tagged `@smoke` |

---

## ➕ How to Add More Authenticated Tests

To add more test cases that reuse the same login session:

1. **Open** `tests/dashboard-authenticated.spec.js`
2. Add a new `test(...)` block inside the `test.describe` block
3. The test starts already logged in — just navigate where you need!

**Example:**
```javascript
test('TC_AUTH_DASH_004 | Verify sidebar navigation is visible', async ({ page }) => {
  // Already on dashboard, no login needed
  const sidebar = page.locator('nav, [class*="sidebar"]').first();
  await expect(sidebar).toBeVisible();
  console.log('[TC_AUTH_DASH_004] ✅ Sidebar is visible');
});
```

Or create a **new spec file** following the naming pattern `*-authenticated.spec.js`:
```text
tests/
├── campaign-authenticated.spec.js   ← Picked up automatically
├── ivr-authenticated.spec.js        ← Also picked up
└── reports-authenticated.spec.js    ← All reuse the same login session!
```

---

## 🔑 Environment Variables Used

These are loaded from `.env.uat` (or the active `TEST_ENV`):

| Variable | Purpose |
|---|---|
| `USER_ID` | Login username for password flow |
| `USER_PASSWORD` | Login password for password flow |
| `BASE_URL` | The application base URL (e.g., `https://uat.ishancxconnect.com`) |
| `TEST_ENV` | Environment selector: `uat`, `qa`, or `prod` |

---

## 🛡️ Security Note

> The `playwright/.auth/user.json` file contains session cookies and tokens. **Never commit this file to version control.**  
> Add the following to your `.gitignore`:
> ```
> playwright/.auth/
> ```
