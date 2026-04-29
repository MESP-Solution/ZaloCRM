export type CampaignStartMode = 'now' | 'scheduled';

export interface PhoneEntry {
  id: string;
  phoneNumber: string;
  inputPhoneNumber: string;
  zaloName: string;
  avatarUrl: string;
}

export interface CampaignFormData {
  campaignName: string;
  selectedZaloAccountIds: string[];
  startMode: CampaignStartMode;
  startDate: string;
  delayMinSeconds: number;
  delayMaxSeconds: number;
  maxRecipientsPerAccount: number;
  skipFailedAccount: boolean;
  messageContent: string;
}

export interface CampaignRecipientPayload {
  phoneNumber: string;
  name?: string;
  avatarUrl?: string;
}

export interface ZaloUserLookupResponse {
  phoneNumber: string;
  inputPhoneNumber: string;
  zaloName: string;
  avatarUrl: string;
  displayName: string;
  uid: string;
}

export interface ZaloUsersLookupResponse {
  results: ZaloUserLookupResponse[];
  failedCount: number;
}

export interface MessageCampaignSubmitPayload {
  name: string;
  messageText: string;
  zaloAccountIds: string[];
  recipients: CampaignRecipientPayload[];
  sending: {
    delayMinSeconds: number;
    delayMaxSeconds: number;
    maxRecipientsPerAccount: number;
    scheduleAt?: string;
    skipFailedAccount: boolean;
  };
}
