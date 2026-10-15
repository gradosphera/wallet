import type { ApiTonWalletVersion } from '../api/chains/ton/types';

export const TELEGRAM_WALLET_VERSION: ApiTonWalletVersion = 'telegram';

/**
 * Human-friendly name of the wallet contract behind a wallet version.
 * For example `v4R2` becomes `v4` and the Telegram Wallet (WalletTg) becomes `WalletTg`.
 */
export function getWalletContractName(version?: ApiTonWalletVersion): string | undefined {
  if (!version) {
    return undefined;
  }

  if (version === TELEGRAM_WALLET_VERSION) {
    return 'WalletTg';
  }

  const versionMatch = version.match(/^v(\d+)R\d+$/);
  if (versionMatch) {
    return `v${versionMatch[1]}`;
  }

  return version;
}
