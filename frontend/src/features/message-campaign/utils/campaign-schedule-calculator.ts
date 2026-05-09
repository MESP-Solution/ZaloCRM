const DAILY_LIMIT_PER_ACCOUNT = 50;

export interface DayScheduleRow {
  date: string;
  accountBreakdown: number[];
  dayTotal: number;
}

export interface CampaignScheduleEstimate {
  totalDays: number;
  dailyCapacity: number;
  completionDate: string;
  dailyLimit: number;
  isSameDay: boolean;
  durationLabel: string;
  rows: DayScheduleRow[];
}

function formatDurationLabel(seconds: number): string {
  if (seconds <= 0) return 'Ngay lập tức';
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `Khoảng ${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `Khoảng ${hours} giờ ${remaining} phút` : `Khoảng ${hours} giờ`;
}

export function calculateCampaignSchedule(
  recipientCount: number,
  accountCount: number,
  options?: {
    startDate?: Date;
    dailyLimit?: number;
    avgDelaySeconds?: number;
  },
): CampaignScheduleEstimate | null {
  if (recipientCount <= 0 || accountCount <= 0) return null;

  const dailyLimit = options?.dailyLimit ?? DAILY_LIMIT_PER_ACCOUNT;
  const startDate = options?.startDate;
  const avgDelay = options?.avgDelaySeconds ?? 30;

  const dailyCapacity = accountCount * dailyLimit;
  const totalDays = Math.ceil(recipientCount / dailyCapacity);
  const isSameDay = totalDays <= 1;
  const estimatedSeconds = recipientCount * avgDelay;
  const durationLabel = isSameDay
    ? formatDurationLabel(estimatedSeconds)
    : `Khoảng ${totalDays} ngày`;
  const start = startDate ?? new Date();

  const rows: DayScheduleRow[] = [];
  let remaining = recipientCount;

  for (let d = 0; d < totalDays; d++) {
    const date = new Date(start);
    date.setDate(date.getDate() + d);
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    const dayTotal = Math.min(remaining, dailyCapacity);
    const basePerAccount = Math.floor(dayTotal / accountCount);
    const extra = dayTotal % accountCount;

    const accountBreakdown: number[] = [];
    for (let a = 0; a < accountCount; a++) {
      accountBreakdown.push(basePerAccount + (a < extra ? 1 : 0));
    }

    rows.push({ date: dateStr, accountBreakdown, dayTotal });
    remaining -= dayTotal;
  }

  const completionDate = new Date(start);
  completionDate.setDate(completionDate.getDate() + totalDays - 1);
  const completionStr = completionDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return {
    totalDays,
    dailyCapacity,
    completionDate: completionStr,
    dailyLimit,
    isSameDay,
    durationLabel,
    rows,
  };
}
