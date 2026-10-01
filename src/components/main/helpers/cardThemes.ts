import type { ApiBalanceBySlug } from '../../../api/types';

import { CARD_THEME_UNLOCK_TOKEN_SLUGS } from '../../../config';

export interface CardTheme {
  /** Идентификатор, который хранится в настройках аккаунта */
  id: string;
  /** Глобальный класс, который подставляется в Card.module.scss */
  className?: string;
  /** Градиент для превью в пикере — должен совпадать с Card.module.scss */
  gradient: string;
}

export const DEFAULT_CARD_THEME_ID = 'default';

/**
 * Палитры оформления карточки кошелька. Значения `gradient` продублированы
 * из `Card.module.scss` и используются только для превью в пикере.
 */
export const CARD_THEMES: CardTheme[] = [
  { id: DEFAULT_CARD_THEME_ID, gradient: 'linear-gradient(125deg, #479DE2 0%, #367CCC 100%)' },
  { id: 'tegro', className: 'tegro', gradient: 'linear-gradient(125deg, #5E95DD 0%, #4469D4 100%)' },
  { id: 'red', className: 'red', gradient: 'linear-gradient(125deg, #C46D63 0%, #A54C4E 100%)' },
  { id: 'orange', className: 'orange', gradient: 'linear-gradient(125deg, #C49D5B 0%, #B67C47 100%)' },
  { id: 'green', className: 'green', gradient: 'linear-gradient(125deg, #72AB78 0%, #609554 100%)' },
  { id: 'sea', className: 'sea', gradient: 'linear-gradient(125deg, #6097C1 0%, #4583A3 100%)' },
  { id: 'purple', className: 'purple', gradient: 'linear-gradient(125deg, #7A6DD8 0%, #634CBB 100%)' },
  { id: 'pink', className: 'pink', gradient: 'linear-gradient(125deg, #AD6691 0%, #A14F8F 100%)' },
];

export function findCardTheme(id?: string): CardTheme | undefined {
  if (!id) return undefined;
  return CARD_THEMES.find((theme) => theme.id === id);
}

/** Класс темы для карточки; `undefined` — базовая карточка без темы */
export function getCardThemeClassName(id?: string): string | undefined {
  return findCardTheme(id)?.className;
}

/**
 * Палитра доступна, если у пользователя есть хотя бы 1 штука
 * любого жетона из CARD_THEME_UNLOCK_TOKEN_SLUGS.
 */
export function isCardThemeUnlocked(balancesBySlug?: ApiBalanceBySlug): boolean {
  if (!balancesBySlug) return false;

  for (const slug of CARD_THEME_UNLOCK_TOKEN_SLUGS) {
    if ((balancesBySlug[slug] ?? 0n) > 0n) return true;
  }

  return false;
}
