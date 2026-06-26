# 📋 CX-Connect Test Execution Commands

This document contains all the commands to execute the campaign test suites in **Desktop Chrome (Chromium)**.

> [!IMPORTANT]
> **One Session Limit Configuration**: Because the CX-Connect environment restricts each user to a **single active login session at any time**, all commands below are configured with `--workers=1`. This guarantees Playwright executes the tests sequentially (one-by-one) and prevents login session conflicts.

---

## 👥 1. Run Tests by Persona (Agent, Admin, Supervisor)

Use these commands to set the active persona and run **all campaign test cases** (Outbound, Inbound, and E2E creation flow) sequentially.

### 👤 Agent Persona (Asserts access boundaries, verifies buttons are hidden, and skips creation)
* **Windows (PowerShell):**
  ```powershell
  $env:USER_ROLE="agent"; npx playwright test tests/campaign/ --project=chromium --workers=1 --headed
  ```
* **macOS / Linux:**
  ```bash
  USER_ROLE=agent npx playwright test tests/campaign/ --project=chromium --workers=1 --headed
  ```

### 👤 Supervisor Persona (Performs full Outbound & Inbound campaign creation E2E)
* **Windows (PowerShell):**
  ```powershell
  $env:USER_ROLE="supervisor"; npx playwright test tests/campaign/ --project=chromium --workers=1 --headed
  ```
* **macOS / Linux:**
  ```bash
  USER_ROLE=supervisor npx playwright test tests/campaign/ --project=chromium --workers=1 --headed
  ```

### 👤 Admin Persona (Performs full Outbound & Inbound campaign creation E2E)
* **Windows (PowerShell):**
  ```powershell
  $env:USER_ROLE="admin"; npx playwright test tests/campaign/ --project=chromium --workers=1 --headed
  ```
* **macOS / Linux:**
  ```bash
  USER_ROLE=admin npx playwright test tests/campaign/ --project=chromium --workers=1 --headed
  ```

---

## 🎯 2. Run Tests by Campaign Type (Inbound / Outbound / Creation Flow)

Use these commands to run a **specific test file** for any persona.

### 📥 Inbound Campaign Tests (`inbound-campaign.spec.js`)
Runs the validation of all Inbound form fields and complete creation.
* **Windows (PowerShell):**
  ```powershell
  $env:USER_ROLE="admin"; npx playwright test tests/campaign/inbound-campaign.spec.js --project=chromium --workers=1 --headed
  ```
* **macOS / Linux:**
  ```bash
  USER_ROLE=admin npx playwright test tests/campaign/inbound-campaign.spec.js --project=chromium --workers=1 --headed
  ```

### 📤 Outbound Campaign Page Tests (`campaign.spec.js`)
Runs page load validations, outbound modal opening, and form clean validations.
* **Windows (PowerShell):**
  ```powershell
  $env:USER_ROLE="admin"; npx playwright test tests/campaign/campaign.spec.js --project=chromium --workers=1 --headed
  ```
* **macOS / Linux:**
  ```bash
  USER_ROLE=admin npx playwright test tests/campaign/campaign.spec.js --project=chromium --workers=1 --headed
  ```

### 🔄 Outbound E2E Creation Flow (`campaign-creation-flow.spec.js`)
Runs E2E Outbound list creation, adding leads, linking lists, and campaign creation.
* **Windows (PowerShell):**
  ```powershell
  $env:USER_ROLE="admin"; npx playwright test tests/campaign/campaign-creation-flow.spec.js --project=chromium --workers=1 --headed
  ```
* **macOS / Linux:**
  ```bash
  USER_ROLE=admin npx playwright test tests/campaign/campaign-creation-flow.spec.js --project=chromium --workers=1 --headed
  ```

---

## 📊 3. View Reports
After any test run, you can view the HTML report to see screenshots and logs:
```bash
npx playwright show-report
```
