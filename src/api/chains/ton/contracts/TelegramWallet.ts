import type { Address } from '@ton/core';
import { beginCell, Cell, contractAddress } from '@ton/core';

/**
 * WalletTg (Telegram Wallet) is deployed behind an immutable "trampoline" contract. Every Telegram wallet shares the
 * same trampoline code, so its hash identifies the contract; the actual wallet logic lives in the blockchain config
 * (key -123) and is replaced by validator voting.
 */
export const TELEGRAM_WALLET_TRAMPOLINE_CODE_HASH
  = '9149ae51c1e4689710cebf7830297b16acfbadb363a920a537893e7ffeeca768';

const TELEGRAM_WALLET_TRAMPOLINE_CODE_BOC = Buffer.from(
  'b5ee9c7241010101001a000030ff00209821d7498308b9f240df8085f833d0ed1e20ed53d969427e39',
  'hex',
);

const TELEGRAM_WALLET_REVISION = 0;
const TELEGRAM_WALLET_MAINNET_SUBWALLET_ID = 0x7FFF7F11;
const TELEGRAM_WALLET_TESTNET_SUBWALLET_ID = 0x7FFF7FFD;

let telegramWalletTrampolineCode: Cell | undefined;

export function getTelegramWalletTrampolineCode() {
  if (!telegramWalletTrampolineCode) {
    telegramWalletTrampolineCode = Cell.fromBoc(TELEGRAM_WALLET_TRAMPOLINE_CODE_BOC)[0];
  }

  return telegramWalletTrampolineCode;
}

export function getTelegramWalletDefaultSubwalletId(isTestnetSubwalletId?: boolean) {
  return isTestnetSubwalletId ? TELEGRAM_WALLET_TESTNET_SUBWALLET_ID : TELEGRAM_WALLET_MAINNET_SUBWALLET_ID;
}

function buildTelegramWalletData(publicKey: Buffer, subwalletId: number) {
  if (publicKey.length !== 32) {
    throw new Error('Telegram wallet public key must be 32 bytes');
  }

  return beginCell()
    .storeUint(TELEGRAM_WALLET_REVISION, 8)
    .storeUint(0, 32)
    .storeUint(subwalletId, 32)
    .storeBuffer(publicKey)
    .endCell();
}

export class TelegramWallet {
  public readonly publicKey: Buffer;
  public readonly address: Address;
  public readonly init: { code: Cell; data: Cell };

  private constructor(
    publicKey: Buffer,
    public readonly workchain: number,
    public readonly subwalletId: number,
  ) {
    this.publicKey = publicKey;
    this.init = {
      code: getTelegramWalletTrampolineCode(),
      data: buildTelegramWalletData(publicKey, subwalletId),
    };
    this.address = contractAddress(workchain, this.init);
  }

  static create(args: { publicKey: Buffer; workchain?: number; subwalletId: number }) {
    return new TelegramWallet(args.publicKey, args.workchain ?? 0, args.subwalletId);
  }
}
