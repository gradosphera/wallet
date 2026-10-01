import React, {
  memo, useMemo,
} from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';

import type { AnimationLevel, Theme } from '../../global/types';

import {
  ANIMATION_LEVEL_MAX,
  ANIMATION_LEVEL_MIN,
} from '../../config';
import { isCustomizationUnlocked } from '../../global/helpers';
import {
  selectCurrentAccountSettings,
  selectCurrentAccountState,
  selectIsCurrentAccountViewMode,
} from '../../global/selectors';
import { getBaseAccentColors } from '../../util/accentColor/constants';
import buildClassName from '../../util/buildClassName';
import switchAnimationLevel from '../../util/switchAnimationLevel';
import switchTheme from '../../util/switchTheme';
import { IS_ELECTRON, IS_WINDOWS } from '../../util/windowEnvironment';

import useAppTheme from '../../hooks/useAppTheme';
import useHistoryBack from '../../hooks/useHistoryBack';
import useLang from '../../hooks/useLang';
import useLastCallback from '../../hooks/useLastCallback';
import useScrolledState from '../../hooks/useScrolledState';

import Button from '../ui/Button';
import ModalHeader from '../ui/ModalHeader';
import Switcher from '../ui/Switcher';

import styles from './Settings.module.scss';

import darkThemeImg from '../../assets/theme/theme_dark.png';
import lightThemeImg from '../../assets/theme/theme_light.png';
import systemThemeImg from '../../assets/theme/theme_system.png';

interface StateProps {
  accentColorIndex?: number;
  isAccentPaletteAvailable: boolean;
}

interface OwnProps {
  isActive?: boolean;
  theme: Theme;
  handleBackClick: () => void;
  animationLevel: AnimationLevel;
  isInsideModal?: boolean;
  isTrayIconEnabled: boolean;
  onTrayIconEnabledToggle: VoidFunction;
}

const SWITCH_THEME_DURATION_MS = 300;
const THEME_OPTIONS = [{
  value: 'light',
  name: 'Light',
  icon: lightThemeImg,
}, {
  value: 'system',
  name: 'System',
  icon: systemThemeImg,
}, {
  value: 'dark',
  name: 'Dark',
  icon: darkThemeImg,
}];

function SettingsAppearance({
  isActive,
  theme,
  animationLevel,
  accentColorIndex,
  isAccentPaletteAvailable,
  isInsideModal,
  isTrayIconEnabled,
  onTrayIconEnabledToggle,
  handleBackClick,
}: OwnProps & StateProps) {
  const {
    setTheme,
    setAnimationLevel,
    setAccentColor,
  } = getActions();

  const lang = useLang();

  useHistoryBack({
    isActive,
    onBack: handleBackClick,
  });

  const {
    handleScroll: handleContentScroll,
    isScrolled,
  } = useScrolledState();

  const appTheme = useAppTheme(theme);

  const accentColors = useMemo(() => getBaseAccentColors(appTheme), [appTheme]);

  function renderColorButton(color?: string, index?: number) {
    const isSelected = accentColorIndex === index;

    return (
      <button
        key={color || 'default'}
        type="button"
        disabled={isSelected}
        style={color ? `--current-accent-color: ${color}` : undefined}
        className={buildClassName(styles.colorButton, isSelected && styles.colorButtonCurrent)}
        aria-label={lang('Change Palette')}
        onClick={() => setAccentColor({ accentColorIndex: index })}
      />
    );
  }

  const handleThemeChange = useLastCallback((newTheme: string) => {
    document.documentElement.classList.add('no-transitions');
    setTheme({ theme: newTheme as Theme });
    switchTheme(newTheme as Theme, isInsideModal);
    setTimeout(() => {
      document.documentElement.classList.remove('no-transitions');
    }, SWITCH_THEME_DURATION_MS);
  });

  const handleAnimationLevelToggle = useLastCallback(() => {
    const level = animationLevel === ANIMATION_LEVEL_MIN ? ANIMATION_LEVEL_MAX : ANIMATION_LEVEL_MIN;
    setAnimationLevel({ level });
    switchAnimationLevel(level);
  });

  function renderThemes() {
    return THEME_OPTIONS.map(({ name, value, icon }) => {
      return (
        <div
          key={value}
          className={buildClassName(styles.theme, value === theme && styles.theme_active)}
          onClick={() => handleThemeChange(value)}
        >
          <div className={buildClassName(styles.themeIcon, value === theme && styles.themeIcon_active)}>
            <img src={icon} alt="" className={styles.themeImg} aria-hidden />
          </div>
          <span>{lang(name)}</span>
        </div>
      );
    });
  }

  return (
    <div className={styles.slide}>
      {isInsideModal ? (
        <ModalHeader
          title={lang('Appearance')}
          withNotch={isScrolled}
          onBackButtonClick={handleBackClick}
          className={styles.modalHeader}
        />
      ) : (
        <div className={buildClassName(styles.header, 'with-notch-on-scroll', isScrolled && 'is-scrolled')}>
          <Button isSimple isText onClick={handleBackClick} className={styles.headerBack}>
            <i className={buildClassName(styles.iconChevron, 'icon-chevron-left')} aria-hidden />
            <span>{lang('Back')}</span>
          </Button>
          <span className={styles.headerTitle}>{lang('Appearance')}</span>
        </div>
      )}

      <div
        className={buildClassName(styles.content, 'custom-scroll')}
        onScroll={handleContentScroll}
      >
        <p className={styles.blockTitle}>{lang('Theme')}</p>
        <div className={styles.settingsBlock}>
          <div className={styles.themeWrapper}>
            {renderThemes()}
          </div>
        </div>

        {isAccentPaletteAvailable && (
          <>
            <p className={styles.blockTitle}>{lang('Palette')}</p>
            <div className={styles.block}>
              <div className={styles.colorList}>
                {renderColorButton()}
                {accentColors.map(({ color, index }) => renderColorButton(color, index))}
              </div>
            </div>
          </>
        )}

        <p className={styles.blockTitle}>{lang('Other')}</p>
        <div className={styles.settingsBlock}>
          <div className={buildClassName(styles.item, styles.item_small)} onClick={handleAnimationLevelToggle}>
            {lang('Enable Animations')}

            <Switcher
              className={styles.menuSwitcher}
              label={lang('Enable Animations')}
              checked={animationLevel !== ANIMATION_LEVEL_MIN}
            />
          </div>
          {IS_ELECTRON && IS_WINDOWS && (
            <div className={buildClassName(styles.item, styles.item_small)} onClick={onTrayIconEnabledToggle}>
              {lang('Display Tray Icon')}

              <Switcher
                className={styles.menuSwitcher}
                label={lang('Display Tray Icon')}
                checked={isTrayIconEnabled}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(withGlobal<OwnProps>((global): StateProps => {
  const balancesBySlug = selectCurrentAccountState(global)?.balances?.bySlug;

  return {
    accentColorIndex: selectCurrentAccountSettings(global)?.accentColorIndex,
    isAccentPaletteAvailable: !selectIsCurrentAccountViewMode(global) && isCustomizationUnlocked(balancesBySlug),
  };
})(SettingsAppearance));
