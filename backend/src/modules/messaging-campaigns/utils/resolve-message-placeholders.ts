import { CampaignRecipient } from '../entities/campaign-recipient.entity';

export function resolveMessagePlaceholders(
  template: string,
  recipient: CampaignRecipient,
): string {
  let result = template;

  const name = recipient.recipientName || 'Khách hàng';
  result = result.replaceAll('{name}', name);

  let salutation = 'anh/chị';
  if (recipient.recipientGender === 0) salutation = 'anh';
  else if (recipient.recipientGender === 1) salutation = 'chị';
  result = result.replaceAll('{gender}', salutation);

  return result;
}
