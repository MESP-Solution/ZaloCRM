'use client';

import { useRef } from 'react';
import type { CampaignFormData } from '../types';

interface Props {
  formData: CampaignFormData;
  onChange: (data: CampaignFormData) => void;
  onSubmit: () => void;
  submitting: boolean;
  phoneCount: number;
  selectedPhoneCount: number;
}

export function CampaignForm({ formData, onChange, onSubmit, submitting, phoneCount, selectedPhoneCount }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update(partial: Partial<CampaignFormData>) {
    onChange({ ...formData, ...partial });
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-950">Thông tin chiến dịch</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tên chiến dịch</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          value={formData.campaignName}
          onChange={(e) => update({ campaignName: e.target.value })}
          placeholder="VD: Chiến dịch khuyến mãi tháng 5"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Thời gian tạm dừng (giây)</label>
          <input
            type="number"
            min={0}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            value={formData.pauseDuration}
            onChange={(e) => update({ pauseDuration: Number(e.target.value) })}
            placeholder="30"
          />
          <p className="mt-1 text-xs text-gray-500">Nghỉ giữa mỗi tin nhắn</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Giới hạn thực thi</label>
          <input
            type="number"
            min={1}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            value={formData.executionLimit}
            onChange={(e) => update({ executionLimit: Number(e.target.value) })}
            placeholder="100"
          />
          <p className="mt-1 text-xs text-gray-500">Tổng số tin nhắn tối đa</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
          <input
            type="datetime-local"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            value={formData.startDate}
            onChange={(e) => update({ startDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">SĐT mỗi tài khoản Zalo</label>
          <select
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
            value={formData.phonesPerAccount}
            onChange={(e) => update({ phonesPerAccount: Number(e.target.value) })}
          >
            {[10, 20, 30, 40, 50, 100].map((n) => (
              <option key={n} value={n}>{n} số / tài khoản</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Chia đều SĐT cho các tài khoản</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Hình ảnh chiến dịch</label>
        <div className="mt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => update({ imageFile: e.target.files?.[0] ?? null })}
          />
          <button
            type="button"
            className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 transition hover:border-blue-400 hover:text-blue-600"
            onClick={() => fileInputRef.current?.click()}
          >
            {formData.imageFile ? formData.imageFile.name : 'Chọn hình ảnh...'}
          </button>
          {formData.imageFile && (
            <button
              type="button"
              className="ml-2 text-xs text-red-500 hover:underline"
              onClick={() => update({ imageFile: null })}
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Nội dung tin nhắn</label>
        <textarea
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          rows={5}
          value={formData.messageContent}
          onChange={(e) => update({ messageContent: e.target.value })}
          placeholder="Nhập nội dung tin nhắn gửi đến khách hàng..."
        />
        <p className="mt-1 text-xs text-gray-500">{formData.messageContent.length} ký tự</p>
      </div>

      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
        <span className="font-medium">{selectedPhoneCount}</span>/{phoneCount} SĐT được chọn
      </div>

      <button
        type="button"
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
        onClick={onSubmit}
        disabled={submitting || selectedPhoneCount === 0 || !formData.campaignName || !formData.messageContent}
      >
        {submitting ? 'Đang tạo chiến dịch...' : 'Tạo chiến dịch'}
      </button>
    </div>
  );
}
