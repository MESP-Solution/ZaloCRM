interface Props {
  blockers: string[];
  selectedAccountCount: number;
  recipientCount: number;
  estimatedDurationLabel: string;
  submitting: boolean;
  submitMessage?: string;
  onSubmit: () => void;
}

export function CampaignReviewPanel({
  blockers,
  selectedAccountCount,
  recipientCount,
  estimatedDurationLabel,
  submitting,
  submitMessage,
  onSubmit,
}: Props) {
  const canSubmit = blockers.length === 0 && !submitting;

  return (
    <section className="sticky bottom-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500">Tài khoản</p>
          <p className="font-semibold text-gray-950">{selectedAccountCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">SĐT sẽ gửi</p>
          <p className="font-semibold text-gray-950">{recipientCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Dự kiến</p>
          <p className="font-semibold text-gray-950">{estimatedDurationLabel}</p>
        </div>
      </div>

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

      {submitMessage && (
        <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{submitMessage}</div>
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
