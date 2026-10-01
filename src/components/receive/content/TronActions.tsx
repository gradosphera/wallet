import React, { memo } from '../../../lib/teact/teact';

import buildClassName from '../../../util/buildClassName';

import useLang from '../../../hooks/useLang';

import styles from './TonActions.module.scss';

interface OwnProps {
  isStatic?: boolean;
  isLedger?: boolean;
  className?: string;
  onClose?: NoneToVoidFunction;
}

function TronActions({
  className,
  isStatic,
}: OwnProps) {
  const lang = useLang();

  const contentClassName = buildClassName(
    styles.actionButtons,
    isStatic && styles.actionButtonStatic,
    className,
  );

  if (!isStatic) {
    return undefined;
  }

  return (
    <div className={contentClassName}>
      <div className={buildClassName(styles.actionButton, styles.disabled)}>
        <i className={buildClassName(styles.actionIcon, 'icon-link')} aria-hidden />
        {lang('Create Deposit Link')}
        <i className={buildClassName(styles.iconChevronRight, 'icon-chevron-right')} aria-hidden />
      </div>
    </div>
  );
}

export default memo(TronActions);
