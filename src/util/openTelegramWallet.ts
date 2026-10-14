import { Address } from '@ton/core';
import { TonConnectUI } from '@tonconnect/ui';

import { TONCONNECT_MANIFEST_URL } from '../config';
import { getActions, getGlobal } from '../global';
import { logDebugError } from './logs';
import { openUrl } from './openUrl';

const TELEGRAM_WALLET_INFO = {
  bridgeUrl: 'https://tonbridge.telegram.org',
  universalLink: 'https://t.me/sendgrams',
};

const CONNECTION_TIMEOUT_MS = 3 * 60 * 1000;

const tonConnectUi = new TonConnectUI({
  manifestUrl: TONCONNECT_MANIFEST_URL,
  restoreConnection: false,
});

let isWalletListenerAttached = false;
let handledWalletAddress: string | undefined;
let connectionTimeout: ReturnType<typeof setTimeout> | undefined;

const connectionCallbacks = new Set<(isConnecting: boolean) => void>();

/**
 * Subscribes to the "waiting for the Telegram Wallet response" state, so the UI can show a loading indicator.
 * Returns an unsubscribe function.
 */
export function subscribeTelegramWalletConnection(callback: (isConnecting: boolean) => void) {
  connectionCallbacks.add(callback);
  return () => {
    connectionCallbacks.delete(callback);
  };
}

function clearConnectionTimeout() {
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = undefined;
  }
}

function setConnecting(isConnecting: boolean) {
  clearConnectionTimeout();

  if (isConnecting) {
    connectionTimeout = setTimeout(() => {
      connectionTimeout = undefined;
      logDebugError('openTelegramWallet: connection timed out');
      setConnecting(false);
    }, CONNECTION_TIMEOUT_MS);
  }

  connectionCallbacks.forEach((callback) => callback(isConnecting));
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

function handleConnectedWallet(wallet: { account: { address: string } }) {
  try {
    const address = normalizeTonAddress(wallet.account.address);

    if (handledWalletAddress !== address) {
      handledWalletAddress = address;

      if (!hasAccountWithTonAddress(address)) {
        getActions().importViewAccount({ addressByChain: { ton: wallet.account.address } });
      }
    }
  } catch (err) {
    logDebugError('openTelegramWallet: handle connected wallet', err);
  } finally {
    setConnecting(false);
    void tonConnectUi.disconnect();
  }
}

function attachWalletListener() {
  if (isWalletListenerAttached) {
    return;
  }

  isWalletListenerAttached = true;
  // Use the raw connector listener instead of `tonConnectUi.onStatusChange`, which wraps the callback in an async
  // function that silently drops it (and rejects with an unhandled rejection) if it fails to resolve wallet info.
  tonConnectUi.connector.onStatusChange(
    (wallet) => {
      if (wallet) {
        handleConnectedWallet(wallet);
      }
    },
    (error) => {
      logDebugError('openTelegramWallet: connect error', error);
      setConnecting(false);
    },
  );
}

/**
 * Opens a `t.me` link inside the Telegram WebView. A plain `window.open` / `location.href` navigation to a `t.me` URL
 * is ignored there, so the official SDK method must be used instead. Returns `true` when the link was opened.
 */
function tryOpenTelegramLink(url: string) {
  const webApp = window.Telegram?.WebApp as unknown as {
    initData?: string;
    openTelegramLink?: (link: string) => void;
  } | undefined;

  const isInsideTelegram = Boolean(webApp?.initData) || window.location.hash.includes('tgWebAppData=');
  if (!isInsideTelegram || typeof webApp?.openTelegramLink !== 'function') {
    return false;
  }

  webApp.openTelegramLink(url);
  return true;
}

export async function openTelegramWallet() {
  attachWalletListener();
  handledWalletAddress = undefined;

  try {
    if (tonConnectUi.connected) {
      await tonConnectUi.disconnect();
    }

    setConnecting(true);

    const connectionUrl = tonConnectUi.connector.connect({
      bridgeUrl: TELEGRAM_WALLET_INFO.bridgeUrl,
      universalLink: TELEGRAM_WALLET_INFO.universalLink,
    });

    if (typeof connectionUrl === 'string') {
      if (!tryOpenTelegramLink(connectionUrl)) {
        await openUrl(connectionUrl);
      }
    }
  } catch (err) {
    logDebugError('openTelegramWallet', err);
    setConnecting(false);
  }
}

/**
 * Restores a pending TonConnect session after the app was reloaded (for example, when returning from the Telegram
 * Wallet, which replaces the mini app WebView and thus reloads the page). Without it the connection result, delivered
 * by the bridge, would never be handled.
 */
export async function initTelegramWalletConnection() {
  attachWalletListener();

  try {
    await tonConnectUi.connector.restoreConnection();
  } catch (err) {
    logDebugError('initTelegramWalletConnection', err);
  }
}
