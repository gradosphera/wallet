import TonConnect from '@tonconnect/sdk';

import { TONCONNECT_MANIFEST_URL } from '../config';
import { openUrl } from './openUrl';
import { randomBytes } from './random';

const TELEGRAM_WALLET_INFO = {
  bridgeUrl: 'https://tonbridge.telegram.org',
  universalLink: 'https://t.me/sendgrams',
};

const TON_PROOF_PAYLOAD_BYTE_SIZE = 16;

let tonConnect: TonConnect | undefined;

function getTonConnect() {
  tonConnect ??= new TonConnect({ manifestUrl: TONCONNECT_MANIFEST_URL });
  return tonConnect;
}

function createTonProofPayload() {
  return Array.from(randomBytes(TON_PROOF_PAYLOAD_BYTE_SIZE))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function openTelegramWallet() {
  const connector = getTonConnect();

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
