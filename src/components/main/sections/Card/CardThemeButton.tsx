import React, { memo } from '../../../../lib/teact/teact';

import useFlag from '../../../../hooks/useFlag';
import useLang from '../../../../hooks/useLang';

import CardThemePicker from './CardThemePicker';

import styles from './CardThemeButton.module.scss';

function CardThemeButton() {
  const lang = useLang();
  const [isOpen, openPicker, closePicker] = useFlag(false);

  return (
    <>
      <button
        type="button"
        className={styles.button}
        aria-label={lang('Card Palette')}
        title={lang('Card Palette')}
        onClick={openPicker}
      >
        <i className="icon-pen" aria-hidden />
      </button>
      <CardThemePicker isOpen={isOpen} onClose={closePicker} />
    </>
  );
}

export default memo(CardThemeButton);
