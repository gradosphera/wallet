import type { GlobalState } from '../../types';
import { MintCardState } from '../../types';

import { getAccentColorIndexFromNft } from '../../../util/accentColor';
import { isBaseAccentColorIndex } from '../../../util/accentColor/constants';
import { callActionInMain } from '../../../util/multitab';
import { IS_DELEGATED_BOTTOM_SHEET } from '../../../util/windowEnvironment';
import { findCardTheme } from '../../../components/main/helpers/cardThemes';
import { isCustomizationUnlocked } from '../../helpers';
import { addActionHandler, getGlobal, setGlobal } from '../../index';
import { resetHardware, updateCurrentAccountSettings, updateMintCards } from '../../reducers';
import { selectCurrentAccountState, selectIsHardwareAccount } from '../../selectors';

addActionHandler('openMintCardModal', (global): GlobalState => {
  return updateMintCards(global, { state: MintCardState.Initial });
});

addActionHandler('closeMintCardModal', (global): GlobalState => {
  return { ...global, currentMintCard: undefined };
});

addActionHandler('startCardMinting', (global, action, { type }): GlobalState => {
  if (selectIsHardwareAccount(global)) {
    global = resetHardware(global);
    global = updateMintCards(global, { state: MintCardState.ConnectHardware });
  } else {
    global = updateMintCards(global, { state: MintCardState.Password });
  }

  return global;
});

addActionHandler('clearMintCardError', (global): GlobalState => {
  return updateMintCards(global, { error: undefined });
});

addActionHandler('setCardBackgroundNft', (global, actions, { nft }) => {
  if (IS_DELEGATED_BOTTOM_SHEET) {
    callActionInMain('setCardBackgroundNft', { nft });
    return;
  }

  global = updateCurrentAccountSettings(global, { cardBackgroundNft: nft });
  setGlobal(global);
});

addActionHandler('clearCardBackgroundNft', (global) => {
  if (IS_DELEGATED_BOTTOM_SHEET) {
    callActionInMain('clearCardBackgroundNft');
    return;
  }

  global = updateCurrentAccountSettings(global, { cardBackgroundNft: undefined });
  setGlobal(global);
});

addActionHandler('installAccentColorFromNft', async (global, actions, { nft }) => {
  const accentColorIndex = await getAccentColorIndexFromNft(nft);

  global = getGlobal();
  global = updateCurrentAccountSettings(global, {
    accentColorNft: nft,
    accentColorIndex,
  });
  setGlobal(global);
});

addActionHandler('clearAccentColorFromNft', (global) => {
  return updateCurrentAccountSettings(global, {
    accentColorNft: undefined,
    accentColorIndex: undefined,
  });
});

addActionHandler('setAccentColor', (global, actions, { accentColorIndex }) => {
  if (IS_DELEGATED_BOTTOM_SHEET) {
    callActionInMain('setAccentColor', { accentColorIndex });
    return;
  }

  if (accentColorIndex !== undefined && !isBaseAccentColorIndex(accentColorIndex)) return;

  const balancesBySlug = selectCurrentAccountState(global)?.balances?.bySlug;
  if (!isCustomizationUnlocked(balancesBySlug)) return;

  global = updateCurrentAccountSettings(global, {
    accentColorNft: undefined,
    accentColorIndex,
  });
  setGlobal(global);
});

addActionHandler('setCardTheme', (global, actions, { themeId }) => {
  if (IS_DELEGATED_BOTTOM_SHEET) {
    callActionInMain('setCardTheme', { themeId });
    return;
  }

  if (themeId && !findCardTheme(themeId)) return;

  const balancesBySlug = selectCurrentAccountState(global)?.balances?.bySlug;
  if (!isCustomizationUnlocked(balancesBySlug)) return;

  global = updateCurrentAccountSettings(global, { cardTheme: themeId });
  setGlobal(global);
});
