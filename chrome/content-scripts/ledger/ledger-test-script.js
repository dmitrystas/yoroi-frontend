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
            publicKeyHex: 'd54844edc8ffe0f41ec686a2199f4d182dd477450ec2d5b251d877178f366b81',
            chainCodeHex: 'd8b2aa0ca5ed670a252387c9d4c2f41946c2f760d118bec9b70b5fbabfef7fc6',
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