// @flow

/*::
import type { ExtendedPublicKeyResp } from 'yoroi-extension-ledger-connect-handler';
*/

/*::
declare var chrome;
*/

console.debug('[CS-LEDGER] Loading');
(function init () {
  console.debug('[CS-LEDGER] Execution begins');

  const YOROI_LEDGER_CONNECT_TARGET_NAME = 'YOROI-LEDGER-CONNECT';
  const ORIGIN = 'https://emurgo.github.io';
  const closeWindowMsg = {
    target: YOROI_LEDGER_CONNECT_TARGET_NAME,
    action: 'close-window'
  }
  const portName = {
    name: YOROI_LEDGER_CONNECT_TARGET_NAME
  };
  
  // Make Extension and WebPage port to communicate over this channel
  let browserPort = chrome.runtime.connect(portName);
  
  // Passing messages from Extension ==> WebPage
  browserPort.onMessage.addListener(msg => {
    window.postMessage(msg, window.location.origin);
  });
  
  // Close WebPage window when port is closed
  browserPort.onDisconnect.addListener(d => {
    console.debug(`[CS-LEDGER] Closing WebPage window!!`);
    window.postMessage(closeWindowMsg, window.location.origin);
  });
  
  // Passing messages from WebPage ==> Extension
  window.addEventListener('message', event => {
    if(event.origin === ORIGIN && event.data) {
      const { data } = event;
      if (data.action === 'ledger-get-extended-public-key') {
        const payload /*: ExtendedPublicKeyResp */ = {
          ePublicKey: {
            // from ledger-wallet mnemonic
            publicKeyHex: '95d43af0023cfbfa7acc782b8aa7090b48c021a3b198930dd5ef6e2619aa41e2',
            chainCodeHex: '958339435e719033a8f56ee395074d0347eaf9c9d2fdbb76de210d90dd504636',
          },
          deviceVersion: {
            major: '1',
            minor: '0',
            patch: '0',
            flags: {
              isDebug: false,
            }
          },
        };
        const postData = {
          action: 'ledger-get-extended-public-key-reply',
          success: true,
          payload,
        };
        browserPort.postMessage(postData)
      } else {
        throw new Error(`Unknown action ${data.action}`);
      }
    } else {
      console.debug(`[CS-LEDGER] Wrong origin or no data object: ${event.origin}`);
    }
  });
}());