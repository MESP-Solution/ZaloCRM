export interface SendZaloMessageCommand {
  zaloAccountId: string;
  recipientId: string;
  text: string;
  campaignId?: string;
}

export interface SendZaloMessageResult {
  providerMessageId: string;
  sentAt: Date;
}
