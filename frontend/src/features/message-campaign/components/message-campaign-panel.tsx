'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { zaloAccountsApi } from '../../zalo-accounts/api/zalo-accounts-api';
import { authApi } from '../../auth/api/auth-api';
import type { ZaloAccount } from '../../zalo-accounts/types';
import type { CampaignFormData, PhoneEntry } from '../types';
import { messageCampaignApi } from '../api/message-campaign-api';
import { validateCampaign } from '../utils/campaign-validation';
import { useToast } from '../../../lib/ui/toast-context';
import { CampaignReviewPanel } from './campaign-review-panel';
import { CampaignSummaryStrip } from './campaign-summary-strip';
import { MessageComposerPanel } from './message-composer-panel';
import { PhoneListTable } from './phone-list-table';
import { SendingSettingsPanel } from './sending-settings-panel';
import { ZaloAccountSelector } from './zalo-account-selector';

const DEFAULT_FORM: CampaignFormData = {
  campaignName: '',
  selectedZaloAccountIds: [],
  startMode: 'now',
  startDate: '',
  messageContent: '',
};

export function MessageCampaignPanel() {
  const searchParams = useSearchParams();
  const isFromGroup = searchParams.get('source') === 'group';
  const [formData, setFormData] = useState<CampaignFormData>(DEFAULT_FORM);
  const [zaloAccounts, setZaloAccounts] = useState<ZaloAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountError, setAccountError] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [selectedEntries, setSelectedEntries] = useState<PhoneEntry[]>([]);
  const [groupEntries, setGroupEntries] = useState<PhoneEntry[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [quotaMap, setQuotaMap] = useState<Map<string, { used: number; dailyLimit: number }>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    if (!isFromGroup) return;
    try {
      const raw = sessionStorage.getItem('group-campaign-recipients');
      const accountId = sessionStorage.getItem('group-campaign-account-id');
      if (!raw) return;

      const recipients = JSON.parse(raw) as { zaloId: string; name: string }[];
      const entries: PhoneEntry[] = recipients.map((r, i) => ({
        id: `group-${i}-${r.zaloId}`,
        phoneNumber: r.zaloId,
        inputPhoneNumber: r.zaloId,
        zaloName: r.name,
        avatarUrl: '',
        zaloUid: r.zaloId,
      }));

      setGroupEntries(entries);
      setSelectedEntries(entries);
      setTotalContacts(entries.length);

      if (accountId) {
        setFormData((prev) => ({
          ...prev,
          selectedZaloAccountIds: [accountId],
        }));
      }

      sessionStorage.removeItem('group-campaign-recipients');
      sessionStorage.removeItem('group-campaign-account-id');
    } catch { /* ignore parse errors */ }
  }, [isFromGroup]);

  useEffect(() => {
    let active = true;

    async function loadAccounts() {
      setLoadingAccounts(true);
      setAccountError('');
      try {
        const [accounts, quotas] = await Promise.all([
          zaloAccountsApi.list(),
          zaloAccountsApi.getQuota().catch(() => []),
        ]);
        if (!active) return;
        setZaloAccounts(accounts);
        setQuotaMap(new Map(quotas.map((q) => [q.accountId, { used: q.used, dailyLimit: q.dailyLimit }])));
      } catch (error) {
        if (!active) return;
        setAccountError(error instanceof Error ? error.message : 'Không tải được tài khoản Zalo.');
      } finally {
        if (active) setLoadingAccounts(false);
      }
    }

    loadAccounts();

    return () => {
      active = false;
    };
  }, []);

  const selectedActiveAccounts = useMemo(
    () =>
      zaloAccounts.filter(
        (account) =>
          formData.selectedZaloAccountIds.includes(account.id) &&
          account.status === 'active',
      ),
    [formData.selectedZaloAccountIds, zaloAccounts],
  );
  const handleTotalChange = useCallback((t: number) => setTotalContacts(t), []);
  const recipientCount = selectedEntries.length;
  const validation = validateCampaign(formData, selectedEntries, zaloAccounts);
  const previewRecipient = selectedEntries[0];

  async function handleSubmit() {
    setSubmitting(true);

    try {
      const meResponse = await authApi.me();
      const customerId = meResponse.user.id;

      let imageFilePath: string | undefined;
      if (formData.imageFile) {
        const uploadResult = await messageCampaignApi.uploadImage(formData.imageFile);
        imageFilePath = uploadResult.filePath;
      }

      const campaign = await messageCampaignApi.createCampaign({
        customerId,
        name: formData.campaignName.trim(),
        messageText: formData.messageContent.trim(),
        zaloAccountIds: selectedActiveAccounts.map((a) => a.id),
        recipients: selectedEntries.map((entry) => ({
          phone: isFromGroup ? undefined : entry.inputPhoneNumber,
          zaloId: entry.zaloUid,
          name: entry.zaloName,
          gender: entry.gender,
        })),
        scheduleAt:
          formData.startMode === 'scheduled'
            ? new Date(formData.startDate).toISOString()
            : undefined,
        imageFilePath,
      });

      if (formData.startMode === 'now') {
        await messageCampaignApi.dispatchCampaign(campaign.id);
        toast(
          `Chiến dịch "${campaign.name}" đã bắt đầu gửi (${campaign.queuedCount} người nhận).`,
          'success',
        );
      } else {
        toast(
          `Chiến dịch "${campaign.name}" đã được lên lịch (${campaign.queuedCount} người nhận).`,
          'success',
        );
      }
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo chiến dịch.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <CampaignSummaryStrip
        selectedAccountCount={selectedActiveAccounts.length}
        selectedRecipientCount={recipientCount}
        totalContactCount={totalContacts}
        estimatedDurationLabel={validation.estimatedDurationLabel}
        blockerCount={validation.blockers.length}
      />

      {accountError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{accountError}</div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        {groupEntries.length > 0 ? (
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-base font-semibold text-gray-950">
              Người nhận từ nhóm ({groupEntries.length})
            </h2>
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-3 py-2">Tên</th>
                    <th className="px-3 py-2">Zalo ID</th>
                  </tr>
                </thead>
                <tbody>
                  {groupEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100">
                      <td className="px-3 py-2 text-gray-900">{entry.zaloName}</td>
                      <td className="px-3 py-2 text-gray-500">{entry.zaloUid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <PhoneListTable
            selectedIds={selectedContactIds}
            onSelectedIdsChange={setSelectedContactIds}
            onSelectedEntriesChange={setSelectedEntries}
            onTotalChange={handleTotalChange}
          />
        )}

        <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <ZaloAccountSelector
            accounts={zaloAccounts}
            loading={loadingAccounts}
            selectedIds={formData.selectedZaloAccountIds}
            quotaMap={quotaMap}
            onChange={(selectedZaloAccountIds) => setFormData({ ...formData, selectedZaloAccountIds })}
          />
          <MessageComposerPanel formData={formData} previewRecipient={previewRecipient} onChange={setFormData} />
          <SendingSettingsPanel formData={formData} onChange={setFormData} />
          <CampaignReviewPanel
            blockers={validation.blockers}
            selectedAccountCount={selectedActiveAccounts.length}
            recipientCount={recipientCount}
            estimatedDurationLabel={validation.estimatedDurationLabel}
            accountNames={selectedActiveAccounts.map((a) => a.displayName)}
            avgDelaySeconds={30}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
