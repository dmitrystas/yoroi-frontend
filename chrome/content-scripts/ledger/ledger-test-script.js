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
    console.log('bar');
    console.log(msg);
    window.postMessage(msg, window.location.origin);
  });
  
  // Close WebPage window when port is closed
  browserPort.onDisconnect.addListener(d => {
    console.debug(`[CS-LEDGER] Closing WebPage window!!`);
    window.postMessage(closeWindowMsg, window.location.origin);
  });
  
  // Passing messages from WebPage ==> Extension
  window.addEventListener('message', event => {
    console.log('foozxcvzxcv');
    console.log(event);
    if(event.origin === ORIGIN && event.data) {
      const { data } = event;

      if (data.action === 'ledger-get-extended-public-key') {
        const payload /*: ExtendedPublicKeyResp */ = {
          ePublicKey: {
            publicKeyHex: '2d7e30fe0be4f5cdcd3bef97fba6a47a56b7058ff6956b357de0d44c69b331f8',
            chainCodeHex: '7da06fd7af93be6b79b63e0d65a011e31207c92152d7f1cb1a9bf74b44e53cbb',
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