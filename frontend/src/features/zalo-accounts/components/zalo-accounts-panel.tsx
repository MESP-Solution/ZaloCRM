'use client';

import { useEffect, useState } from 'react';
import { zaloAccountsApi } from '../api/zalo-accounts-api';
import type { ZaloAccount, LoginWithCookieRequest } from '../types';
import { ZaloAccountEditModal } from './zalo-account-edit-modal';

const STATUS_LABELS: Record<string, string> = {
  pending_login: 'Chờ đăng nhập',
  active: 'Đang hoạt động',
  disconnected: 'Đã ngắt kết nối',
  restricted: 'Bị hạn chế',
  login_failed: 'Đăng nhập thất bại',
};

const STATUS_COLORS: Record<string, string> = {
  pending_login: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  disconnected: 'bg-gray-100 text-gray-800',
  restricted: 'bg-red-100 text-red-800',
  login_failed: 'bg-red-100 text-red-800',
};

export function ZaloAccountsPanel() {
  const [accounts, setAccounts] = useState<ZaloAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState<LoginWithCookieRequest>({
    imei: '',
    userAgent: '',
    cookie: [],
    proxyUrl: '',
  });
  const [editingAccount, setEditingAccount] = useState<ZaloAccount | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    setLoading(true);
    setError('');
    try {
      const data = await zaloAccountsApi.list();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(accountId: string) {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    try {
      await zaloAccountsApi.delete(accountId);
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = { ...formData };
      if (!payload.proxyUrl) delete payload.proxyUrl;
      const result = await zaloAccountsApi.loginWithCookie(payload);
      if (result.success) {
        setShowAddForm(false);
        setFormData({ imei: '', userAgent: '', cookie: [], proxyUrl: '' });
        fetchAccounts();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-950">Tài khoản Zalo</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý kết nối tài khoản Zalo của bạn</p>
        </div>
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          onClick={() => setShowAddForm(true)}
        >
          Thêm tài khoản
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-500">Chưa có tài khoản Zalo nào</p>
          <button
            className="mt-4 text-sm text-blue-600 hover:underline"
            onClick={() => setShowAddForm(true)}
          >
            Thêm tài khoản đầu tiên
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tên</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Số điện thoại</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kết nối cuối</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {account.avatarUrl ? (
                        <img
                          src={account.avatarUrl}
                          alt={account.displayName}
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                          {account.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-950">{account.displayName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{account.phoneNumber || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[account.status]}`}>
                      {STATUS_LABELS[account.status] || account.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {account.lastConnectedAt
                      ? new Date(account.lastConnectedAt).toLocaleString('vi-VN')
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="mr-3 text-sm text-blue-600 hover:underline"
                      onClick={() => setEditingAccount(account)}
                    >
                      Sửa
                    </button>
                    <button
                      className="text-sm text-red-600 hover:underline"
                      onClick={() => handleDelete(account.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Thêm tài khoản Zalo</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddForm(false)}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>
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
                  onClick={() => setShowAddForm(false)}
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
      )}
      {editingAccount && (
        <ZaloAccountEditModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onUpdated={fetchAccounts}
        />
      )}
    </div>
  );
}
