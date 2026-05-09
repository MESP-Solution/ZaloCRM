import { useMemo } from 'react';
import { calculateCampaignSchedule } from '../utils/campaign-schedule-calculator';

interface Props {
  blockers: string[];
  selectedAccountCount: number;
  recipientCount: number;
  estimatedDurationLabel: string;
  accountNames?: string[];
  avgDelaySeconds?: number;
  submitting: boolean;
  onSubmit: () => void;
}

export function CampaignReviewPanel({
  blockers,
  selectedAccountCount,
  recipientCount,
  estimatedDurationLabel,
  accountNames,
  avgDelaySeconds,
  submitting,
  onSubmit,
}: Props) {
  const canSubmit = blockers.length === 0 && !submitting;

  const schedule = useMemo(
    () =>
      calculateCampaignSchedule(recipientCount, selectedAccountCount, {
        avgDelaySeconds,
      }),
    [recipientCount, selectedAccountCount, avgDelaySeconds],
  );

  return (
    <section className="sticky bottom-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500">Tài khoản</p>
          <p className="font-semibold text-gray-950">{selectedAccountCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Người nhận</p>
          <p className="font-semibold text-gray-950">{recipientCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Dự kiến</p>
          <p className="font-semibold text-gray-950">
            {schedule?.durationLabel ?? estimatedDurationLabel}
          </p>
        </div>
      </div>

      {schedule && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md bg-blue-50 px-2 py-1.5 text-center">
            <span className="font-semibold text-blue-700">{schedule.dailyLimit}</span>
            <span className="text-blue-600"> /ngày/TK</span>
          </div>
          <div className="rounded-md bg-blue-50 px-2 py-1.5 text-center">
            <span className="font-semibold text-blue-700">{schedule.dailyCapacity}</span>
            <span className="text-blue-600"> /ngày tổng</span>
          </div>
          <div className="rounded-md bg-blue-50 px-2 py-1.5 text-center">
            {schedule.isSameDay ? (
              <span className="font-semibold text-green-700">Trong ngày</span>
            ) : (
              <>
                <span className="font-semibold text-blue-700">{schedule.totalDays}</span>
                <span className="text-blue-600"> ngày</span>
              </>
            )}
          </div>
        </div>
      )}

      {schedule && !schedule.isSameDay && (
        <div className="mt-3 max-h-[150px] overflow-auto rounded-md border border-gray-100">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="text-left font-medium uppercase text-gray-500">
                <th className="px-2 py-1.5">Ngày</th>
                {Array.from({ length: selectedAccountCount }, (_, i) => (
                  <th key={i} className="px-2 py-1.5">
                    {accountNames?.[i] ?? `TK ${i + 1}`}
                  </th>
                ))}
                <th className="px-2 py-1.5">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {schedule.rows.map((row) => (
                <tr key={row.date} className="border-t border-gray-100">
                  <td className="px-2 py-1 font-medium text-gray-700">{row.date}</td>
                  {row.accountBreakdown.map((count, i) => (
                    <td key={i} className="px-2 py-1 text-gray-600">{count}</td>
                  ))}
                  <td className="px-2 py-1 font-medium text-gray-900">{row.dayTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {blockers.length > 0 && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Cần xử lý trước khi tạo chiến dịch</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!canSubmit}
        onClick={onSubmit}
      >
        {submitting ? 'Đang tạo chiến dịch...' : 'Tạo chiến dịch'}
      </button>
    </section>
  );
}
