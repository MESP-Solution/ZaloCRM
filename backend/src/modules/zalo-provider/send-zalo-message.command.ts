export interface SendZaloMessageCommand {
  zaloAccountId: string;
  recipientId: string;
  text: string;
  campaignId?: string;
  imageFilePaths?: string[];
}

export interface SendZaloMessageResult {
  providerMessageId: string;
  sentAt: Date;
}
