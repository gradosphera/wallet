import React, { memo, useEffect } from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';

import { selectIsMultichainAccount } from '../../global/selectors';
import buildClassName from '../../util/buildClassName';
import { IS_IOS_APP } from '../../util/windowEnvironment';

import { useDeviceScreen } from '../../hooks/useDeviceScreen';
import useLang from '../../hooks/useLang';

import Modal from '../ui/Modal';
import ModalHeader from '../ui/ModalHeader';
import Content from './Content';

import styles from './ReceiveModal.module.scss';

type StateProps = {
  isOpen?: boolean;
  isMultichainAccount: boolean;
};

function ReceiveModal({
  isOpen,
  isMultichainAccount,
}: StateProps) {
  const { closeReceiveModal } = getActions();

  const lang = useLang();

  const { isLandscape } = useDeviceScreen();
  const modalTitle = lang('Add');

  useEffect(() => {
    if (isOpen && isLandscape) {
      closeReceiveModal();
    }
  }, [isLandscape, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      dialogClassName={IS_IOS_APP ? styles.iosModalDialog : styles.modalDialog}
      nativeBottomSheetKey="receive"
      onClose={closeReceiveModal}
    >
      <ModalHeader
        title={modalTitle}
        className={buildClassName(styles.receiveHeader, !isMultichainAccount && styles.receiveHeaderNoTabs)}
        onClose={closeReceiveModal}
      />
      <Content
        isOpen={isOpen}
        onClose={closeReceiveModal}
      />
    </Modal>
  );
}

export default memo(withGlobal((global): StateProps => {
  return {
    isOpen: global.isReceiveModalOpen,
    isMultichainAccount: selectIsMultichainAccount(global, global.currentAccountId!),
  };
})(ReceiveModal));
