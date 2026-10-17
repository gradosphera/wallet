import React, { memo } from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import buildClassName from '../../../util/buildClassName';

import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';

import styles from './TonActions.module.scss';

interface OwnProps {
  isStatic?: boolean;
  isLedger?: boolean;
  className?: string;
  onClose?: NoneToVoidFunction;
}

function TonActions({
  className,
  isStatic,
  onClose,
}: OwnProps) {
  const { openInvoiceModal, closeReceiveModal } = getActions();

  const lang = useLang();

  const handleReceiveClick = useLastCallback(() => {
    closeReceiveModal();
    openInvoiceModal();
    onClose?.();
  });

  const contentClassName = buildClassName(
    styles.actionButtons,
    isStatic && styles.actionButtonStatic,
    className,
  );

  return (
    <div className={contentClassName}>
      <div className={styles.actionButton} onClick={handleReceiveClick}>
        <i className={buildClassName(styles.actionIcon, 'icon-link')} aria-hidden />
        {lang('Create Deposit Link')}
        <i className={buildClassName(styles.iconChevronRight, 'icon-chevron-right')} aria-hidden />
      </div>
    </div>
  );
}

export default memo(TonActions);
