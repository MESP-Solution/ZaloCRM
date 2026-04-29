interface Props {
  selectedAccountCount: number;
  recipientCount: number;
  estimatedDurationLabel: string;
  blockerCount: number;
}

export function CampaignSummaryStrip({
  selectedAccountCount,
  recipientCount,
  estimatedDurationLabel,
  blockerCount,
}: Props) {
  const items = [
    { label: 'Tài khoản gửi', value: selectedAccountCount.toString() },
    { label: 'SĐT đã thêm', value: recipientCount.toString() },
    { label: 'Thời gian dự kiến', value: estimatedDurationLabel },
    { label: 'Cần xử lý', value: blockerCount.toString() },
  ];

  return (
    <section className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{item.label}</p>
          <p className="mt-1 truncate text-lg font-semibold text-gray-950">{item.value}</p>
        </div>
      ))}
    </section>
  );
}
