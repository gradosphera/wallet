import { Address } from '@ton/core';

import safeExec from '../../util/safeExec';
import { trimStringByMaxBytes } from '../../util/text';
import { resolveOrValidate } from '../../util/validateAddress';
import { findTokenInfo } from './tokens';

interface TransferRow {
  receiver: string;
  amount: string;
  tokenIdentifier: string;
  comment?: string;
  resolvedTokenInfo?: { tokenAddress: string; symbol: string; name: string; decimals: number };
  resolvedAddress?: string;
}

export function isTonIdentifier(identifier: string): boolean {
  const lower = identifier.toLowerCase();
  return lower === 'ton' || lower === 'toncoin';
}

async function validateTokenIdentifier(tokenIdentifier: string): Promise<{
  isValid: boolean;
  error?: string;
  tokenInfo?: { tokenAddress: string; symbol: string; name: string; decimals: number };
}> {
  if (isTonIdentifier(tokenIdentifier)) {
    return { isValid: true };
  }

  try {
    const tokenInfo = await findTokenInfo(tokenIdentifier);
    if (!tokenInfo) {
      return {
        isValid: false,
        error: safeExec(() => Address.parse(tokenIdentifier))
          ? `Токен не найден по адресу «${tokenIdentifier}». Проверьте, что адрес токена указан верно.`
          : `Неверный идентификатор токена «${tokenIdentifier}». Укажите корректное название, символ или адрес master-контракта.`,
      };
    }

    if (!safeExec(() => Address.parse(tokenInfo.tokenAddress))) {
      return {
        isValid: false,
        error: `Неверный формат адреса токена «${tokenIdentifier}».`,
      };
    }

    return { isValid: true, tokenInfo };
  } catch (err: any) {
    return {
      isValid: false,
      error: err?.message || 'Не удалось проверить токен',
    };
  }
}

function isValidAmount(amount: string): boolean {
  const numAmount = Number(amount);
  return !Number.isNaN(numAmount) && numAmount > 0;
}

export async function validateAndProcessTransfer(transfer: {
  receiver: string;
  amount: string;
  tokenIdentifier: string;
  comment?: string;
}): Promise<{
    isValid: boolean;
    error?: string;
    processedTransfer?: TransferRow;
  }> {
  const { receiver, amount, tokenIdentifier, comment } = transfer;

  const { resolvedAddress, error } = await resolveOrValidate(receiver);
  if (error) {
    return { isValid: false, error };
  }

  // Validate amount
  if (!isValidAmount(amount)) {
    return {
      isValid: false,
      error: 'Некорректная сумма',
    };
  }

  // Validate and process token identifier
  try {
    const tokenValidationResult = await validateTokenIdentifier(tokenIdentifier);
    if (!tokenValidationResult.isValid) {
      return {
        isValid: false,
        error: tokenValidationResult.error || 'Неверный идентификатор токена',
      };
    }

    const processedTransfer: TransferRow = {
      receiver,
      amount,
      tokenIdentifier,
      comment: comment ? trimStringByMaxBytes(comment, 5000) : undefined,
      resolvedTokenInfo: tokenValidationResult.tokenInfo,
      resolvedAddress: resolvedAddress !== receiver ? resolvedAddress : undefined,
    };

    return {
      isValid: true,
      processedTransfer,
    };
  } catch (err) {
    return {
      isValid: false,
      error: err instanceof Error ? err.message : 'Неверный идентификатор токена',
    };
  }
}
