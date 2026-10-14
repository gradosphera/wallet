import type { Wallet } from '@tonconnect/sdk';
import { Address } from '@ton/core';
import TonConnect from '@tonconnect/sdk';

import { TONCONNECT_MANIFEST_URL } from '../config';
import { getActions, getGlobal } from '../global';
import { openUrl } from './openUrl';
import { randomBytes } from './random';

const TELEGRAM_WALLET_INFO = {
  bridgeUrl: 'https://tonbridge.telegram.org',
  universalLink: 'https://t.me/sendgrams',
};

const TON_PROOF_PAYLOAD_BYTE_SIZE = 16;

let tonConnect: TonConnect | undefined;
let isWalletListenerAttached = false;
let handledWalletAddress: string | undefined;

function getTonConnect() {
  tonConnect ??= new TonConnect({ manifestUrl: TONCONNECT_MANIFEST_URL });
  return tonConnect;
}

function createTonProofPayload() {
  return Array.from(randomBytes(TON_PROOF_PAYLOAD_BYTE_SIZE))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function normalizeTonAddress(address: string) {
  try {
    return Address.parse(address).toRawString();
  } catch {
    return address;
  }
}

function hasAccountWithTonAddress(address: string) {
  const normalizedAddress = normalizeTonAddress(address);
  const accounts = getGlobal().accounts?.byId ?? {};

  return Object.values(accounts).some((account) => {
    const tonAddress = account.addressByChain.ton;
    return tonAddress ? normalizeTonAddress(tonAddress) === normalizedAddress : false;
  });
}

function handleConnectedWallet(wallet: Wallet) {
  const connector = getTonConnect();
  const address = normalizeTonAddress(wallet.account.address);

  if (handledWalletAddress !== address) {
    handledWalletAddress = address;

    if (!hasAccountWithTonAddress(address)) {
      getActions().importViewAccount({ addressByChain: { ton: wallet.account.address } });
    }
  }

  void connector.disconnect();
}

function attachWalletListener() {
  if (isWalletListenerAttached) {
    return;
  }

  isWalletListenerAttached = true;
  getTonConnect().onStatusChange((wallet) => {
    if (wallet) {
      handleConnectedWallet(wallet);
    }
  });
}

export async function openTelegramWallet() {
  const connector = getTonConnect();
  attachWalletListener();
  handledWalletAddress = undefined;

  if (connector.connected) {
    await connector.disconnect();
  }

  const connectionUrl = connector.connect({
    bridgeUrl: TELEGRAM_WALLET_INFO.bridgeUrl,
    universalLink: TELEGRAM_WALLET_INFO.universalLink,
  }, {
    request: { tonProof: createTonProofPayload() },
  });

  if (typeof connectionUrl === 'string') {
    await openUrl(connectionUrl);
  }
}
