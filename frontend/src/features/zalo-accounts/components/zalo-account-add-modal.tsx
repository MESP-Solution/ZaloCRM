'use client';

import { useState } from 'react';
import { zaloAccountsApi } from '../api/zalo-accounts-api';
import type { LoginWithCookieRequest } from '../types';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function ZaloAccountAddModal({ onClose, onCreated }: Props) {
  const [formData, setFormData] = useState<LoginWithCookieRequest>({
    imei: '',
    userAgent: '',
    cookie: [],
    proxyUrl: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = { ...formData };
      if (!payload.proxyUrl) delete payload.proxyUrl;
      const result = await zaloAccountsApi.loginWithCookie(payload);
      if (result.success) {
        onCreated();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Thêm tài khoản Zalo</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">IMEI</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
              value={formData.imei}
              onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
              required
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">User Agent</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
              value={formData.userAgent}
              onChange={(e) => setFormData({ ...formData, userAgent: e.target.value })}
              required
              placeholder="Mozilla/5.0 (Windows NT 10.0; Win64)..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cookie (JSON)</label>
            <textarea
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
              rows={4}
              value={JSON.stringify(formData.cookie, null, 2)}
              onChange={(e) => {
                try {
                  setFormData({ ...formData, cookie: JSON.parse(e.target.value) });
                } catch {
                  // allow invalid JSON temporarily
                }
              }}
              required
              placeholder='[{"domain": ".zalo.me", "name": "__zi", "value": "..."}]'
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Proxy URL (tùy chọn)</label>
            <input
              type="url"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
              value={formData.proxyUrl || ''}
              onChange={(e) => setFormData({ ...formData, proxyUrl: e.target.value })}
              placeholder="http://user:pass@proxy.example.com:8080"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? 'Đang thêm...' : 'Thêm tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
