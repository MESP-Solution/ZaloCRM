'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { campaignsApi } from '../api/campaigns-api';
import type { Campaign } from '../types';
import { CampaignStatusBadge } from './campaign-status-badge';

export function CampaignListPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await campaignsApi.list();
        if (!active) return;
        setCampaigns(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Không tải được danh sách chiến dịch.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        <span className="ml-3 text-sm text-gray-500">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
        <p className="text-sm text-gray-500">Chưa có chiến dịch nào.</p>
        <Link href="/message-with-phone" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
          Tạo chiến dịch mới
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full min-w-[700px]">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tên chiến dịch</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Trạng thái</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tiến độ</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Ngày tạo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link href={`/campaigns/${campaign.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                  {campaign.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <CampaignStatusBadge status={campaign.status} />
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {campaign.sentCount}/{campaign.queuedCount} đã gửi
                {campaign.failedCount > 0 && (
                  <span className="ml-1 text-red-500">({campaign.failedCount} lỗi)</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {new Date(campaign.createdAt).toLocaleDateString('vi-VN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
