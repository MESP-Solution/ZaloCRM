'use client';

import { useEffect, useMemo, useState } from 'react';
import { zaloAccountsApi } from '../api/zalo-accounts-api';
import type { ZaloAccount, ZaloAccountStatus } from '../types';
import { ZaloAccountAddModal } from './zalo-account-add-modal';
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

const FILTER_OPTIONS: { value: 'all' | ZaloAccountStatus; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'disconnected', label: 'Đã ngắt kết nối' },
  { value: 'login_failed', label: 'Đăng nhập thất bại' },
  { value: 'pending_login', label: 'Chờ đăng nhập' },
  { value: 'restricted', label: 'Bị hạn chế' },
];

export function ZaloAccountsPanel() {
  const [accounts, setAccounts] = useState<ZaloAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ZaloAccount | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ZaloAccountStatus>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionInProgress, setActionInProgress] = useState<Set<string>>(new Set());
  const [bulkInProgress, setBulkInProgress] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (searchQuery && !a.displayName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [accounts, statusFilter, searchQuery]);

  const allFilteredSelected =
    filteredAccounts.length > 0 && filteredAccounts.every((a) => selectedIds.has(a.id));

  const selectedAccounts = filteredAccounts.filter((a) => selectedIds.has(a.id));
  const canBulkReconnect = selectedAccounts.some((a) => a.status === 'disconnected' || a.status === 'login_failed');
  const canBulkDisconnect = selectedAccounts.some((a) => a.status === 'active');

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

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAccounts.map((a) => a.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleReconnect(accountId: string) {
    setActionInProgress((prev) => new Set(prev).add(accountId));
    try {
      await zaloAccountsApi.reconnect(accountId);
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reconnect failed');
    } finally {
      setActionInProgress((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  }

  async function handleDisconnect(accountId: string) {
    setActionInProgress((prev) => new Set(prev).add(accountId));
    try {
      await zaloAccountsApi.disconnect(accountId);
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    } finally {
      setActionInProgress((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  }

  async function handleDelete(accountId: string) {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    try {
      await zaloAccountsApi.delete(accountId);
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  }

  async function handleBulkAction(action: 'reconnect' | 'disconnect') {
    const targets = selectedAccounts.filter((a) =>
      action === 'reconnect'
        ? a.status === 'disconnected' || a.status === 'login_failed'
        : a.status === 'active',
    );
    if (targets.length === 0) return;

    setBulkInProgress(true);
    const results = await Promise.allSettled(
      targets.map((a) =>
        action === 'reconnect'
          ? zaloAccountsApi.reconnect(a.id)
          : zaloAccountsApi.disconnect(a.id),
      ),
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      setError(`${failed}/${targets.length} thao tác thất bại`);
    }

    setSelectedIds(new Set());
    setBulkInProgress(false);
    await fetchAccounts();
  }

  async function handleBulkDelete() {
    if (!confirm(`Bạn có chắc muốn xóa ${selectedAccounts.length} tài khoản?`)) return;

    setBulkInProgress(true);
    const results = await Promise.allSettled(
      selectedAccounts.map((a) => zaloAccountsApi.delete(a.id)),
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      setError(`${failed}/${selectedAccounts.length} xóa thất bại`);
    }

    setSelectedIds(new Set());
    setBulkInProgress(false);
    await fetchAccounts();
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          placeholder="Tìm theo tên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {filteredAccounts.length}/{accounts.length}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            onClick={fetchAccounts}
            disabled={loading}
          >
            {loading ? '...' : '↻ Làm mới'}
          </button>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            onClick={() => setShowAddForm(true)}
          >
            Thêm tài khoản
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-800">
            Đã chọn {selectedIds.size} tài khoản
          </span>
          {canBulkReconnect && (
            <button
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
              onClick={() => handleBulkAction('reconnect')}
              disabled={bulkInProgress}
            >
              {bulkInProgress ? '...' : 'Kết nối lại'}
            </button>
          )}
          {canBulkDisconnect && (
            <button
              className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-60"
              onClick={() => handleBulkAction('disconnect')}
              disabled={bulkInProgress}
            >
              {bulkInProgress ? '...' : 'Ngắt kết nối'}
            </button>
          )}
          <button
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
            onClick={handleBulkDelete}
            disabled={bulkInProgress}
          >
            {bulkInProgress ? '...' : `Xóa (${selectedIds.size})`}
          </button>
          <button
            className="ml-auto text-xs text-gray-500 hover:underline"
            onClick={() => setSelectedIds(new Set())}
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-500">
            {accounts.length === 0 ? 'Chưa có tài khoản Zalo nào' : 'Không tìm thấy tài khoản phù hợp'}
          </p>
          {accounts.length === 0 && (
            <button className="mt-4 text-sm text-blue-600 hover:underline" onClick={() => setShowAddForm(true)}>
              Thêm tài khoản đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tên</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Số điện thoại</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kết nối cuối</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAccounts.map((account) => {
                const isActioning = actionInProgress.has(account.id);
                return (
                  <tr key={account.id} className={selectedIds.has(account.id) ? 'bg-blue-50/50' : ''}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(account.id)}
                        onChange={() => toggleSelect(account.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {account.avatarUrl ? (
                          <img src={account.avatarUrl} alt="" className="size-8 rounded-full object-cover" />
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
                      {account.lastConnectedAt ? new Date(account.lastConnectedAt).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(account.status === 'disconnected' || account.status === 'login_failed') && (
                          <button
                            className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                            onClick={() => handleReconnect(account.id)}
                            disabled={isActioning}
                          >
                            {isActioning ? '...' : 'Kết nối lại'}
                          </button>
                        )}
                        {account.status === 'active' && (
                          <button
                            className="rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                            onClick={() => handleDisconnect(account.id)}
                            disabled={isActioning}
                          >
                            {isActioning ? '...' : 'Ngắt kết nối'}
                          </button>
                        )}
                        <button
                          className="text-sm text-blue-600 hover:underline"
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <ZaloAccountAddModal onClose={() => setShowAddForm(false)} onCreated={fetchAccounts} />
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
