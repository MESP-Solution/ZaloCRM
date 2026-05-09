export type CampaignStartMode = 'now' | 'scheduled';

export interface PhoneEntry {
  id: string;
  phoneNumber: string;
  inputPhoneNumber: string;
  zaloName: string;
  avatarUrl: string;
  zaloUid: string;
  gender?: number;
}

export interface CampaignFormData {
  campaignName: string;
  selectedZaloAccountIds: string[];
  startMode: CampaignStartMode;
  startDate: string;
  messageContent: string;
  imageFile?: File;
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

