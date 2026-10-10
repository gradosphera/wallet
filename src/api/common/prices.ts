import type { ApiBaseCurrency } from '../types';

import { BLAGO_CURRENCY, DEFAULT_PRICE_CURRENCY, PRICE_CURRENCY_FALLBACK } from '../../config';
import { storage } from '../storages';

export async function getBaseCurrency() {
  return (await storage.getItem('baseCurrency')) ?? DEFAULT_PRICE_CURRENCY;
}

export function setBaseCurrency(currency: ApiBaseCurrency) {
  return storage.setItem('baseCurrency', currency);
}

// `BLAGO` is a display-only currency without a market price, so backend price
// requests must fall back to a currency the backend supports.
export function getApiBaseCurrency(currency: ApiBaseCurrency): ApiBaseCurrency {
  return currency === BLAGO_CURRENCY ? PRICE_CURRENCY_FALLBACK : currency;
}
