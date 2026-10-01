import React, { memo } from '../../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../../global';

import { selectCurrentAccountSettings } from '../../../../global/selectors';
import buildClassName from '../../../../util/buildClassName';
import { CARD_THEMES, DEFAULT_CARD_THEME_ID } from '../../helpers/cardThemes';

import useLang from '../../../../hooks/useLang';

import Modal from '../../../ui/Modal';

import styles from './CardThemePicker.module.scss';

interface OwnProps {
  isOpen?: boolean;
  onClose: NoneToVoidFunction;
}

interface StateProps {
  cardTheme?: string;
}

function CardThemePicker({ isOpen, cardTheme, onClose }: OwnProps & StateProps) {
  const { setCardTheme } = getActions();
  const lang = useLang();

  const handleSelect = (themeId: string) => {
    setCardTheme({ themeId });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hasCloseButton
      title={lang('Card Palette')}
    >
      <div className={styles.slide}>
        <p className={styles.description}>{lang('Choose a card palette available for BLAGO holders')}</p>

        <div className={styles.grid}>
          {CARD_THEMES.map((theme) => {
            const isSelected = (cardTheme ?? DEFAULT_CARD_THEME_ID) === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                className={buildClassName(styles.item, isSelected && styles.item_active)}
                style={`--card-gradient: ${theme.gradient};`}
                aria-pressed={isSelected}
                aria-label={lang('Change Palette')}
                onClick={() => handleSelect(theme.id)}
              >
                <span className={styles.swatch} aria-hidden />
                {isSelected && <i className={buildClassName('icon-check', styles.check)} aria-hidden />}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

export default memo(withGlobal((global): StateProps => ({
  cardTheme: selectCurrentAccountSettings(global)?.cardTheme,
}))(CardThemePicker));
