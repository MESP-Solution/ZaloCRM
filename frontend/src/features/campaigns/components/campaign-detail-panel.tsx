'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { campaignsApi } from '../api/campaigns-api';
import type { Campaign } from '../types';
import { CampaignActionBar } from './campaign-action-bar';
import { CampaignRecipientsTable } from './campaign-recipients-table';
import { CampaignStatsCard } from './campaign-stats-card';
import { CampaignStatusBadge } from './campaign-status-badge';

interface Props {
  campaignId: string;
}

export function CampaignDetailPanel({ campaignId }: Props) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCampaign = useCallback(async () => {
    try {
      const data = await campaignsApi.getById(campaignId);
      setCampaign(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được chiến dịch.');
      return null;
    }
  }, [campaignId]);

  useEffect(() => {
    let active = true;

    async function init() {
      setLoading(true);
      const data = await fetchCampaign();
      if (!active) return;
      if (data) setCampaign(data);
      setLoading(false);
    }

    init();
    return () => { active = false; };
  }, [fetchCampaign]);

  useEffect(() => {
    if (campaign?.status === 'sending') {
      intervalRef.current = setInterval(async () => {
        const data = await fetchCampaign();
        if (data) setRefreshKey((k) => k + 1);
      }, 5000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [campaign?.status, fetchCampaign]);

  async function handleAction(action: 'dispatch' | 'pause' | 'resume' | 'cancel') {
    setActionLoading(true);
    try {
      if (action === 'dispatch') await campaignsApi.dispatch(campaignId);
      else if (action === 'pause') await campaignsApi.pause(campaignId);
      else if (action === 'resume') await campaignsApi.resume(campaignId);
      else if (action === 'cancel') await campaignsApi.cancel(campaignId);

      const updated = await fetchCampaign();
      if (updated) setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || 'Không tìm thấy chiến dịch.'}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/campaigns" className="hover:text-blue-600">Chiến dịch</Link>
        <span>/</span>
        <span className="text-gray-900">{campaign.name}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-950">{campaign.name}</h1>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <CampaignActionBar status={campaign.status} loading={actionLoading} onAction={handleAction} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <CampaignRecipientsTable campaignId={campaignId} refreshKey={refreshKey} />
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <CampaignStatsCard campaign={campaign} />
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
            <div><strong>Ngày tạo:</strong> {new Date(campaign.createdAt).toLocaleString('vi-VN')}</div>
            {campaign.scheduleAt && (
              <div className="mt-1"><strong>Hẹn gửi:</strong> {new Date(campaign.scheduleAt).toLocaleString('vi-VN')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
