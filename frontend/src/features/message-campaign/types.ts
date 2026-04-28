export interface PhoneEntry {
  id: string;
  phoneNumber: string;
  name: string;
  selected: boolean;
}

export interface CampaignFormData {
  campaignName: string;
  pauseDuration: number;
  executionLimit: number;
  startDate: string;
  phonesPerAccount: number;
  messageContent: string;
  imageFile: File | null;
}
