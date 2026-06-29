const { expect } = require('@playwright/test');

/**
 * PropertyPanel Class
 * Manages form fields configuration inside right-side details panel.
 */
class PropertyPanel {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.container = page.locator('form#node-config-form, div:has(> form#node-config-form), aside').first();
    this.saveChangesButton = page.locator('button:has-text("Save Changes")').first();
    this.cancelButton = page.locator('button:has-text("Cancel")').first();
  }

  /**
   * Generates a locator string targeting wrapper divs containing the mapped label text.
   * Converts camelCase fieldId (e.g. 'maxRetries') to 'Max Retries' for label matching.
   * @param {string} fieldId
   * @returns {string} Selector string
   */
  getLabelSelector(fieldId) {
    if (fieldId === 'minDigits') {
      return 'div:has(> label:has-text("Minimum Digits")), div:has(> label:has-text("Min Digits"))';
    }
    if (fieldId === 'maxDigits') {
      return 'div:has(> label:has-text("Maximum Digits")), div:has(> label:has-text("Max Digits"))';
    }
    const labelText = fieldId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return `div:has(> label:has-text("${labelText}")), div:has(> label:has-text("${fieldId}")), div:has(> p:has-text("${labelText}")), div:has(> p:has-text("${fieldId}"))`;
  }

  /**
   * Dynamically locates and returns the active dropdown container scope.
   * Detects whether the dropdown options are rendered inline or via a React portal.
   * @param {import('@playwright/test').Locator} dropdownTrigger
   * @returns {Promise<import('@playwright/test').Locator>} Scoped container locator
   * @private
   */
  async _getDropdownScope(dropdownTrigger) {
    const parentContainer = dropdownTrigger.locator('xpath=..');
    const inlineContainer = parentContainer
      .locator('div[class*="absolute"], ul, [role="listbox"], [class*="menu"]')
      .first();
    
    // Check if an options list appeared inline under the parent container
    const isInline = await inlineContainer.isVisible().catch(() => false);
    if (isInline) {
      return inlineContainer;
    }

    // Otherwise, find the active visible portal menu overlay on the page
    const portalMenu = this.page
      .locator(
        '[role="listbox"], div[class*="menu"], div[class*="dropdown-menu"], ' +
        'div[class*="options-list"], div[class*="select-options"], div[class*="select__menu"]'
      )
      .filter({ state: 'visible' })
      .first();
    return portalMenu;
  }

  /**
   * Selects a single option from a custom React dropdown in the property panel.
   * Handles both searchable dropdowns (audio file pickers) and direct-click lists.
   * @param {string} fieldId - Element ID or label substring of the dropdown trigger
   * @param {string} optionText - The option text to select
   */
  async selectDropdown(fieldId, optionText) {
    const labelSel = this.getLabelSelector(fieldId);
    const dropdownTrigger = this.container
      .locator(`#${fieldId}, [name="${fieldId}"]`)
      .or(this.container.locator(labelSel).locator('button, [role="combobox"], div'))
      .first();
    await dropdownTrigger.waitFor({ state: 'attached', timeout: 10000 });
    await dropdownTrigger.scrollIntoViewIfNeeded();
    await dropdownTrigger.waitFor({ state: 'visible', timeout: 10000 });
    await dropdownTrigger.click({ force: true });
    await this.page.waitForTimeout(600); // Let dropdown expand/render

    const searchScope = await this._getDropdownScope(dropdownTrigger);

    // Scoped search input check
    const searchInput = searchScope
      .locator('input[placeholder*="earch"], input[placeholder*="ilter"], input[type="search"]')
      .first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      await searchInput.fill(String(optionText));
      await this.page.waitForTimeout(400);
    }

    // Locate option inside the active dropdown scope
    const option = searchScope.locator(
      `[class*="option"]:has-text("${optionText}"), ` +
      `li:has-text("${optionText}"), ` +
      `[role="option"]:has-text("${optionText}"), ` +
      `span:has-text("${optionText}"), ` +
      `div:has-text("${optionText}")`
    ).first();

    try {
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click({ force: true });
    } catch {
      // Fallback: exact text match inside the active dropdown scope
      await searchScope.getByText(String(optionText), { exact: true }).first().click({ force: true });
    }

    await this.page.waitForTimeout(500);
  }

  /**
   * Helper to fill standard text or numeric inputs by ID or label.
   * @param {string} fieldId - Element ID, name, or label substring
   * @param {string|number} value - Value to fill
   */
  async fillInputField(fieldId, value) {
    const labelSel = this.getLabelSelector(fieldId);
    const input = this.container
      .locator(`#${fieldId}, [name="${fieldId}"]`)
      .or(this.container.locator(labelSel).locator('input, textarea'))
      .first();
    await input.waitFor({ state: 'attached', timeout: 5000 });
    await input.scrollIntoViewIfNeeded();
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.clear();
    await input.fill(String(value));
  }

  /**
   * Closes any currently open dropdown by pressing Escape.
   * @private
   */
  async _closeOpenDropdown() {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  /**
   * Selects multiple options from a custom React multi-select dropdown.
   * Handles both searchable lists (audio) and direct lists (digit picker with no search).
   * @param {string} fieldId - Element ID or label substring
   * @param {string[]} optionsList - Array of option texts to select
   */
  async selectMultiDropdown(fieldId, optionsList) {
    const labelSel = this.getLabelSelector(fieldId);
    const dropdownTrigger = this.container
      .locator(`#${fieldId}, [name="${fieldId}"]`)
      .or(this.container.locator(labelSel).locator('button, [role="combobox"]'))
      .first();
    await dropdownTrigger.waitFor({ state: 'attached', timeout: 10000 });
    await dropdownTrigger.scrollIntoViewIfNeeded();
    await dropdownTrigger.waitFor({ state: 'visible', timeout: 10000 });
    await dropdownTrigger.click({ force: true });
    await this.page.waitForTimeout(800); // Let dropdown expand

    const searchScope = await this._getDropdownScope(dropdownTrigger);

    for (const optionText of optionsList) {
      const searchInput = searchScope
        .locator('input[placeholder*="earch"], input[placeholder*="ilter"], input[type="search"]')
        .first();
      const hasSearch = await searchInput.isVisible().catch(() => false);

      if (hasSearch) {
        await searchInput.fill(String(optionText));
        await this.page.waitForTimeout(400);
      }

      // Locate option in scope
      const option = searchScope.locator(
        `[class*="option"]:has-text("${optionText}"), ` +
        `li:has-text("${optionText}"), ` +
        `[role="option"]:has-text("${optionText}"), ` +
        `span:has-text("${optionText}"), ` +
        `div:has-text("${optionText}")`
      ).first();

      try {
        await option.waitFor({ state: 'visible', timeout: 5000 });
        await option.click({ force: true });
      } catch {
        await searchScope.getByText(String(optionText), { exact: true }).first().click({ force: true });
      }
      await this.page.waitForTimeout(400);
    }

    // Close dropdown by pressing Escape
    await this._closeOpenDropdown();
  }

  /**
   * Configures Play Prompt block properties.
   * @param {string} audioFile - Audio file name to select
   */
  async configurePlayPrompt(audioFile) {
    await this.selectDropdown('audioFile', audioFile);
    await this.saveChanges();
  }

  /**
   * Configures Menu block properties.
   * @param {object} menuConfig
   * @param {string} menuConfig.menuPrompt - Required: menu audio prompt
   * @param {string[]} menuConfig.options - Digit options (e.g. ['1','2','3'])
   * @param {string} menuConfig.invalidPrompt - Audio for invalid input
   * @param {string} menuConfig.noInputPrompt - Audio for no input
   * @param {string} menuConfig.maxRetryPrompt - Audio for max retries
   * @param {number} menuConfig.timeout - Timeout in ms
   * @param {number} menuConfig.retryCount - Max retry count
   */
  async configureMenu(menuConfig) {
    if (menuConfig.menuPrompt) {
      await this.selectDropdown('menuPrompt', menuConfig.menuPrompt);
    }
    if (menuConfig.options) {
      await this.selectMultiDropdown('menuOptions', menuConfig.options);
    }
    if (menuConfig.invalidPrompt) {
      await this.selectDropdown('invalidPrompt', menuConfig.invalidPrompt);
    }
    if (menuConfig.noInputPrompt) {
      await this.selectDropdown('noInputPrompt', menuConfig.noInputPrompt);
    }
    if (menuConfig.maxRetryPrompt) {
      try {
        await this.selectDropdown('maxRetriesPrompt', menuConfig.maxRetryPrompt);
      } catch {
        await this.selectDropdown('maxRetryPrompt', menuConfig.maxRetryPrompt);
      }
    }
    if (menuConfig.timeout) {
      await this.fillInputField('timeout', menuConfig.timeout);
    }
    if (menuConfig.retryCount) {
      await this.fillInputField('maxRetries', menuConfig.retryCount);
    }
    await this.saveChanges();
  }

  /**
   * Configures Collect DTMF block properties.
   * @param {object} dtmfConfig
   * @param {number} dtmfConfig.minDigits
   * @param {number} dtmfConfig.maxDigits
   * @param {string} dtmfConfig.terminationKey
   * @param {number} dtmfConfig.timeout
   * @param {number} dtmfConfig.retryCount
   * @param {string} dtmfConfig.invalidPrompt
   */
  async configureCollectDTMF(dtmfConfig) {
    if (dtmfConfig.minDigits) {
      await this.fillInputField('minDigits', dtmfConfig.minDigits);
    }
    if (dtmfConfig.maxDigits) {
      await this.fillInputField('maxDigits', dtmfConfig.maxDigits);
    }
    if (dtmfConfig.terminationKey) {
      await this.fillInputField('terminationKey', dtmfConfig.terminationKey);
    }
    if (dtmfConfig.timeout) {
      await this.fillInputField('timeout', dtmfConfig.timeout);
    }
    if (dtmfConfig.retryCount) {
      await this.fillInputField('maxRetries', dtmfConfig.retryCount);
    }
    if (dtmfConfig.invalidPrompt) {
      await this.selectDropdown('invalidPrompt', dtmfConfig.invalidPrompt);
    }
    await this.saveChanges();
  }

  /**
   * Configures Decision block properties.
   * @param {string} expression - Condition expression (e.g. "${dtmf_input} == '1'")
   */
  async configureDecision(expression) {
    await this.fillInputField('expression', expression);
    await this.saveChanges();
  }

  /**
   * Configures Transfer to Queue block properties.
   * @param {string} queueName - Queue name to select
   */
  async configureTransferToQueue(queueName) {
    await this.selectDropdown('queue', queueName);
    await this.saveChanges();
  }

  /**
   * Submits/saves the block configuration by clicking Save Changes.
   */
  async saveChanges() {
    await this.saveChangesButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.saveChangesButton.click();
    await this.page.waitForTimeout(800); // Settle canvas update
  }
}

module.exports = { PropertyPanel };
