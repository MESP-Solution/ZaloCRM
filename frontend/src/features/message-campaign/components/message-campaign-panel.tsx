'use client';

import { useState } from 'react';
import type { CampaignFormData, PhoneEntry } from '../types';
import { CampaignForm } from './campaign-form';
import { PhoneListTable } from './phone-list-table';

const DEFAULT_FORM: CampaignFormData = {
  campaignName: '',
  pauseDuration: 30,
  executionLimit: 100,
  startDate: '',
  phonesPerAccount: 20,
  messageContent: '',
  imageFile: null,
};

export function MessageCampaignPanel() {
  const [formData, setFormData] = useState<CampaignFormData>(DEFAULT_FORM);
  const [phoneEntries, setPhoneEntries] = useState<PhoneEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedCount = phoneEntries.filter((e) => e.selected).length;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // TODO: call backend API to create campaign
      alert(`Chiến dịch "${formData.campaignName}" với ${selectedCount} SĐT sẽ được tạo.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <CampaignForm
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            submitting={submitting}
            phoneCount={phoneEntries.length}
            selectedPhoneCount={selectedCount}
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <PhoneListTable entries={phoneEntries} onEntriesChange={setPhoneEntries} />
        </div>
      </div>
    </div>
  );
}
