'use client';

import { useState } from 'react';
import type { CampaignStatus } from '../types';
import { ConfirmModal } from '../../../lib/ui/confirm-modal';

interface Props {
  status: CampaignStatus;
  loading: boolean;
  onAction: (action: 'dispatch' | 'pause' | 'resume' | 'cancel') => void;
}

export function CampaignActionBar({ status, loading, onAction }: Props) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const canDispatch = status === 'draft' || status === 'queued';
  const canPause = status === 'sending';
  const canResume = status.startsWith('paused_');
  const canCancel = canDispatch || canPause || canResume;
  const noActions = status === 'completed' || status === 'cancelled' || status === 'failed';

  if (noActions) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canDispatch && (
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
            onClick={() => onAction('dispatch')}
          >
            Bắt đầu gửi
          </button>
        )}
        {canPause && (
          <button
            type="button"
            className="rounded-md bg-yellow-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
            disabled={loading}
            onClick={() => onAction('pause')}
          >
            Tạm dừng
          </button>
        )}
        {canResume && (
          <button
            type="button"
            className="rounded-md bg-green-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            disabled={loading}
            onClick={() => onAction('resume')}
          >
            Tiếp tục gửi
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            className="rounded-md bg-red-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            disabled={loading}
            onClick={() => setShowCancelConfirm(true)}
          >
            Hủy chiến dịch
          </button>
        )}
      </div>

      {showCancelConfirm && (
        <ConfirmModal
          title="Hủy chiến dịch"
          message="Bạn chắc chắn muốn hủy chiến dịch này? Các tin nhắn chưa gửi sẽ không được gửi nữa."
          confirmLabel="Hủy chiến dịch"
          variant="danger"
          loading={loading}
          onConfirm={() => {
            setShowCancelConfirm(false);
            onAction('cancel');
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </>
  );
}
