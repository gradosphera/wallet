import React, { memo } from '../../../../lib/teact/teact';
import { withGlobal } from '../../../../global';

import { IS_CORE_WALLET, IS_EXTENSION } from '../../../../config';
import { selectIsCurrentAccountViewMode } from '../../../../global/selectors';
import buildClassName from '../../../../util/buildClassName';
import { IS_ELECTRON } from '../../../../util/windowEnvironment';

import { useDeviceScreen } from '../../../../hooks/useDeviceScreen';

import AccountSelector from './AccountSelector';
import QrScannerButton from './actionButtons/QrScannerButton';
import SettingsButton from './actionButtons/SettingsButton';
import ToggleLayoutButton from './actionButtons/ToggleLayoutButton';
import ToggleSensitiveDataButton from './actionButtons/ToggleSensitiveDataButton';

import styles from './Header.module.scss';

export const HEADER_HEIGHT_REM = 3;

interface OwnProps {
  isScrolled?: boolean;
  withBalance?: boolean;
  areTabsStuck?: boolean;
}

interface StateProps {
  isViewMode?: boolean;
  isSensitiveDataHidden: boolean;
}

function Header({
  isViewMode,
  withBalance,
  areTabsStuck,
  isScrolled,
  isSensitiveDataHidden,
}: OwnProps & StateProps) {
  const { isPortrait } = useDeviceScreen();
  const canToggleAppLayout = IS_EXTENSION || IS_ELECTRON;

  if (isPortrait) {
    const fullClassName = buildClassName(
      styles.header,
      areTabsStuck && styles.areTabsStuck,
      isScrolled && styles.isScrolled,
    );
    const iconsAmount = 1 + (canToggleAppLayout ? 1 : 0);

    return (
      <div className={fullClassName}>
        <div className={styles.headerInner} style={`--icons-amount: ${iconsAmount}`}>
          <QrScannerButton isViewMode={isViewMode} />
          <AccountSelector withBalance={withBalance} withAccountSelector={!IS_CORE_WALLET} />

          <div className={styles.portraitActions}>
            <ToggleSensitiveDataButton isSensitiveDataHidden={isSensitiveDataHidden} />
            {canToggleAppLayout && <ToggleLayoutButton />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.landscapeActions}>
          <ToggleSensitiveDataButton isSensitiveDataHidden={isSensitiveDataHidden} />
          <QrScannerButton isViewMode={isViewMode} />
        </div>

        <AccountSelector withBalance={withBalance} withAccountSelector={!IS_CORE_WALLET} />

        <div className={styles.landscapeActions}>
          {canToggleAppLayout && <ToggleLayoutButton />}
          <SettingsButton />
        </div>
      </div>
    </div>
  );
}

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const {
      settings: {
        isSensitiveDataHidden,
      },
    } = global;

    const isViewMode = selectIsCurrentAccountViewMode(global);

    return {
      isViewMode,
      isSensitiveDataHidden: Boolean(isSensitiveDataHidden),
    };
  },
  (global, _, stickToFirst) => stickToFirst(global.currentAccountId),
)(Header));
