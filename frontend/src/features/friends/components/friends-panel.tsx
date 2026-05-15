'use client';

import { useEffect, useState } from 'react';
import { friendsApi } from '../api/friends-api';
import { zaloAccountsApi } from '~features/zalo-accounts/api/zalo-accounts-api';
import type { ZaloAccount } from '~features/zalo-accounts/types';
import type { ZaloFriend } from '../types';

export function FriendsPanel() {
  const [accounts, setAccounts] = useState<ZaloAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [friends, setFriends] = useState<ZaloFriend[]>([]);
  const [filtered, setFiltered] = useState<ZaloFriend[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    zaloAccountsApi
      .list()
      .then((data) => {
        setAccounts(data);
        const active = data.find((a) => a.status === 'active');
        if (active) setSelectedAccountId(active.id);
      })
      .catch(() => setError('Không thể tải danh sách tài khoản'));
  }, []);

  useEffect(() => {
    if (!selectedAccountId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    friendsApi
      .getAll(selectedAccountId)
      .then((data) => {
        if (!cancelled) {
          setFriends(data);
          setFiltered(data);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Không thể tải danh sách bạn bè');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedAccountId, reloadKey]);

  useEffect(() => {
    setCurrentPage(1);
    if (!search.trim()) {
      setFiltered(friends);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      friends.filter(
        (f) =>
          f.displayName?.toLowerCase().includes(q) ||
          f.zaloName?.toLowerCase().includes(q) ||
          f.phoneNumber?.includes(q) ||
          f.userId?.includes(q),
      ),
    );
  }, [search, friends]);

  function toggleFriend(userId: string) {
    setSelectedFriendIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function handleCreateFriendCampaign() {
    const selectedFriends = friends.filter((f) => selectedFriendIds.has(f.userId));
    const recipients = selectedFriends.map((f) => ({
      zaloId: f.userId,
      name: f.displayName || f.zaloName || '',
      gender: f.gender,
      avatar: f.avatar,
    }));
    sessionStorage.setItem('friendCampaignRecipients', JSON.stringify(recipients));
    sessionStorage.setItem('friendCampaignAccountId', selectedAccountId);
    window.location.href = '/message-with-phone?source=friend';
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeAccounts = accounts.filter((a) => a.status === 'active');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">-- Chọn tài khoản --</option>
          {activeAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.displayName || a.phoneNumber || a.id}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Tìm bạn bè theo tên, SĐT, hoặc UID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          disabled={loading || !selectedAccountId}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Đang tải...' : 'Tải lại'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>{filtered.length} / {friends.length} bạn bè</span>
        {selectedFriendIds.size > 0 && (
          <>
            <span>· {selectedFriendIds.size} đã chọn</span>
            <button
              type="button"
              onClick={handleCreateFriendCampaign}
              disabled={!selectedAccountId}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Tạo chiến dịch
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          {!selectedAccountId
            ? 'Vui lòng chọn tài khoản Zalo.'
            : friends.length === 0
              ? 'Chưa có bạn bè nào.'
              : 'Không tìm thấy.'}
        </div>
      ) : (
        <>
          <div className="overflow-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-4 py-2.5" />
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Avatar</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Tên hiển thị</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Tên Zalo</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">SĐT</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">UID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Giới tính</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((f) => (
                  <tr
                    key={f.userId}
                    className={`cursor-pointer ${selectedFriendIds.has(f.userId) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => toggleFriend(f.userId)}
                  >
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedFriendIds.has(f.userId)}
                        onChange={() => toggleFriend(f.userId)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-2">
                      {f.avatar ? (
                        <img
                          src={f.avatar}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
                          ?
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{f.displayName || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{f.zaloName || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{f.phoneNumber || '-'}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-400">{f.userId}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {f.gender === 0 ? 'Nam' : f.gender === 1 ? 'Nữ' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <span className="text-sm text-gray-500">
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} / {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
                >
                  ← Trước
                </button>
                <span className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
