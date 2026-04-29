import type { CampaignFormData } from '../types';

interface Props {
  formData: CampaignFormData;
  onChange: (data: CampaignFormData) => void;
}

export function SendingSettingsPanel({ formData, onChange }: Props) {
  function update(partial: Partial<CampaignFormData>) {
    onChange({ ...formData, ...partial });
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-950">Cài đặt gửi</h2>
        <p className="mt-1 text-sm text-gray-500">Queue chạy round-robin tuần tự qua các tài khoản đã chọn.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="rounded-lg border border-gray-200 p-3 text-sm">
          <input
            type="radio"
            name="start-mode"
            className="mr-2"
            checked={formData.startMode === 'now'}
            onChange={() => update({ startMode: 'now', startDate: '' })}
          />
          Gửi ngay
        </label>
        <label className="rounded-lg border border-gray-200 p-3 text-sm">
          <input
            type="radio"
            name="start-mode"
            className="mr-2"
            checked={formData.startMode === 'scheduled'}
            onChange={() => update({ startMode: 'scheduled' })}
          />
          Lên lịch
        </label>
      </div>

      {formData.startMode === 'scheduled' && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700">Thời gian bắt đầu</label>
          <input
            type="datetime-local"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            value={formData.startDate}
            onChange={(event) => update({ startDate: event.target.value })}
          />
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Delay tối thiểu</label>
          <input
            type="number"
            min={1}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            value={formData.delayMinSeconds}
            onChange={(event) => update({ delayMinSeconds: Number(event.target.value) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Delay tối đa</label>
          <input
            type="number"
            min={1}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            value={formData.delayMaxSeconds}
            onChange={(event) => update({ delayMaxSeconds: Number(event.target.value) })}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Giới hạn mỗi tài khoản</label>
        <input
          type="number"
          min={1}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          value={formData.maxRecipientsPerAccount}
          onChange={(event) => update({ maxRecipientsPerAccount: Number(event.target.value) })}
        />
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={formData.skipFailedAccount}
          onChange={(event) => update({ skipFailedAccount: event.target.checked })}
        />
        <span>Bỏ qua tài khoản lỗi và tiếp tục với tài khoản còn lại.</span>
      </label>
    </section>
  );
}
