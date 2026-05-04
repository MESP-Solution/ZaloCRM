'use client';

import type { Campaign } from '../types';

interface Props {
  campaign: Campaign;
}

export function CampaignStatsCard({ campaign }: Props) {
  const total = campaign.queuedCount;
  const sent = campaign.sentCount;
  const failed = campaign.failedCount;
  const pending = total - sent - failed;
  const progressPercent = total > 0 ? Math.round((sent / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-medium text-gray-700">Tiến độ gửi</h3>

      <div className="mt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{sent}/{total} đã gửi</span>
          <span className="font-medium text-gray-900">{progressPercent}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-md bg-green-50 p-2.5 text-center">
          <div className="text-lg font-semibold text-green-700">{sent}</div>
          <div className="text-xs text-green-600">Đã gửi</div>
        </div>
        <div className="rounded-md bg-red-50 p-2.5 text-center">
          <div className="text-lg font-semibold text-red-700">{failed}</div>
          <div className="text-xs text-red-600">Thất bại</div>
        </div>
        <div className="rounded-md bg-gray-50 p-2.5 text-center">
          <div className="text-lg font-semibold text-gray-700">{pending}</div>
          <div className="text-xs text-gray-500">Chờ gửi</div>
        </div>
      </div>
    </div>
  );
}
