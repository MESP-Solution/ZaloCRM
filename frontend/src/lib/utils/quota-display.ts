export function getQuotaColor(used: number, dailyLimit: number = 50): string {
  if (used >= dailyLimit) return 'bg-red-400';
  if (used >= 30) return 'bg-amber-400';
  return 'bg-green-400';
}

export function getQuotaTextColor(used: number, dailyLimit: number = 50): string {
  if (used >= dailyLimit) return 'text-red-600';
  if (used >= 30) return 'text-amber-600';
  return 'text-green-600';
}
