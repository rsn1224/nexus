import type React from 'react';
import Modal, { ModalActions } from '../ui/Modal';

interface KillTarget {
  pid: number;
  name: string;
}

interface KillConfirmModalProps {
  isOpen: boolean;
  killTarget: KillTarget | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function KillConfirmModal({
  isOpen,
  killTarget,
  onClose,
  onConfirm,
}: KillConfirmModalProps): React.ReactElement {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="プロセスの終了"
      size="sm"
      footer={
        <>
          <ModalActions.Close onClose={onClose}>キャンセル</ModalActions.Close>
          <ModalActions.Danger onConfirm={onConfirm}>終了する</ModalActions.Danger>
        </>
      }
    >
      <div className="font-mono text-[11px] text-text-primary">
        {killTarget && (
          <>
            「{killTarget.name}」(PID: {killTarget.pid}) を終了しますか？
            <br />
            <br />
            この操作は取り消せません。
          </>
        )}
      </div>
    </Modal>
  );
}
