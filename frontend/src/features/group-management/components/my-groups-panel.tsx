'use client';

import { useState, useRef, useEffect } from 'react';
import type { ZaloAccount } from '../../zalo-accounts/types';
import { groupApi } from '../api/group-api';
import type { GroupWithMembers, MyGroupSummary } from '../types';

interface Props {
  accounts: ZaloAccount[];
  accountsLoading: boolean;
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  onGroupsLoaded: (groups: GroupWithMembers[]) => void;
}

export function MyGroupsPanel({
  accounts,
  accountsLoading,
  selectedAccountId,
  onAccountChange,
  onGroupsLoaded,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const activeAccounts = accounts.filter((a) => a.status === 'active');

  async function handleFetchGroups() {
    if (!selectedAccountId) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const myGroups = await groupApi.fetchMyGroups(selectedAccountId, controller.signal);
      if (controller.signal.aborted) return;
      const asGroupWithMembers: GroupWithMembers[] = myGroups.map((g: MyGroupSummary) => ({
        groupId: g.groupId,
        name: g.name,
        description: '',
        avatar: g.avatar,
        creatorId: '',
        adminIds: [],
        totalMember: g.totalMember,
        hasMoreMember: false,
        members: [],
        link: '',
        allMembers: [],
        allMembersLoaded: false,
      }));
      onGroupsLoaded(asGroupWithMembers);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách nhóm');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[180px]">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Tài khoản Zalo
        </label>
        <select
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={selectedAccountId}
          onChange={(e) => onAccountChange(e.target.value)}
          disabled={accountsLoading}
        >
          <option value="">-- Chọn tài khoản --</option>
          {activeAccounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.displayName}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={handleFetchGroups}
        disabled={loading || !selectedAccountId}
      >
        {loading ? 'Đang tải...' : 'Tải nhóm'}
      </button>

      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
}
