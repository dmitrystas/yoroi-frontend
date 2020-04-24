// @flow

import { When, } from 'cucumber';

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

When(/^I send with a Ledger device$/, async function () {
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
