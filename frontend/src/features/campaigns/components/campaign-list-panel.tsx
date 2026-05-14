'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { campaignsApi } from '../api/campaigns-api';
import type { Campaign, CampaignStatus } from '../types';
import { CampaignStatusBadge } from './campaign-status-badge';
import { ConfirmModal } from '../../../lib/ui/confirm-modal';
import { useToast } from '../../../lib/ui/toast-context';

const DELETABLE_STATUSES: CampaignStatus[] = ['draft', 'completed', 'cancelled', 'failed'];

function canDelete(status: CampaignStatus): boolean {
  return DELETABLE_STATUSES.includes(status);
}

export function CampaignListPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await campaignsApi.list();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách chiến dịch.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await campaignsApi.deleteCampaign(deleteTarget.id);
      toast(`Đã xóa chiến dịch "${deleteTarget.name}"`, 'success');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xóa chiến dịch thất bại.', 'error');
    } finally {
      setDeleting(false);
    }
  }

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
    <>
      <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[750px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tên chiến dịch</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tiến độ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Ngày tạo</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.map((campaign) => {
              const total = campaign.queuedCount;
              const sent = campaign.sentCount;
              const failed = campaign.failedCount;
              const progressPercent = total > 0 ? Math.round((sent / total) * 100) : 0;

              return (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/campaigns/${campaign.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {campaign.name}
                      </Link>
                      {campaign.campaignType === 'friend' ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Bạn bè</span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Người lạ</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <CampaignStatusBadge status={campaign.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-32">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{sent}/{total}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      {failed > 0 && (
                        <span className="mt-0.5 block text-xs text-red-500">{failed} lỗi</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(campaign.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Chi tiết
                      </Link>
                      {canDelete(campaign.status) && (
                        <button
                          type="button"
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                          onClick={() => setDeleteTarget(campaign)}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ConfirmModal
          title="Xóa chiến dịch"
          message={`Bạn chắc chắn muốn xóa chiến dịch "${deleteTarget.name}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          variant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
