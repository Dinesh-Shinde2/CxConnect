/**
 * CRM Single Contact Creation E2E Test Flow
 * ===========================================
 * Complete Flow:
 *   1) Log in dynamically based on USER_ROLE (from .env.uat).
 *   2) If role is 'agent', navigate to contact page and verify redirection to '/app/access-denied'.
 *   3) If role is 'admin' or 'supervisor' or 'tenant_admin':
 *      - Navigate to '/app/master/contact' (Contacts tab).
 *      - Click '+ Add new Contact' / '+ New Contact' to open drawer.
 *      - Fill configurable inputs (Title, First Name, Middle Name, Last Name, Email).
 *      - Enter 10-digit Phone Info, check Primary & WhatsApp checkboxes, click the blue '+' add icon.
 *      - (Optional) Toggle 'Add Social Accounts' checkbox.
 *      - Fill Address Info (Address 1, Address 2, City, State, Postal Code, Country).
 *      - Fill Date of Birth (DD-MM-YYYY format).
 *      - (Optional) Select Contact List from dropdown.
 *      - Click 'Add' (Save) and wait for drawer to close.
 *      - Search and verify the contact appears in the list table.
 *   4) Safely log out after test completion to release session locks.
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║             📋  CONTACT DATA CONFIGURATION — EDIT HERE                ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  Edit the CONTACT_CONFIG object below.                               ║
 * ║  If a value is set to 'auto', null, or "", unique test data is      ║
 * ║  automatically generated.                                            ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Run commands:
 *   Chrome (Headed, single worker to prevent session collisions):
 *     $env:USER_ROLE="admin"; npx playwright test tests/contacts/contact-creation.spec.js --project=chromium --headed --workers=1
 *     $env:USER_ROLE="supervisor"; npx playwright test tests/contacts/contact-creation.spec.js --project=chromium --headed --workers=1
 *     $env:USER_ROLE="agent"; npx playwright test tests/contacts/contact-creation.spec.js --project=chromium --headed --workers=1
 */

const { test, expect } = require('../../src/fixtures/baseFixture');
const { LoginPage } = require('../../src/pages/LoginPage');
const { DashboardPage } = require('../../src/pages/DashboardPage');
const { resolveCredentials } = require('../../src/utils/credentialsHelper');

// ══════════════════════════════════════════════════════════════════════════════
// 📋 CONTACT CONFIG — Edit values below to customize
// ══════════════════════════════════════════════════════════════════════════════
const CONTACT_CONFIG = {
  // 1) Title dropdown (options: 'Mr', 'Mrs', 'Ms', 'Dr' etc. as per actual UI dropdown options)
  title: 'Mr',

  // 2) First name
  // 'auto' = auto-generate unique name | 'MyFirstName' = fixed string
  firstName: 'auto',

  // 3) Middle name (Optional, leaves blank if empty string or null)
  middleName: 'M',

  // 4) Last name
  // 'auto' = auto-generate unique name | 'MyLastName' = fixed string
  lastName: 'auto',

  // 5) Email
  // 'auto' = auto-generate unique email | 'my.email@domain.com' = fixed string
  email: 'auto',

  // 6) Phone Information (Must be a 10-digit number)
  // 'auto' = auto-generate a valid 10-digit number | '9876543210' = fixed string
  phone: 'auto',

  // Whether to check "Primary Number" checkbox
  isPrimaryPhone: true,

  // Whether to check "WhatsApp Number" checkbox
  isWhatsappPhone: true,

  // 7) Ignore or click "Add Social Accounts" (true = click checkbox, false = skip/ignore)
  clickSocialAccounts: false,

  // 8) Address Information (Fill all fields)
  // 'auto' = auto-generate dummy values | custom string to fill
  addressLine1: 'auto',
  addressLine2: 'Apartment 4B',
  city: 'Mumbai',
  state: 'Maharashtra',
  postalCode: '400001',
  country: 'India',

  // 9) Date of Birth (DD-MM-YYYY format)
  // 'auto' = auto-fills '15-08-1990' | 'DD-MM-YYYY' = custom date
  dob: '15-08-1990',

  // 10) Contact List (Optional dropdown value, null or empty = skip select)
  contactList: null,
};
// ══════════════════════════════════════════════════════════════════════════════

// ── Resolve configuration values with random/fallback fallbacks ────────────────
// Name fields in the CRM strip numeric characters on save.
// To keep auto-generated names unique AND fully alphabetical, we convert the
// 5-digit random number to letters using: digit 0→a, 1→b, … 9→j.
const rand = Math.floor(10000 + Math.random() * 90000);
const DIGIT_TO_LETTER = 'abcdefghij';
const randLetters = String(rand).split('').map(d => DIGIT_TO_LETTER[parseInt(d, 10)]).join('');
// e.g. rand=75650 → randLetters='hfffa'

const resolvedConfig = {
  title: CONTACT_CONFIG.title || 'Mr',
  firstName: (!CONTACT_CONFIG.firstName || CONTACT_CONFIG.firstName === 'auto')
    ? `Auto${randLetters}`      // e.g. "Autohfffa" — pure letters, unique per run
    : CONTACT_CONFIG.firstName,
  middleName: CONTACT_CONFIG.middleName || '',
  lastName: (!CONTACT_CONFIG.lastName || CONTACT_CONFIG.lastName === 'auto')
    ? `Last${randLetters}`      // e.g. "Lasthfffa"
    : CONTACT_CONFIG.lastName,
  email: (!CONTACT_CONFIG.email || CONTACT_CONFIG.email === 'auto')
    ? `contact.${randLetters}@yopmail.com`   // use letters so email stays clean
    : CONTACT_CONFIG.email,
  phone: (!CONTACT_CONFIG.phone || CONTACT_CONFIG.phone === 'auto')
    ? `919${Math.floor(100000000 + Math.random() * 900000000)}`
    : CONTACT_CONFIG.phone,
  isPrimaryPhone: CONTACT_CONFIG.isPrimaryPhone !== false,
  isWhatsappPhone: CONTACT_CONFIG.isWhatsappPhone !== false,
  clickSocialAccounts: !!CONTACT_CONFIG.clickSocialAccounts,
  addressLine1: (!CONTACT_CONFIG.addressLine1 || CONTACT_CONFIG.addressLine1 === 'auto')
    ? `Auto street ${randLetters}`
    : CONTACT_CONFIG.addressLine1,
  addressLine2: CONTACT_CONFIG.addressLine2 || '',
  city: CONTACT_CONFIG.city || 'Mumbai',
  state: CONTACT_CONFIG.state || 'Maharashtra',
  postalCode: CONTACT_CONFIG.postalCode || '400001',
  country: CONTACT_CONFIG.country || 'India',
  dob: (!CONTACT_CONFIG.dob || CONTACT_CONFIG.dob === 'auto')
    ? '15-08-1990'
    : CONTACT_CONFIG.dob,
  contactList: CONTACT_CONFIG.contactList || null,
};

test.describe('CRM Contacts Creation Flow', () => {
  // Use serial execution to ensure cleanly managed session flow per test run
  test.describe.configure({ mode: 'serial', retries: 0 });

  let sharedPage;
  let activeRole = 'admin';

  test.beforeAll(async ({ browser }) => {
    // Spawn browser context
    const context = await browser.newContext();
    sharedPage = await context.newPage();

    // Resolve credentials based on active role
    const credentials = resolveCredentials();
    activeRole = credentials.role;
    const { userId, password } = credentials;

    if (!userId || !password) {
      throw new Error(`[Contact Flow] Credentials for role "${activeRole}" must be set in .env.uat`);
    }

    // ── Pre-login session cleanup ──────────────────────────────────────────
    // The UAT server allows only ONE active session per user. If a previous
    // headed browser run left the session alive, the next login will be rejected
    // and the browser stays stuck on /login. To prevent this, we proactively
    // navigate to the app and force-logout any existing session first.
    console.log(`[Contact Flow] Checking for stale session before login...`);
    try {
      await sharedPage.goto('https://uat.ishancxconnect.com/app/dashboard', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sharedPage.waitForTimeout(2000);
      const currentUrl = sharedPage.url();
      if (currentUrl.includes('/app/')) {
        // Already logged in — force a logout so the session slot is freed
        console.log(`[Contact Flow] ⚠️  Stale session detected at ${currentUrl}. Force-logging out...`);
        const dashboardPage = new DashboardPage(sharedPage);
        await dashboardPage.logout();
        await sharedPage.waitForTimeout(1500);
        console.log(`[Contact Flow] ✅ Stale session cleared.`);
      } else {
        console.log(`[Contact Flow] No stale session found. Proceeding with login.`);
      }
    } catch (e) {
      // If navigation fails or logout errors, we continue anyway — login may still work
      console.log(`[Contact Flow] Session check skipped (${e.message}). Continuing...`);
    }

    console.log(`[Contact Flow] Logging in as role: "${activeRole}" (${userId})`);
    const loginPage = new LoginPage(sharedPage);
    await loginPage.goto();
    await loginPage.loginWithUserIdAndPassword(userId, password);

    // Verify successful login transition
    const dashboardPage = new DashboardPage(sharedPage);
    await dashboardPage.expectDashboardLoaded();
    console.log(`[Contact Flow] ✅ Successfully logged in.`);
  });

  test.afterAll(async () => {
    if (sharedPage) {
      try {
        const dashboardPage = new DashboardPage(sharedPage);
        await dashboardPage.logout();
        console.log('[Contact Flow] ✅ Logged out successfully and session cleared.');
      } catch (e) {
        console.log('[Contact Flow] ⚠️ Logout failed or session already cleared:', e.message);
      } finally {
        await sharedPage.context().close();
      }
    }
  });

  test('TC_CON_001 | Single Contact Creation and Access Check', async ({ contactPage }) => {
    test.setTimeout(90000);

    // Re-initialize contactPage POM with the sharedPage context
    contactPage.page = sharedPage;
    contactPage.pageHeading = sharedPage.locator('h1, h2, [class*="heading"], [class*="title"]').filter({ hasText: /^Contact$/i }).first();
    contactPage.searchInput = sharedPage.locator('input[placeholder*="Search" i]').first();
    contactPage.searchButton = sharedPage.locator('button[aria-label="Search button"], button:has-text("Search button")').first();
    contactPage.contactTableRows = sharedPage.locator('table tbody tr');
    contactPage.addContactButton = sharedPage.locator('button:has-text("New Contact"), button:has-text("Add Contact"), button:has-text("Add new Contact"), button:has-text("Create Contact")').first();
    contactPage.drawerTitle = sharedPage.getByText('Add new Contact', { exact: true });

    // Re-bind other locators using sharedPage context
    contactPage.titleDropdown = sharedPage.locator('div:has(> label:has-text("Title")) button, div:has(> label:has-text("Title")) div.flex.cursor-pointer, [placeholder="Select Title"]').first();
    contactPage.firstNameInput = sharedPage.locator('input[placeholder="First Name"], input[name="firstName"]');
    contactPage.middleNameInput = sharedPage.locator('input[placeholder="Middle Name"], input[name="middleName"]');
    contactPage.lastNameInput = sharedPage.locator('input[placeholder="Last Name"], input[name="lastName"]');
    contactPage.emailInput = sharedPage.locator('input[placeholder="Email"], input[type="email"]');
    contactPage.phoneInput = sharedPage.locator('input.PhoneInputInput, input[type="tel"]').first();
    contactPage.primaryCheckboxLabel = sharedPage.locator('label:has-text("Primary Number"), span:has-text("Primary Number")').first();
    contactPage.whatsappCheckboxLabel = sharedPage.locator('label:has-text("WhatsApp Number"), span:has-text("WhatsApp Number")').first();
    contactPage.primaryCheckbox = sharedPage.locator('input[type="checkbox"]').nth(0);
    contactPage.whatsappCheckbox = sharedPage.locator('input[type="checkbox"]').nth(1);
    contactPage.addPhoneIconBtn = sharedPage.locator('button[class*="!w-11"][class*="!h-11"]').first();
    contactPage.socialAccountsCheckboxLabel = sharedPage.locator('label:has-text("Add Social Accounts"), span:has-text("Add Social Accounts")').first();
    contactPage.socialAccountsCheckbox = sharedPage.locator('input[type="checkbox"]').nth(2);
    contactPage.addressLine1Input = sharedPage.locator('input[placeholder="Enter address line 1"], input[placeholder*="address line 1" i]');
    contactPage.addressLine2Input = sharedPage.locator('input[placeholder="Enter address line 2"], input[placeholder*="address line 2" i]');
    contactPage.cityInput         = sharedPage.locator('input[placeholder="Enter city"], input[placeholder*="city" i]');
    contactPage.stateInput        = sharedPage.locator('input[placeholder="Enter state"], input[placeholder*="state" i], input[placeholder*="province" i]');
    contactPage.postalCodeInput   = sharedPage.locator('input[placeholder="Enter postal code"], input[placeholder*="postal" i], input[placeholder*="zip" i]');
    contactPage.countryInput      = sharedPage.locator('input#country, input[name="country"], input[placeholder="Enter country"]');
    contactPage.dobInput = sharedPage.locator('input[type="date"], input[placeholder="DD-MM-YYYY"], input[placeholder*="date of birth" i]').first();
    contactPage.contactListDropdown = sharedPage.locator('div:has(> label:has-text("Contact List")) button, div:has(> label:has-text("Contact List")) div.flex.cursor-pointer').first();
    contactPage.cancelButton = sharedPage.getByRole('button', { name: 'Cancel', exact: true });
    contactPage.addButton    = sharedPage.getByRole('button', { name: 'Add', exact: true });

    console.log('[Step 1] Navigating to Contacts Master Page...');
    await contactPage.goto();

    // ── ROLE: Agent ──
    if (activeRole === 'agent') {
      console.log('[Step 2] Agent permission verification: verifying access restriction redirects to access-denied...');
      await expect(sharedPage).toHaveURL(/.*\/app\/access-denied/, { timeout: 15000 });
      console.log('✅ Agent access denial verified successfully.');
      return;
    }

    // ── ROLE: Admin / Supervisor / Tenant Admin ──
    await contactPage.expectContactPageLoaded();
    console.log('✅ Contacts page loaded successfully.');

    console.log('[Step 3] Opening "Add new Contact" drawer...');
    await contactPage.openAddContactDrawer();

    // 1) Select Title
    console.log(`[Form] Selecting Title: "${resolvedConfig.title}"`);
    await contactPage.selectDropdownOption(contactPage.titleDropdown, resolvedConfig.title);

    // 2) First Name
    console.log(`[Form] Filling First Name: "${resolvedConfig.firstName}"`);
    await contactPage.firstNameInput.fill(resolvedConfig.firstName);

    // 3) Middle Name (Optional)
    if (resolvedConfig.middleName) {
      console.log(`[Form] Filling Middle Name: "${resolvedConfig.middleName}"`);
      await contactPage.middleNameInput.fill(resolvedConfig.middleName);
    }

    // 4) Last Name
    console.log(`[Form] Filling Last Name: "${resolvedConfig.lastName}"`);
    await contactPage.lastNameInput.fill(resolvedConfig.lastName);

    // 5) Email
    console.log(`[Form] Filling Email: "${resolvedConfig.email}"`);
    await contactPage.emailInput.fill(resolvedConfig.email);

    // 6) Phone Information
    console.log(`[Form] Filling Phone Number: "${resolvedConfig.phone}"`);
    await contactPage.phoneInput.fill(resolvedConfig.phone);

    // Toggle checkboxes
    if (resolvedConfig.isPrimaryPhone) {
      console.log('[Form] Checking "Primary Number" checkbox');
      await contactPage.primaryCheckbox.check({ force: true });
    }

    if (resolvedConfig.isWhatsappPhone) {
      console.log('[Form] Checking "WhatsApp Number" checkbox');
      await contactPage.whatsappCheckbox.check({ force: true });
    }

    // Click the '+' add icon button to register the phone number
    console.log('[Form] Clicking phone information "+" add button');
    await expect(contactPage.addPhoneIconBtn).toBeEnabled({ timeout: 5000 });
    await contactPage.addPhoneIconBtn.click();
    await sharedPage.waitForTimeout(500);

    // 7) Ignore or click Social Accounts Checkbox
    if (resolvedConfig.clickSocialAccounts) {
      console.log('[Form] Clicking "Add Social Accounts" checkbox');
      await contactPage.socialAccountsCheckbox.check({ force: true });
    } else {
      console.log('[Form] Skipping "Add Social Accounts" checkbox (Config set to false)');
    }

    // 8) Address Information
    console.log('[Form] Filling Address details...');
    await contactPage.addressLine1Input.fill(resolvedConfig.addressLine1);
    await contactPage.addressLine2Input.fill(resolvedConfig.addressLine2);
    await contactPage.cityInput.fill(resolvedConfig.city);
    await contactPage.stateInput.fill(resolvedConfig.state);
    await contactPage.postalCodeInput.fill(resolvedConfig.postalCode);
    await contactPage.countryInput.fill(resolvedConfig.country);

    // 9) Date of Birth (DD-MM-YYYY)
    let dobValue = resolvedConfig.dob;
    if (dobValue && dobValue.includes('-')) {
      const parts = dobValue.split('-');
      if (parts.length === 3 && parts[2].length === 4) {
        // Convert DD-MM-YYYY to YYYY-MM-DD for native HTML5 date input compatibility
        dobValue = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    console.log(`[Form] Filling Date of Birth: "${dobValue}" (derived from "${resolvedConfig.dob}")`);
    await contactPage.dobInput.fill(dobValue);
    await sharedPage.waitForTimeout(500);

    // 10) Contact List (Optional)
    if (resolvedConfig.contactList) {
      console.log(`[Form] Selecting Contact List: "${resolvedConfig.contactList}"`);
      await contactPage.selectDropdownOption(contactPage.contactListDropdown, resolvedConfig.contactList);
    } else {
      console.log('[Form] Skipping optional Contact List selection (Config is null)');
    }

    // Save contact by clicking "Add"
    console.log('[Form] Clicking "Add" button to save contact...');
    await contactPage.saveContact();

    // Verify contact in search list — search by firstName (unique per run due to random suffix)
    const fullName = resolvedConfig.middleName
      ? `${resolvedConfig.firstName} ${resolvedConfig.middleName} ${resolvedConfig.lastName}`
      : `${resolvedConfig.firstName} ${resolvedConfig.lastName}`;

    console.log(`[Verification] Searching table for new contact: "${fullName}"...`);
    await contactPage.expectContactInList(resolvedConfig.firstName, fullName);
    console.log(`✅ Single Contact "${fullName}" created and verified in table successfully.`);
  });
});
