# ?? CX-Connect — Complete Test Execution Commands

All commands run on **Desktop Chrome (Chromium)** with `--workers=1` (mandatory — only 1 active login session allowed per user at a time).

> [!IMPORTANT]
> **One Session Rule**: The UAT server allows **only one active session per user** at a time.
> Always use `--workers=1` to run tests sequentially and avoid login conflicts.
> Before re-running a test, ensure the previous browser window is fully closed.

---

## ?? Project Test Structure

```
tests/
+-- auth/
¦   +-- login.spec.js                   ? Authentication suite (combined)
¦   +-- password-login.spec.js          ? Password login validations (TC_PWD_001–007)
¦   +-- otp-login.spec.js               ? OTP login validations (TC_OTP_001–005)
+-- campaign/
¦   +-- campaign.spec.js                ? Outbound Campaign page tests (TC_CAMP_001–008)
¦   +-- inbound-campaign.spec.js        ? Inbound Campaign tests (TC_IBC_000–016)
¦   +-- campaign-creation-flow.spec.js  ? Outbound E2E creation flow (E2E_CAMP_001)
+-- contacts/
¦   +-- contact-creation.spec.js        ? Contact creation & access check (TC_CON_001)
+-- dashboard/
¦   +-- dashboard-authenticated.spec.js ? Authenticated dashboard tests (TC_AUTH_DASH_001–003)
+-- setup/
    +-- auth.setup.js                   ? Shared auth setup (storageState)
```

---

## ?? 1. Run by Persona — ALL Tests

Runs **every test file** in the project for the selected persona.

### ?? Admin
```powershell
$env:TEST_ENV="uat"; $env:USER_ROLE="admin"; npx playwright test --project=chromium --workers=1 --headed
```

### ?? Supervisor
```powershell
$env:TEST_ENV="uat"; $env:USER_ROLE="supervisor"; npx playwright test --project=chromium --workers=1 --headed
```

### ?? Agent
```powershell
$env:TEST_ENV="uat"; $env:USER_ROLE="agent"; npx playwright test --project=chromium --workers=1 --headed
```

---

## ?? 2. Auth / Login Tests

### All Login Tests
```powershell
$env:TEST_ENV="uat"; npx playwright test tests/auth/ --project=chromium --workers=1 --headed
```

### Password Login Only (password-login.spec.js)

| Test ID | Description |
|---|---|
| TC_PWD_001 | Valid User ID + Password ? redirects to dashboard |
| TC_PWD_002 | Dashboard shows Agents Overview stats after login |
| TC_PWD_003 | Dashboard action buttons visible after login |
| TC_PWD_004 | Invalid credentials show error message |
| TC_PWD_005 | Empty User ID keeps Login button disabled |
| TC_PWD_006 | "Or login with OTP" link switches to OTP mode |
| TC_PWD_007 | Password field is masked by default |

```powershell
$env:TEST_ENV="uat"; npx playwright test tests/auth/password-login.spec.js --project=chromium --workers=1 --headed
```

### OTP Login Only (otp-login.spec.js)

| Test ID | Description |
|---|---|
| TC_OTP_001 | Switching to OTP mode shows email field |
| TC_OTP_002 | "Get OTP" button sends OTP |
| TC_OTP_003 | Valid OTP logs in successfully |
| TC_OTP_004 | Empty email field shows validation error |
| TC_OTP_005 | "Or login with Password" link switches to password mode |

```powershell
$env:TEST_ENV="uat"; npx playwright test tests/auth/otp-login.spec.js --project=chromium --workers=1 --headed
```

---

## ?? 3. Dashboard Tests (dashboard-authenticated.spec.js)

| Test ID | Description |
|---|---|
| TC_AUTH_DASH_001 | Direct navigation to dashboard does not redirect to login |
| TC_AUTH_DASH_002 | Dashboard shows Agents Overview stats using shared session |
| TC_AUTH_DASH_003 | Dashboard action buttons (Refresh, Add Widget) are visible |

```powershell
$env:TEST_ENV="uat"; $env:USER_ROLE="admin"; npx playwright test tests/dashboard/ --project=chromium --workers=1 --headed
```

---

## ?? 4. Campaign Tests

### All Campaign Tests (all 3 spec files)

```powershell
# Admin
$env:TEST_ENV="uat"; $env:USER_ROLE="admin"; npx playwright test tests/campaign/ --project=chromium --workers=1 --headed
```
```powershell
# Supervisor
$env:TEST_ENV="uat"; $env:USER_ROLE="supervisor"; npx playwright test tests/campaign/ --project=chromium --workers=1 --headed
```
```powershell
# Agent (verifies access restrictions only — no creation)
$env:TEST_ENV="uat"; $env:USER_ROLE="agent"; npx playwright test tests/campaign/ --project=chromium --workers=1 --headed
```

### Outbound Campaign Page Tests (campaign.spec.js)

| Test ID | Description |
|---|---|
| TC_CAMP_001 | Campaign Manager page loads after login |
| TC_CAMP_002 | Outbound tab is visible on Campaign Manager page |
| TC_CAMP_003 | "Add new Outbound Campaign" modal opens correctly |
| TC_CAMP_004 | All required form fields are visible in Add Campaign modal |
| TC_CAMP_005 | Campaign name input accepts text |
| TC_CAMP_006 | "Add" and "Cancel" buttons are visible in the modal |
| TC_CAMP_007 | Clicking Cancel closes the modal without creating a campaign |
| TC_CAMP_008 | Modal re-opens with a clean empty form after Cancel |

```powershell
# Admin
$env:TEST_ENV="uat"; $env:USER_ROLE="admin"; npx playwright test tests/campaign/campaign.spec.js --project=chromium --workers=1 --headed
```
```powershell
# Supervisor
$env:TEST_ENV="uat"; $env:USER_ROLE="supervisor"; npx playwright test tests/campaign/campaign.spec.js --project=chromium --workers=1 --headed
```

### Inbound Campaign Tests (inbound-campaign.spec.js)

| Test ID | Description |
|---|---|
| TC_IBC_000 | Prepare environment — free up DID if none available |
| TC_IBC_001 | Campaign Manager page loads after login @smoke |
| TC_IBC_002 | Inbound tab is visible on Campaign Manager page @smoke |
| TC_IBC_003 | "Add new Inbound Campaign" modal opens correctly @smoke |
| TC_IBC_004 | All required form fields visible in modal (default state) |
| TC_IBC_005 | Campaign name is filled with configured value |
| TC_IBC_006 | "Select DID" dropdown — select configured DID @smoke |
| TC_IBC_007 | "Business Hours" dropdown — select configured option |
| TC_IBC_008 | "Out of Business - Audio File" dropdown — select configured file |
| TC_IBC_009 | Route To — select configured option (Queue or IVR) |
| TC_IBC_010 | Select Queue/IVR — select configured option |
| TC_IBC_011 | "Select Script" dropdown — select configured script |
| TC_IBC_012 | PIS toggle is visible and set per config |
| TC_IBC_013 | "Save" and "Cancel" buttons are visible in modal |
| TC_IBC_014 | Clicking Cancel closes modal without creating a campaign |
| TC_IBC_015 | Modal re-opens in default state (IVR selected) after Cancel |
| TC_IBC_016 | Complete Inbound Campaign Creation and Save |

```powershell
# Admin
$env:TEST_ENV="uat"; $env:USER_ROLE="admin"; npx playwright test tests/campaign/inbound-campaign.spec.js --project=chromium --workers=1 --headed
```
```powershell
# Supervisor
$env:TEST_ENV="uat"; $env:USER_ROLE="supervisor"; npx playwright test tests/campaign/inbound-campaign.spec.js --project=chromium --workers=1 --headed
```
```powershell
# Smoke tests only (TC_IBC_001, 002, 003, 006 — fast subset)
$env:TEST_ENV="uat"; $env:USER_ROLE="admin"; npx playwright test tests/campaign/inbound-campaign.spec.js --project=chromium --workers=1 --headed --grep "@smoke"
```

### Outbound E2E Creation Flow (campaign-creation-flow.spec.js)

| Test ID | Description |
|---|---|
| E2E_CAMP_001 | Complete Outbound Campaign Creation Flow — list creation, add leads, link list, create campaign |

```powershell
# Admin
$env:TEST_ENV="uat"; $env:USER_ROLE="admin"; npx playwright test tests/campaign/campaign-creation-flow.spec.js --project=chromium --workers=1 --headed
```
```powershell
# Supervisor
$env:TEST_ENV="uat"; $env:USER_ROLE="supervisor"; npx playwright test tests/campaign/campaign-creation-flow.spec.js --project=chromium --workers=1 --headed
```

---

## ?? 5. Contacts / CRM Tests (contact-creation.spec.js)

> **Note — Agent restriction**: Agent persona has no access to Contacts.
> The test automatically verifies the /app/access-denied redirect and passes without attempting creation.

| Test ID | Description |
|---|---|
| TC_CON_001 | Single Contact Creation and Access Check — fills all form fields, saves, verifies contact in table |

```powershell
# Admin
$env:TEST_ENV="uat"; $env:USER_ROLE="admin"; npx playwright test tests/contacts/contact-creation.spec.js --project=chromium --workers=1 --headed
```
```powershell
# Supervisor
$env:TEST_ENV="uat"; $env:USER_ROLE="supervisor"; npx playwright test tests/contacts/contact-creation.spec.js --project=chromium --workers=1 --headed
```
```powershell
# Agent (verifies access-denied redirect — no form)
$env:TEST_ENV="uat"; $env:USER_ROLE="agent"; npx playwright test tests/contacts/contact-creation.spec.js --project=chromium --workers=1 --headed
```

---

## ?? 6. Full Regression Suite (All Modules at Once)

```powershell
# Admin
$env:TEST_ENV="uat"; $env:USER_ROLE="admin"; npx playwright test --project=chromium --workers=1 --headed
```
```powershell
# Supervisor
$env:TEST_ENV="uat"; $env:USER_ROLE="supervisor"; npx playwright test --project=chromium --workers=1 --headed
```
```powershell
# Agent
$env:TEST_ENV="uat"; $env:USER_ROLE="agent"; npx playwright test --project=chromium --workers=1 --headed
```

---

## ??? 7. Reports & Debug Tools

### View HTML Report (after any test run)
```bash
npx playwright show-report
```

### View Trace on Failure
The trace zip path is shown in the failure output:
```bash
npx playwright show-trace test-results/<folder-name>/trace.zip
```

### Headless Mode (no visible browser window)
Remove `--headed` from any command. Example:
```powershell
$env:TEST_ENV="uat"; $env:USER_ROLE="admin"; npx playwright test tests/contacts/contact-creation.spec.js --project=chromium --workers=1
```

### Run a Specific Test by Test ID
```powershell
$env:TEST_ENV="uat"; $env:USER_ROLE="admin"; npx playwright test --project=chromium --workers=1 --headed --grep "TC_CON_001"
```
```powershell
$env:TEST_ENV="uat"; $env:USER_ROLE="admin"; npx playwright test --project=chromium --workers=1 --headed --grep "TC_IBC_016"
```
```powershell
$env:TEST_ENV="uat"; $env:USER_ROLE="admin"; npx playwright test --project=chromium --workers=1 --headed --grep "E2E_CAMP_001"
```

---

## ?? Credentials Reference (UAT)

| Persona | User ID | Password |
|---|---|---|
| Admin | `tena003-a16` | `Mayur9898@` |
| Supervisor | `tena003-a21` | `Mayur9898@` |
| Agent | `tena003-a20` | `Mayur9898@` |
| Tenant Admin | *(add when available)* | — |

> Credentials are stored in `.env.uat` at the project root.
> The `USER_ROLE` environment variable automatically selects the correct credential set.
