'use client';

import { useMemo, useState } from 'react';
import type { GroupWithMembers } from '../types';

interface Props {
  groups: GroupWithMembers[];
  selectedIds: Set<string>;
  onToggleSelect: (groupId: string) => void;
  onSelectAll: () => void;
  onLoadMembers: () => void;
  loadingMembers: boolean;
}

export function GroupDatagrid({
  groups,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onLoadMembers,
  loadingMembers,
}: Props) {
  const [search, setSearch] = useState('');

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const keyword = search.trim().toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(keyword));
  }, [groups, search]);

  const allSelected = filteredGroups.length > 0 && filteredGroups.every((g) => selectedIds.has(g.groupId));

  return (
    <div className="flex max-h-[600px] flex-col rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-4 py-3">
        <input
          type="text"
          placeholder="Tìm nhóm theo tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          onClick={onSelectAll}
        >
          {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </button>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          onClick={onLoadMembers}
          disabled={selectedIds.size === 0 || loadingMembers}
        >
          {loadingMembers ? 'Đang tải...' : `Tải thành viên (${selectedIds.size})`}
        </button>
        {search && (
          <span className="text-xs text-gray-500">
            {filteredGroups.length}/{groups.length} nhóm
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {groups.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Nhập link nhóm và nhấn &quot;Lấy ngay&quot; để hiển thị thông tin nhóm
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Không tìm thấy nhóm nào khớp &quot;{search}&quot;
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="w-10 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-2">Nhóm</th>
                <th className="px-4 py-2">Trưởng nhóm</th>
                <th className="w-24 px-4 py-2 text-right">Thành viên</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => (
                <tr
                  key={group.groupId}
                  className="border-b border-gray-100 transition hover:bg-gray-50"
                >
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(group.groupId)}
                      onChange={() => onToggleSelect(group.groupId)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {group.avatar ? (
                        <img
                          src={group.avatar}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                          {group.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{group.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {group.members.find((m) => m.id === group.creatorId)?.displayName ?? 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {group.totalMember}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
