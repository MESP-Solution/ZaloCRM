export type CampaignStatus =
  | 'draft'
  | 'queued'
  | 'sending'
  | 'paused_manual'
  | 'paused_quota_exhausted'
  | 'paused_no_available_account'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  campaignType?: 'stranger' | 'friend';
  queuedCount: number;
  sentCount: number;
  failedCount: number;
  scheduleAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignAccountStats {
  accountId: string;
  displayName: string;
  status: string;
  sentCount: number;
  failedAttempts: number;
  remainingQuota: number;
  dailyLimit: number;
}

export interface CampaignStats {
  totalRecipients: number;
  sent: number;
  failed: number;
  queued: number;
  skipped: number;
  sending: number;
  accounts: CampaignAccountStats[];
}

export interface CampaignRecipient {
  id: string;
  recipientPhone?: string;
  recipientZaloId?: string;
  recipientName?: string;
  status: string;
  errorMessage?: string;
}

export interface CampaignRecipientsResponse {
  data: CampaignRecipient[];
  total: number;
  page: number;
  limit: number;
}
