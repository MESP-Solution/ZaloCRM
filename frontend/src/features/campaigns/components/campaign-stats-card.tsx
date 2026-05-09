'use client';

import { useEffect, useState } from 'react';
import { campaignsApi } from '../api/campaigns-api';
import type { Campaign, CampaignStats } from '../types';
import { getQuotaColor } from '../../../lib/utils/quota-display';

interface Props {
  campaign: Campaign;
  refreshKey?: number;
}

export function CampaignStatsCard({ campaign, refreshKey }: Props) {
  const [stats, setStats] = useState<CampaignStats | null>(null);

  useEffect(() => {
    campaignsApi.getStats(campaign.id).then(setStats).catch(() => {});
  }, [campaign.id, refreshKey]);

  const total = campaign.queuedCount;
  const sent = campaign.sentCount;
  const failed = campaign.failedCount;
  const pending = total - sent - failed;
  const progressPercent = total > 0 ? Math.round((sent / total) * 100) : 0;

  const accountCount = stats?.accounts.length ?? 0;
  const dailyLimit = stats?.accounts[0]?.dailyLimit ?? 50;
  const dailyCapacity = accountCount * dailyLimit;
  const estimatedDays = dailyCapacity > 0 ? Math.ceil(pending / dailyCapacity) : 0;

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

      {stats && stats.accounts.length > 0 && (
        <>
          <div className="mt-4 border-t border-gray-100 pt-3">
            <h4 className="text-xs font-medium uppercase text-gray-500">Chi tiết tài khoản</h4>
            <div className="mt-2 space-y-2">
              {stats.accounts.map((account) => {
                const used = account.dailyLimit - account.remainingQuota;
                const usedPercent = account.dailyLimit > 0
                  ? Math.round((used / account.dailyLimit) * 100)
                  : 0;

                return (
                  <div key={account.accountId} className="rounded-md border border-gray-100 p-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-800">{account.displayName}</span>
                      <span className="text-xs text-gray-500">
                        {account.sentCount} đã gửi
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Quota hôm nay: {used}/{account.dailyLimit}</span>
                        <span>{usedPercent}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getQuotaColor(used, account.dailyLimit)}`}
                          style={{ width: `${Math.min(usedPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                    {account.status === 'quota_exhausted' && (
                      <div className="mt-1 text-xs text-red-500">Hết quota hôm nay</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {pending > 0 && estimatedDays > 0 && (
            <div className="mt-3 rounded-md bg-blue-50 p-2.5 text-sm text-blue-800">
              Còn lại ~<strong>{pending}</strong> người ·
              Quota {dailyCapacity}/ngày ·
              Hoàn thành trong ~<strong>{estimatedDays} ngày</strong>
            </div>
          )}
        </>
      )}
    </div>
  );
}
