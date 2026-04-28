'use client';

import { useState } from 'react';
import { zaloAccountsApi } from '../api/zalo-accounts-api';
import type { ZaloAccount, UpdateZaloAccountRequest } from '../types';

interface Props {
  account: ZaloAccount;
  onClose: () => void;
  onUpdated: () => void;
}

export function ZaloAccountEditModal({ account, onClose, onUpdated }: Props) {
  const [imei, setImei] = useState('');
  const [userAgent, setUserAgent] = useState('');
  const [cookieJson, setCookieJson] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!imei || !userAgent || !cookieJson) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSubmitting(true);
    try {
      const payload: UpdateZaloAccountRequest = {
        imei,
        userAgent,
        cookie: JSON.parse(cookieJson),
      };

      await zaloAccountsApi.update(account.id, payload);
      onUpdated();
      onClose();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Cookie JSON không hợp lệ');
      } else {
        setError(err instanceof Error ? err.message : 'Cập nhật thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cập nhật thông tin đăng nhập</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          Cập nhật credentials sẽ kết nối lại tài khoản <strong>{account.displayName}</strong>
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">IMEI</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              required
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">User Agent</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
              required
              placeholder="Mozilla/5.0 (Windows NT 10.0; Win64)..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cookie (JSON)</label>
            <textarea
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
              rows={4}
              value={cookieJson}
              onChange={(e) => setCookieJson(e.target.value)}
              required
              placeholder='[{"domain": ".zalo.me", "name": "__zi", "value": "..."}]'
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
              {submitting ? 'Đang cập nhật...' : 'Cập nhật & kết nối lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
