'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ZaloAccount } from '../../zalo-accounts/types';
import { zaloAccountsApi } from '../../zalo-accounts/api/zalo-accounts-api';
import { groupApi } from '../api/group-api';
import type { GroupMember, GroupWithMembers } from '../types';
import { GroupLinkInput } from './group-link-input';
import { GroupDatagrid } from './group-datagrid';
import { MemberListPanel } from './member-list-panel';
import { MyGroupsPanel } from './my-groups-panel';

const API_DELAY_MS = 2000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function GroupManagementPanel() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<ZaloAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [link, setLink] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'my-groups'>('link');
  const lastFetchRef = useRef(0);

  useEffect(() => {
    zaloAccountsApi
      .list()
      .then(setAccounts)
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false));
  }, []);

  const handleFetchGroup = useCallback(async () => {
    if (!link || !selectedAccountId) return;
    setError('');
    setFetchLoading(true);

    try {
      const elapsed = Date.now() - lastFetchRef.current;
      if (elapsed < API_DELAY_MS) {
        await sleep(API_DELAY_MS - elapsed);
      }

      const info = await groupApi.fetchGroupLinkInfo(selectedAccountId, link);
      lastFetchRef.current = Date.now();

      const existing = groups.find((g) => g.groupId === info.groupId);
      if (existing) {
        setError('Nhóm này đã có trong danh sách');
        return;
      }

      setGroups((prev) => [
        ...prev,
        { ...info, link, allMembers: info.members, allMembersLoaded: !info.hasMoreMember },
      ]);
      setLink('');

      setCooldown(true);
      setTimeout(() => setCooldown(false), API_DELAY_MS);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lấy thông tin nhóm';
      setError(message);
    } finally {
      setFetchLoading(false);
    }
  }, [link, selectedAccountId, groups]);

  const handleToggleSelect = useCallback((groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedGroupIds((prev) => {
      if (prev.size === groups.length) return new Set();
      return new Set(groups.map((g) => g.groupId));
    });
  }, [groups]);

  const handleLoadMembers = useCallback(async () => {
    if (!selectedAccountId) {
      setError('Chọn tài khoản Zalo trước');
      return;
    }
    setLoadingMembers(true);
    setError('');

    try {
      const updatedGroups = [...groups];

      for (const groupId of selectedGroupIds) {
        const idx = updatedGroups.findIndex((g) => g.groupId === groupId);
        if (idx === -1) continue;
        const group = updatedGroups[idx];
        if (group.allMembersLoaded) continue;

        if (group.link) {
          const result = await groupApi.fetchAllMembers(selectedAccountId, group.link);
          updatedGroups[idx] = { ...group, allMembers: result.members, allMembersLoaded: true };
        } else {
          const result = await groupApi.fetchGroupMembers(selectedAccountId, group.groupId);
          updatedGroups[idx] = {
            ...group,
            creatorId: result.creatorId,
            adminIds: result.adminIds,
            members: result.members,
            allMembers: result.members,
            allMembersLoaded: true,
          };
        }
      }

      setGroups(updatedGroups);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi tải thành viên';
      setError(message);
    } finally {
      setLoadingMembers(false);
    }
  }, [groups, selectedGroupIds, selectedAccountId]);

  const allMembers = useMemo(() => {
    const result: GroupMember[] = [];
    for (const group of groups) {
      if (!selectedGroupIds.has(group.groupId)) continue;
      if (!group.allMembersLoaded) continue;
      result.push(...group.allMembers);
    }
    return result;
  }, [groups, selectedGroupIds]);

  const handleToggleMember = useCallback((memberId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }, []);

  const handleSelectAllMembers = useCallback(() => {
    setSelectedMemberIds(new Set(allMembers.map((m) => m.id)));
  }, [allMembers]);

  const handleDeselectAllMembers = useCallback(() => {
    setSelectedMemberIds(new Set());
  }, []);

  const handleGroupsLoaded = useCallback((newGroups: GroupWithMembers[]) => {
    setGroups((prev) => {
      const existingIds = new Set(prev.map((g) => g.groupId));
      const unique = newGroups.filter((g) => !existingIds.has(g.groupId));
      return [...prev, ...unique];
    });
  }, []);

  const handleCreateCampaign = useCallback(() => {
    const selected = allMembers.filter((m) => selectedMemberIds.has(m.id));
    if (selected.length === 0) {
      setError('Chọn ít nhất 1 thành viên để tạo chiến dịch');
      return;
    }

    const recipients = selected.map((m) => ({
      zaloId: m.id,
      name: m.displayName || m.zaloName,
    }));

    sessionStorage.setItem('group-campaign-recipients', JSON.stringify(recipients));
    sessionStorage.setItem('group-campaign-account-id', selectedAccountId);
    router.push('/message-with-phone?source=group');
  }, [allMembers, selectedMemberIds, selectedAccountId, router]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('link')}
          className={`border-b-2 px-1 pb-2 text-sm font-medium transition ${
            activeTab === 'link'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Nhập link
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('my-groups')}
          className={`border-b-2 px-1 pb-2 text-sm font-medium transition ${
            activeTab === 'my-groups'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Nhóm của tôi
        </button>
      </div>

      {activeTab === 'link' ? (
        <GroupLinkInput
          accounts={accounts}
          accountsLoading={accountsLoading}
          selectedAccountId={selectedAccountId}
          link={link}
          loading={fetchLoading || cooldown}
          onAccountChange={setSelectedAccountId}
          onLinkChange={setLink}
          onSubmit={handleFetchGroup}
        />
      ) : (
        <MyGroupsPanel
          accounts={accounts}
          accountsLoading={accountsLoading}
          selectedAccountId={selectedAccountId}
          onAccountChange={setSelectedAccountId}
          onGroupsLoaded={handleGroupsLoaded}
        />
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid min-h-[500px] grid-cols-1 gap-4 lg:grid-cols-2">
        <GroupDatagrid
          groups={groups}
          selectedIds={selectedGroupIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onLoadMembers={handleLoadMembers}
          loadingMembers={loadingMembers}
        />
        <div className="flex flex-col gap-4">
          <MemberListPanel
            groups={groups}
            selectedGroupIds={selectedGroupIds}
            selectedMemberIds={selectedMemberIds}
            onToggleMember={handleToggleMember}
            onSelectAllMembers={handleSelectAllMembers}
            onDeselectAllMembers={handleDeselectAllMembers}
          />
          {selectedMemberIds.size > 0 && (
            <button
              type="button"
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              onClick={handleCreateCampaign}
            >
              Tạo chiến dịch gửi tin ({selectedMemberIds.size} người)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
