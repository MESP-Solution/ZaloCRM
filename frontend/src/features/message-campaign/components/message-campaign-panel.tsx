'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { zaloAccountsApi } from '../../zalo-accounts/api/zalo-accounts-api';
import { authApi } from '../../auth/api/auth-api';
import type { ZaloAccount } from '../../zalo-accounts/types';
import type { CampaignFormData, PhoneEntry } from '../types';
import { messageCampaignApi } from '../api/message-campaign-api';
import { validateCampaign } from '../utils/campaign-validation';
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
  delayMinSeconds: 30,
  delayMaxSeconds: 60,
  maxRecipientsPerAccount: 20,
  skipFailedAccount: true,
  messageContent: '',
};

export function MessageCampaignPanel() {
  const [formData, setFormData] = useState<CampaignFormData>(DEFAULT_FORM);
  const [zaloAccounts, setZaloAccounts] = useState<ZaloAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountError, setAccountError] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [selectedEntries, setSelectedEntries] = useState<PhoneEntry[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadAccounts() {
      setLoadingAccounts(true);
      setAccountError('');
      try {
        const accounts = await zaloAccountsApi.list();
        if (!active) return;
        setZaloAccounts(accounts);
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
    setSubmitMessage('');

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
          phone: entry.inputPhoneNumber,
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
        setSubmitMessage(
          `Chiến dịch "${campaign.name}" đã được tạo và bắt đầu gửi (${campaign.queuedCount} người nhận).`,
        );
      } else {
        setSubmitMessage(
          `Chiến dịch "${campaign.name}" đã được lên lịch (${campaign.queuedCount} người nhận).`,
        );
      }
    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo chiến dịch.',
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
        <PhoneListTable
          selectedIds={selectedContactIds}
          onSelectedIdsChange={setSelectedContactIds}
          onSelectedEntriesChange={setSelectedEntries}
          onTotalChange={handleTotalChange}
        />

        <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <ZaloAccountSelector
            accounts={zaloAccounts}
            loading={loadingAccounts}
            selectedIds={formData.selectedZaloAccountIds}
            onChange={(selectedZaloAccountIds) => setFormData({ ...formData, selectedZaloAccountIds })}
          />
          <MessageComposerPanel formData={formData} previewRecipient={previewRecipient} onChange={setFormData} />
          <SendingSettingsPanel formData={formData} onChange={setFormData} />
          <CampaignReviewPanel
            blockers={validation.blockers}
            selectedAccountCount={selectedActiveAccounts.length}
            recipientCount={recipientCount}
            estimatedDurationLabel={validation.estimatedDurationLabel}
            submitting={submitting}
            submitMessage={submitMessage}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
