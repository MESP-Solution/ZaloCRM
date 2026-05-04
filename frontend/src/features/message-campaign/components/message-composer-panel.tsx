'use client';

import { useRef, useMemo, useCallback } from 'react';
import type { CampaignFormData, PhoneEntry } from '../types';

interface Props {
  formData: CampaignFormData;
  previewRecipient?: PhoneEntry;
  onChange: (data: CampaignFormData) => void;
}

function resolveGender(gender?: number): string {
  if (gender === 0) return 'anh';
  if (gender === 1) return 'chị';
  return 'anh/chị';
}

function renderPreview(message: string, recipient?: PhoneEntry): string {
  if (!message.trim()) return 'Nội dung xem trước sẽ hiển thị tại đây.';

  return message
    .replaceAll('{name}', recipient?.zaloName || 'Khách hàng')
    .replaceAll('{gender}', resolveGender(recipient?.gender));
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const PLACEHOLDERS = [
  { label: '{name}', description: 'Tên Zalo' },
  { label: '{gender}', description: 'anh/chị' },
] as const;

export function MessageComposerPanel({ formData, previewRecipient, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const imagePreviewUrl = useMemo(
    () => (formData.imageFile ? URL.createObjectURL(formData.imageFile) : null),
    [formData.imageFile],
  );

  function update(partial: Partial<CampaignFormData>) {
    onChange({ ...formData, ...partial });
  }

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WebP).');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      alert('Ảnh tối đa 5MB.');
      return;
    }
    update({ imageFile: file });
  }

  function removeImage() {
    update({ imageFile: undefined });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const insertPlaceholder = useCallback((placeholder: string) => {
    const el = textareaRef.current;
    if (!el) {
      update({ messageContent: formData.messageContent + placeholder });
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = formData.messageContent;
    const newText = text.slice(0, start) + placeholder + text.slice(end);
    update({ messageContent: newText });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + placeholder.length, start + placeholder.length);
    });
  }, [formData, onChange]);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-950">Nội dung tin nhắn</h2>
        <p className="mt-1 text-sm text-gray-500">Dùng biến {'{name}'} (tên) và {'{gender}'} (anh/chị) để cá nhân hóa tin nhắn.</p>
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
        ref={textareaRef}
        className="mt-1 block min-h-32 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        value={formData.messageContent}
        onChange={(event) => update({ messageContent: event.target.value })}
        placeholder="Nhập nội dung gửi tới khách hàng..."
      />
      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
        <span>{formData.messageContent.length} ký tự</span>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">Chèn:</span>
          {PLACEHOLDERS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => insertPlaceholder(p.label)}
              className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
              title={p.description}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 block text-sm font-medium text-gray-700">Hình ảnh đính kèm</label>
      <div className="mt-1">
        {formData.imageFile && imagePreviewUrl ? (
          <div className="relative inline-block">
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="h-32 w-auto rounded-lg border border-gray-200 object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow hover:bg-red-600"
            >
              x
            </button>
            <p className="mt-1 text-xs text-gray-500">{formData.imageFile.name}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            Chọn ảnh (tùy chọn, tối đa 5MB)
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleImageSelect}
        />
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Preview</p>
        {imagePreviewUrl && (
          <img src={imagePreviewUrl} alt="Attached" className="mt-2 h-24 w-auto rounded-md object-cover" />
        )}
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{renderPreview(formData.messageContent, previewRecipient)}</p>
      </div>
    </section>
  );
}
