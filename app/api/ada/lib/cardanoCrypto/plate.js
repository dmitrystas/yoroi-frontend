// @flow

// Utility functions for number plates (EmIP-001)
// https://github.com/Emurgo/EmIPs/blob/master/specs/emip-001.md

import { RustModule } from './rustLoader';
import type { GenerateAddressFunc } from '../adaAddressProcessing';
import { v2genAddressBatchFunc } from '../../restoration/byron/scan';
import { Bech32Prefix } from '../../../../config/stringConfig';
import blakejs from 'blakejs';
import crc32 from 'buffer-crc32';
import type { WalletAccountNumberPlate } from '../storage/models/PublicDeriver/interfaces';
import {
  HARD_DERIVATION_START,
  CoinTypes,
  WalletTypePurpose,
  ChainDerivations,
  STAKING_KEY_INDEX,
} from '../../../../config/numbersConfig';
import type { AddressDiscriminationType } from '@emurgo/js-chain-libs/js_chain_libs';

const mnemonicsToAddresses = (
  generateAddressFunc: GenerateAddressFunc,
  pubKey: string,
  count: number,
): {| addresses: Array<string>, accountPlate: WalletAccountNumberPlate |} => {
  const accountPlate = createAccountPlate(pubKey);

  const addresses = generateAddressFunc([...Array(count).keys()]);
  return { addresses, accountPlate };
};

export function createAccountPlate(accountPubHash: string): WalletAccountNumberPlate {
  const hash = blakejs.blake2bHex(accountPubHash);
  const [a, b, c, d] = crc32(hash);
  const alpha = `ABCDEJHKLNOPSTXZ`;
  const letters = x => `${alpha[Math.floor(x / 16)]}${alpha[x % 16]}`;
  const numbers = `${((c << 8) + d) % 10000}`.padStart(4, '0');
  const id = `${letters(a)}${letters(b)}-${numbers}`;
  return { hash, id };
}

export type PlateResponse = {|
  addresses: Array<string>,
  accountPlate: WalletAccountNumberPlate
|};
export const generateStandardPlate = (
  rootPk: RustModule.WalletV3.Bip32PrivateKey,
  accountIndex: number,
  count: number,
  discrimination: AddressDiscriminationType,
  legacy: boolean,
): PlateResponse => {
  const accountKey = rootPk
    .derive(legacy ? WalletTypePurpose.BIP44 : WalletTypePurpose.CIP1852)
    .derive(CoinTypes.CARDANO)
    .derive(accountIndex + HARD_DERIVATION_START);
  const accountPublic = accountKey.to_public();
  const chainKey = accountPublic.derive(ChainDerivations.EXTERNAL);

  const stakingKey = accountPublic
    .derive(ChainDerivations.CHIMERIC_ACCOUNT)
    .derive(STAKING_KEY_INDEX)
    .to_raw_key();

  return mnemonicsToAddresses(
    legacy
      ? v2genAddressBatchFunc(
        RustModule.WalletV2.Bip44ChainPublic.new(
          RustModule.WalletV2.PublicKey.from_hex(
            Buffer.from(chainKey.as_bytes()).toString('hex')
          ),
          RustModule.WalletV2.DerivationScheme.v2()
        ),
      )
      : genGroupAddressBatchFunc(
        chainKey,
        stakingKey,
        discrimination,
      ),
    Buffer.from(accountPublic.as_bytes()).toString('hex'),
    count
  );
};

export function genGroupAddressBatchFunc(
  addressChain: RustModule.WalletV3.Bip32PublicKey,
  stakingKey: RustModule.WalletV3.PublicKey,
  discrimination: AddressDiscriminationType,
): GenerateAddressFunc {
  return (
    indices: Array<number>
  ) => {
    return indices.map(i => {
      const addressKey = addressChain.derive(i).to_raw_key();
      const address = RustModule.WalletV3.Address.delegation_from_public_key(
        addressKey,
        stakingKey,
        discrimination
      );
      return address.to_string(Bech32Prefix.ADDRESS);
    });
  };
}
