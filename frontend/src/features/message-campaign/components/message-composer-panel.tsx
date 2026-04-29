import type { CampaignFormData, PhoneEntry } from '../types';

interface Props {
  formData: CampaignFormData;
  previewRecipient?: PhoneEntry;
  onChange: (data: CampaignFormData) => void;
}

function renderPreview(message: string, recipient?: PhoneEntry): string {
  if (!message.trim()) return 'Nội dung xem trước sẽ hiển thị tại đây.';

  return message
    .replaceAll('{name}', recipient?.zaloName || 'Khách hàng')
    .replaceAll('{phone}', recipient?.inputPhoneNumber || '0901234567');
}

export function MessageComposerPanel({ formData, previewRecipient, onChange }: Props) {
  function update(partial: Partial<CampaignFormData>) {
    onChange({ ...formData, ...partial });
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-950">Nội dung tin nhắn</h2>
        <p className="mt-1 text-sm text-gray-500">Có thể dùng biến {'{name}'} và {'{phone}'} nếu có dữ liệu Zalo.</p>
      </div>

      <label className="block text-sm font-medium text-gray-700">Tên chiến dịch</label>
      <input
        type="text"
        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        value={formData.campaignName}
        onChange={(event) => update({ campaignName: event.target.value })}
        placeholder="VD: Chăm sóc khách hàng tháng 5"
      />

      <label className="mt-4 block text-sm font-medium text-gray-700">Nội dung</label>
      <textarea
        className="mt-1 block min-h-32 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        value={formData.messageContent}
        onChange={(event) => update({ messageContent: event.target.value })}
        placeholder="Nhập nội dung gửi tới khách hàng..."
      />
      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
        <span>{formData.messageContent.length} ký tự</span>
        <span>Gửi thử sẽ thêm sau khi có API.</span>
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Preview</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{renderPreview(formData.messageContent, previewRecipient)}</p>
      </div>
    </section>
  );
}
