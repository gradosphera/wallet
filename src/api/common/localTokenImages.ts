import type { ApiTokenWithPrice } from '../../api/types';

import { BLAGO } from '../../config';

import blagoImage from '../../assets/coins/jetton_blago.svg';

/**
 * Локальные иконки жетонов. Нужны, чтобы не ходить в сеть за картинкой:
 * webpack отдаёт их как файл из бандла, поэтому лишних запросов не будет.
 *
 * Применяются принудительно после слияния с данными бэкенда, так как бэкенд
 * отдаёт `image` с приоритетом и иначе перекрыл бы локальный файл.
 */
const LOCAL_TOKEN_IMAGES: Record<string, string> = {
  [BLAGO.slug]: blagoImage,
};

export function getLocalTokenImage(slug: string): string | undefined {
  return LOCAL_TOKEN_IMAGES[slug];
}

/** Возвращает копию токена с локальной иконкой, если она есть для этого slug */
export function withLocalTokenImage<T extends ApiTokenWithPrice>(token: T): T {
  const localImage = LOCAL_TOKEN_IMAGES[token.slug];

  return localImage ? { ...token, image: localImage } : token;
}
