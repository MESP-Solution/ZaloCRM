export type MessagingCampaignStatus =
  | 'draft'
  | 'queued'
  | 'sending'
  | 'completed'
  | 'failed';

export type MessagingJobStatus = 'queued' | 'sent' | 'failed';

export interface MessagingJob {
  id: string;
  recipientId: string;
  status: MessagingJobStatus;
  providerMessageId?: string;
  errorMessage?: string;
}

export interface MessagingCampaign {
  id: string;
  customerId: string;
  zaloAccountId: string;
  name: string;
  messageText: string;
  status: MessagingCampaignStatus;
  jobs: MessagingJob[];
  createdAt: Date;
  updatedAt: Date;
}
