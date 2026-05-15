'use client';

import { useEffect, useState } from 'react';
import { campaignsApi } from '../api/campaigns-api';
import type { CampaignRecipient } from '../types';

interface Props {
  campaignId: string;
  refreshKey: number;
}

const PAGE_SIZE = 50;

export function CampaignRecipientsTable({ campaignId, refreshKey }: Props) {
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const res = await campaignsApi.getRecipients(campaignId, { page, limit: PAGE_SIZE });
        if (!active) return;
        setRecipients(res.data);
        setTotal(res.total);
      } catch {
        if (!active) return;
        setRecipients([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [campaignId, page, refreshKey]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-medium text-gray-700">Người nhận ({total})</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      ) : recipients.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">Không có người nhận.</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tên</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SĐT / Zalo ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Trạng thái</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Lỗi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recipients.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {r.recipientName || '-'}
                    {r.isFriend && (
                      <span className="ml-1.5 inline-flex rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                        Bạn bè
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{r.recipientPhone || r.recipientZaloId || '-'}</td>
                  <td className="px-4 py-2">
                    <RecipientStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-2 text-xs text-red-500">{r.errorMessage || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2">
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trang trước
          </button>
          <span className="text-xs text-gray-500">Trang {page}/{totalPages}</span>
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}

function RecipientStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    queued: { label: 'Chờ', className: 'bg-gray-100 text-gray-600' },
    sending: { label: 'Đang gửi', className: 'bg-blue-100 text-blue-700' },
    sent: { label: 'Đã gửi', className: 'bg-green-100 text-green-700' },
    failed: { label: 'Lỗi', className: 'bg-red-100 text-red-700' },
    skipped: { label: 'Bỏ qua', className: 'bg-yellow-100 text-yellow-700' },
  };
  const c = config[status] ?? config.queued;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}
