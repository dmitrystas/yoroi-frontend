// @flow
import { observable, } from 'mobx';

import Store from '../base/Store';
import {
  Logger,
  stringifyError
} from '../../utils/logging';
import Request from '../lib/LocalizedRequest';
import type {
  SignAndBroadcastRequest, SignAndBroadcastResponse,
  GenerateWalletRecoveryPhraseFunc
} from '../../api/ada/index';
import type { BaseSignRequest } from '../../api/ada/transactions/types';
import {
  asGetSigningKey,
} from '../../api/ada/lib/storage/models/PublicDeriver/traits';
import { RustModule } from '../../api/ada/lib/cardanoCrypto/rustLoader';
import { PublicDeriver } from '../../api/ada/lib/storage/models/PublicDeriver/index';

export default class AdaWalletsStore extends Store {

  // REQUESTS
  @observable sendMoneyRequest: Request<typeof AdaWalletsStore.prototype.sendAndRefresh>
    = new Request<typeof AdaWalletsStore.prototype.sendAndRefresh>(this.sendAndRefresh);

  @observable generateWalletRecoveryPhraseRequest: Request<GenerateWalletRecoveryPhraseFunc>
    = new Request<GenerateWalletRecoveryPhraseFunc>(this.api.ada.generateWalletRecoveryPhrase);

  setup(): void {
    super.setup();
    const { ada, walletBackup } = this.actions;
    const { wallets } = ada;
    walletBackup.finishWalletBackup.listen(this._createInDb);
    wallets.createWallet.listen(this._startWalletCreation);
    wallets.sendMoney.listen(this._sendMoney);
  }

  // =================== SEND MONEY ==================== //

  /** Send money and then return to transaction screen */
  _sendMoney:  {|
    signRequest: BaseSignRequest<RustModule.WalletV2.Transaction | RustModule.WalletV3.InputOutput>,
    password: string,
    publicDeriver: PublicDeriver<>,
  |} => Promise<void> = async (transactionDetails) => {
    const withSigning = (asGetSigningKey(transactionDetails.publicDeriver));
    if (withSigning == null) {
      throw new Error(`${nameof(this._sendMoney)} public deriver missing signing functionality.`);
    }
    await this.sendMoneyRequest.execute({
      broadcastRequest: {
        publicDeriver: withSigning,
        password: transactionDetails.password,
        signRequest: transactionDetails.signRequest,
        sendTx: this.stores.substores.ada.stateFetchStore.fetcher.sendTx,
      },
      refreshWallet: () => this.stores.wallets.refreshWalletFromRemote(
        transactionDetails.publicDeriver
      ),
    })
      .then(async (response) => {
        const memo = this.stores.substores.ada.transactionBuilderStore.memo;
        if (memo !== '' && memo !== undefined) {
          try {
            await this.actions.memos.saveTxMemo.trigger({
              publicDeriver: transactionDetails.publicDeriver,
              memo: {
                Content: memo,
                TransactionHash: response.txId,
                LastUpdated: new Date(),
              },
            });
          } catch (error) {
            Logger.error(`${nameof(AdaWalletsStore)}::${nameof(this._sendMoney)} error: ` + stringifyError(error));
            throw new Error('An error has ocurred when saving the transaction memo.');
          }
        }
        return response;
      });

    this.actions.dialogs.closeActiveDialog.trigger();
    this.sendMoneyRequest.reset();
    // go to transaction screen
    this.stores.wallets.goToWalletRoute(transactionDetails.publicDeriver);
  };

  // =================== WALLET RESTORATION ==================== //

  _startWalletCreation: {|
    name: string,
    password: string,
  |} => Promise<void> = async (params) => {
    const recoveryPhrase = await (
      this.generateWalletRecoveryPhraseRequest.execute({}).promise
    );
    if (recoveryPhrase == null) {
      throw new Error(`${nameof(this._startWalletCreation)} failed to generate recovery phrase`);
    }
    this.actions.walletBackup.initiateWalletBackup.trigger({
      recoveryPhrase,
      name: params.name,
      password: params.password,
    });
  };

  /** Create the wallet and go to wallet summary screen */
  _createInDb: void => Promise<void> = async () => {
    const persistentDb = this.stores.loading.loadPersitentDbRequest.result;
    if (persistentDb == null) {
      throw new Error(`${nameof(this._createInDb)} db not loaded. Should never happen`);
    }
    await this.stores.wallets.createWalletRequest.execute(async () => {
      const wallet = await this.api.ada.createWallet({
        db: persistentDb,
        walletName: this.stores.walletBackup.name,
        walletPassword: this.stores.walletBackup.password,
        recoveryPhrase: this.stores.walletBackup.recoveryPhrase.join(' '),
      });
      return wallet;
    }).promise;
  };

  sendAndRefresh: {|
    broadcastRequest: SignAndBroadcastRequest,
    refreshWallet: () => Promise<void>,
  |} => Promise<SignAndBroadcastResponse> = async (request) => {
    const result = await this.api.ada.signAndBroadcast(request.broadcastRequest);
    try {
      await request.refreshWallet();
    } catch (_e) {
      // even if refreshing the wallet fails, we don't want to fail the tx
      // otherwise user may try and re-send the tx
    }
    return result;
  }
}
