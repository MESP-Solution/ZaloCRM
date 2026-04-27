export class CreateMessagingCampaignDto {
  customerId!: string;
  zaloAccountId!: string;
  name!: string;
  messageText!: string;
  recipientIds!: string[];
}
