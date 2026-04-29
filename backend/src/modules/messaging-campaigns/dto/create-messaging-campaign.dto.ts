export class CreateMessagingCampaignDto {
  customerId!: string;
  zaloAccountIds!: string[];
  name!: string;
  messageText!: string;
  recipients!: { phone: string; zaloId?: string; name?: string }[];
  scheduleAt?: string;
}
