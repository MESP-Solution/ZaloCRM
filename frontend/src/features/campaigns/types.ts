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
  queuedCount: number;
  sentCount: number;
  failedCount: number;
  scheduleAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStats {
  totalRecipients: number;
  sent: number;
  failed: number;
  pending: number;
}

export interface CampaignRecipient {
  id: string;
  phone: string;
  zaloId?: string;
  name?: string;
  status: string;
  sentAt?: string;
  errorMessage?: string;
}

export interface CampaignRecipientsResponse {
  data: CampaignRecipient[];
  total: number;
  page: number;
  limit: number;
}
