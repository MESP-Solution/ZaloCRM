'use client';

import { useEffect, useMemo, useState } from 'react';
import { zaloAccountsApi } from '../../zalo-accounts/api/zalo-accounts-api';
import type { ZaloAccount } from '../../zalo-accounts/types';
import type { CampaignFormData, MessageCampaignSubmitPayload, PhoneEntry } from '../types';
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
  const [phoneEntries, setPhoneEntries] = useState<PhoneEntry[]>([]);
  const [zaloAccounts, setZaloAccounts] = useState<ZaloAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountError, setAccountError] = useState('');
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
  const recipientCount = phoneEntries.length;
  const validation = validateCampaign(formData, phoneEntries, zaloAccounts);
  const previewRecipient = phoneEntries[0];

  function buildSubmitPayload(): MessageCampaignSubmitPayload {
    return {
      name: formData.campaignName.trim(),
      messageText: formData.messageContent.trim(),
      zaloAccountIds: selectedActiveAccounts.map((account) => account.id),
      recipients: phoneEntries.map((entry) => ({
        name: entry.zaloName,
        phoneNumber: entry.inputPhoneNumber,
        avatarUrl: entry.avatarUrl,
      })),
      sending: {
        delayMinSeconds: formData.delayMinSeconds,
        delayMaxSeconds: formData.delayMaxSeconds,
        maxRecipientsPerAccount: formData.maxRecipientsPerAccount,
        scheduleAt: formData.startMode === 'scheduled' ? new Date(formData.startDate).toISOString() : undefined,
        skipFailedAccount: formData.skipFailedAccount,
      },
    };
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitMessage('');

    try {
      const payload = buildSubmitPayload();
      setSubmitMessage(
        `Payload đã sẵn sàng với ${payload.recipients.length} SĐT hợp lệ. API tạo chiến dịch nhiều tài khoản chưa được kết nối ở frontend.`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <CampaignSummaryStrip
        selectedAccountCount={selectedActiveAccounts.length}
        recipientCount={recipientCount}
        estimatedDurationLabel={validation.estimatedDurationLabel}
        blockerCount={validation.blockers.length}
      />

      {accountError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{accountError}</div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <PhoneListTable entries={phoneEntries} onEntriesChange={setPhoneEntries} />

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
