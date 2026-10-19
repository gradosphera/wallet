import React, { memo } from '../../lib/teact/teact';

import styles from './LoadingPage.module.scss';

import blagoLogo from '../../assets/coins/blago-logo.svg';

function LoadingPage() {
  return (
    <div className={styles.loadingContainer}>
      <span className={styles.logo} aria-hidden style={`--logo-url: url(${blagoLogo})`} />
    </div>
  );
}

export default memo(LoadingPage);
