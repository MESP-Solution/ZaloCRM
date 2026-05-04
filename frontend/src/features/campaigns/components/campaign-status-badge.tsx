'use client';

import type { CampaignStatus } from '../types';

const STATUS_CONFIG: Record<CampaignStatus, { label: string; className: string }> = {
  draft: { label: 'Nháp', className: 'bg-gray-100 text-gray-700' },
  queued: { label: 'Chờ gửi', className: 'bg-indigo-100 text-indigo-700' },
  sending: { label: 'Đang gửi', className: 'bg-blue-100 text-blue-700' },
  paused_manual: { label: 'Tạm dừng', className: 'bg-yellow-100 text-yellow-700' },
  paused_quota_exhausted: { label: 'Hết quota', className: 'bg-orange-100 text-orange-700' },
  paused_no_available_account: { label: 'Không có TK', className: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Thất bại', className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Đã huỷ', className: 'bg-gray-100 text-gray-500' },
};

interface Props {
  status: CampaignStatus;
}

export function CampaignStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
