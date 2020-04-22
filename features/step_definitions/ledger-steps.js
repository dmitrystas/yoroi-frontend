// @flow

import { When, Then } from 'cucumber';
import { By } from 'selenium-webdriver';
import i18n from '../support/helpers/i18n-helpers';
import { expect } from 'chai';

When(/^I restore a Ledger device$/, async function () {
  await this.click('.WalletAdd_btnConnectHW');
  await this.waitForElement('.WalletConnectHWOptionDialog');

  await this.click('.WalletConnectHWOptionDialog_connectLedger');
  await this.waitForElement('.CheckDialog_component');
  await this.click('.primary');
  await this.click('.primary');

  // between these is where the tab & iframe gets opened

  await this.waitForElement('.SaveDialog');
  await this.click('.primary');
});
