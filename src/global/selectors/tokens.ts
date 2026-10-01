import type { ApiBalanceBySlug, ApiChain } from '../../api/types';
import type { AccountSettings, GlobalState, UserToken } from '../types';

import {
  ALWAYS_ENABLED_TOKEN_SLUGS,
  DAO_POPULAR_TOKEN_SLUGS,
  DEFAULT_ENABLED_TOKEN_COUNT,
  DEFAULT_ENABLED_TOKEN_SLUGS,
  MYCOIN,
  MYCOIN_TESTNET,
  PRICELESS_TOKEN_HASHES,
  PRIORITY_TOKEN_SLUGS,
  TINY_TRANSFER_MAX_COST,
  TOKEN_INFO,
  TONCOIN,
} from '../../config';
import { toBig } from '../../util/decimals';
import memoize from '../../util/memoize';
import { round } from '../../util/round';
import { buildUserToken } from '../../util/tokens';
import withCache from '../../util/withCache';
import { selectAccountSettings, selectAccountState, selectCurrentAccountState } from './accounts';

function getIsNewAccount(balancesBySlug: ApiBalanceBySlug, tokenInfo: GlobalState['tokenInfo']) {
  // Токены с форсированным нулевым балансом не должны влиять на определение
  // нового аккаунта, иначе счётчик перестаёт совпадать с DEFAULT_ENABLED_TOKEN_COUNT
  const slugs = Object.keys(balancesBySlug).filter((slug) => !ALWAYS_ENABLED_TOKEN_SLUGS.has(slug));

  return slugs.length === DEFAULT_ENABLED_TOKEN_COUNT && (
    slugs.every((slug) => {
      const balance = balancesBySlug[slug];
      const { decimals, priceUsd } = tokenInfo.bySlug[slug] ?? {};

      const balanceBig = toBig(balance, decimals);
      const hasCost = balanceBig.mul(priceUsd ?? 0).lt(TINY_TRANSFER_MAX_COST);

      return hasCost;
    })
  );
}

export const selectAccountTokensMemoizedFor = withCache((accountId: string) => memoize((
  balancesBySlug: ApiBalanceBySlug,
  tokenInfo: GlobalState['tokenInfo'],
  accountSettings: AccountSettings = {},
  isSortByValueEnabled: boolean = false,
  areTokensWithNoCostHidden: boolean = false,
) => {
  const isNewAccount = getIsNewAccount(balancesBySlug, tokenInfo);

  return Object
    .entries(balancesBySlug)
    .filter(([slug]) => (slug in tokenInfo.bySlug
      && (ALWAYS_ENABLED_TOKEN_SLUGS.has(slug) || !accountSettings.deletedSlugs?.includes(slug))))
    .map(([slug, balance]) => {
      const {
        symbol, name, image, decimals, cmcSlug, color, chain, tokenAddress, codeHash,
        type, price = 0, percentChange24h = 0, priceUsd,
      } = tokenInfo.bySlug[slug];

      const balanceBig = toBig(balance, decimals);
      const totalValue = balanceBig.mul(price).round(decimals).toString();
      const hasCost = balanceBig.mul(priceUsd ?? 0).gte(TINY_TRANSFER_MAX_COST);
      const isPricelessTokenWithBalance = PRICELESS_TOKEN_HASHES.has(codeHash!) && balance > 0n;
      const isAlwaysEnabled = ALWAYS_ENABLED_TOKEN_SLUGS.has(slug);

      const isEnabled = isAlwaysEnabled || (
        (isNewAccount && DEFAULT_ENABLED_TOKEN_SLUGS.includes(slug))
        || !areTokensWithNoCostHidden
        || (areTokensWithNoCostHidden && hasCost)
        || isPricelessTokenWithBalance
        || accountSettings.alwaysShownSlugs?.includes(slug)
      );

      const isDisabled = !isEnabled
        || (!isAlwaysEnabled && accountSettings.alwaysHiddenSlugs?.includes(slug));

      return {
        chain,
        symbol,
        slug,
        amount: balance,
        name,
        image,
        price,
        priceUsd,
        decimals,
        change24h: round(percentChange24h / 100, 4),
        isDisabled,
        cmcSlug,
        totalValue,
        color,
        tokenAddress,
        codeHash,
        type,
      } satisfies UserToken as UserToken;
    })
    .sort((tokenA, tokenB) => {
      if (isSortByValueEnabled || !accountSettings.orderedSlugs) {
        const priorityA = PRIORITY_TOKEN_SLUGS.indexOf(tokenA.slug);
        const priorityB = PRIORITY_TOKEN_SLUGS.indexOf(tokenB.slug);

        // If both tokens are prioritized and their balances match
        if (priorityA !== -1 && priorityB !== -1 && tokenA.totalValue === tokenB.totalValue) {
          return priorityA - priorityB;
        }

        // If one token is prioritized and the other is not
        if (priorityA !== -1 && priorityB === -1) return -1;
        if (priorityB !== -1 && priorityA === -1) return 1;

        return Number(tokenB.totalValue) - Number(tokenA.totalValue);
      }

      const indexA = accountSettings.orderedSlugs.indexOf(tokenA.slug);
      const indexB = accountSettings.orderedSlugs.indexOf(tokenB.slug);
      return indexA - indexB;
    });
}));

export function selectCurrentAccountTokens(global: GlobalState) {
  return selectAccountTokens(global, global.currentAccountId!);
}

export function selectCurrentAccountTokenBalance(global: GlobalState, slug: string) {
  return selectCurrentAccountState(global)?.balances?.bySlug[slug] ?? 0n;
}

export function selectCurrentToncoinBalance(global: GlobalState) {
  return selectCurrentAccountTokenBalance(global, TONCOIN.slug);
}

export function selectAccountTokens(global: GlobalState, accountId: string) {
  const balancesBySlug = selectAccountState(global, accountId)?.balances?.bySlug;
  if (!balancesBySlug || !global.tokenInfo) {
    return undefined;
  }

  const accountSettings = selectAccountSettings(global, accountId);
  const { areTokensWithNoCostHidden, isSortByValueEnabled } = global.settings;

  return selectAccountTokensMemoizedFor(accountId)(
    balancesBySlug,
    global.tokenInfo,
    accountSettings,
    isSortByValueEnabled,
    areTokensWithNoCostHidden,
  );
}

export function selectAccountTokenBySlug(global: GlobalState, slug: string) {
  const accountTokens = selectCurrentAccountTokens(global);
  return accountTokens?.find((token) => token.slug === slug);
}

export function selectTokenAddress(global: GlobalState, slug: string) {
  if (slug === TONCOIN.slug) return undefined;
  return selectToken(global, slug).tokenAddress!;
}

export function selectToken(global: GlobalState, slug: string) {
  return global.tokenInfo.bySlug[slug];
}

export function selectMycoin(global: GlobalState) {
  const { isTestnet } = global.settings;
  return selectToken(global, isTestnet ? MYCOIN_TESTNET.slug : MYCOIN.slug);
}

export function selectTokenByMinterAddress(global: GlobalState, minter: string) {
  return Object.values(global.tokenInfo.bySlug).find((token) => token.tokenAddress === minter);
}

export function selectChainTokenWithMaxBalanceSlow(global: GlobalState, chain: ApiChain): UserToken | undefined {
  return (selectCurrentAccountTokens(global) ?? [])
    .filter((token) => token.chain === chain)
    .reduce((maxToken, currentToken) => {
      const currentBalance = currentToken.priceUsd * Number(currentToken.amount);
      const maxBalance = maxToken ? maxToken.priceUsd * Number(maxToken.amount) : 0;

      return currentBalance > maxBalance ? currentToken : maxToken;
    });
}

const selectDaoPopularTokensMemoizedFor = withCache(() => memoize(
  (balancesBySlug: ApiBalanceBySlug, tokenInfo: GlobalState['tokenInfo']): UserToken[] => {
    return DAO_POPULAR_TOKEN_SLUGS.reduce((acc, slug) => {
      const info = tokenInfo.bySlug[slug] ?? TOKEN_INFO[slug];
      if (!info) return acc;

      return [...acc, {
        ...buildUserToken(info),
        amount: balancesBySlug[slug] ?? 0n,
      }];
    }, [] as UserToken[]);
  },
));

// Жетоны ДАО в группе «Популярные», даже если бэкенд не отдаёт их как isPopular.
export function selectDaoPopularTokens(global: GlobalState) {
  const balancesBySlug = selectCurrentAccountState(global)?.balances?.bySlug;
  if (!balancesBySlug || !global.tokenInfo) {
    return undefined;
  }

  return selectDaoPopularTokensMemoizedFor()(balancesBySlug, global.tokenInfo);
}
