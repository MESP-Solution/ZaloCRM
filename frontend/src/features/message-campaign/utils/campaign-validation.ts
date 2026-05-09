import type { CampaignFormData, PhoneEntry } from '../types';
import type { ZaloAccount } from '../../zalo-accounts/types';

export interface CampaignValidationResult {
  blockers: string[];
  estimatedDurationLabel: string;
}

const DEFAULT_DELAY_SECONDS = 30;

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Chưa xác định';

  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `Khoảng ${minutes} phút`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `Khoảng ${hours} giờ ${remainingMinutes} phút`
    : `Khoảng ${hours} giờ`;
}

export function validateCampaign(
  formData: CampaignFormData,
  phoneEntries: PhoneEntry[],
  zaloAccounts: ZaloAccount[],
): CampaignValidationResult {
  const blockers: string[] = [];
  const selectedRecipients = phoneEntries;
  const selectedActiveAccounts = zaloAccounts.filter(
    (account) =>
      formData.selectedZaloAccountIds.includes(account.id) &&
      account.status === 'active',
  );

  if (!formData.campaignName.trim()) {
    blockers.push('Nhập tên chiến dịch.');
  }

  if (!formData.messageContent.trim()) {
    blockers.push('Nhập nội dung tin nhắn.');
  }

  if (selectedActiveAccounts.length === 0) {
    blockers.push('Chọn ít nhất 1 tài khoản Zalo đang hoạt động.');
  }

  if (selectedRecipients.length === 0) {
    blockers.push('Chọn ít nhất 1 người nhận từ danh sách SĐT.');
  }

  if (formData.startMode === 'scheduled' && !formData.startDate) {
    blockers.push('Chọn thời gian bắt đầu khi lên lịch.');
  }

  if (formData.startMode === 'scheduled' && formData.startDate) {
    const scheduleTime = new Date(formData.startDate);
    if (Number.isNaN(scheduleTime.getTime())) {
      blockers.push('Thời gian lên lịch không hợp lệ.');
    } else if (scheduleTime.getTime() <= Date.now()) {
      blockers.push('Thời gian lên lịch phải ở tương lai.');
    }
  }

  const estimatedSeconds = selectedRecipients.length * DEFAULT_DELAY_SECONDS;

  return {
    blockers,
    estimatedDurationLabel: formatDuration(estimatedSeconds),
  };
}
