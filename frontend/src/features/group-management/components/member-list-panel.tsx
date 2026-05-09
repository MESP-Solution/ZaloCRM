'use client';

import { useMemo, useState } from 'react';
import type { GroupMember, GroupWithMembers } from '../types';

const PAGE_SIZE = 50;

interface MemberRow {
  member: GroupMember;
  groupName: string;
  role: string;
}

interface Props {
  groups: GroupWithMembers[];
  selectedGroupIds: Set<string>;
  selectedMemberIds: Set<string>;
  onToggleMember: (memberId: string) => void;
  onSelectAllMembers: () => void;
  onDeselectAllMembers: () => void;
}

function getMemberRole(member: GroupMember, group: GroupWithMembers): string {
  if (member.id === group.creatorId) return 'Trưởng nhóm';
  if (group.adminIds.includes(member.id)) return 'Phó nhóm';
  return 'Thành viên';
}

export function MemberListPanel({
  groups,
  selectedGroupIds,
  selectedMemberIds,
  onToggleMember,
  onSelectAllMembers,
  onDeselectAllMembers,
}: Props) {
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const result: MemberRow[] = [];
    for (const group of groups) {
      if (!selectedGroupIds.has(group.groupId)) continue;
      if (!group.allMembersLoaded) continue;
      for (const member of group.allMembers) {
        result.push({
          member,
          groupName: group.name,
          role: getMemberRole(member, group),
        });
      }
    }
    return result;
  }, [groups, selectedGroupIds]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const allSelected = rows.length > 0 && selectedMemberIds.size === rows.length;

  return (
    <div className="flex max-h-[600px] flex-col rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Thành viên ({rows.length})
          </h3>
          {rows.length > 0 && (
            <span className="text-xs text-blue-600">
              Đã chọn: {selectedMemberIds.size}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <button
              type="button"
              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 transition hover:bg-gray-100"
              onClick={allSelected ? onDeselectAllMembers : onSelectAllMembers}
            >
              {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          )}
          {rows.length > PAGE_SIZE && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <button
                type="button"
                className="rounded border border-gray-300 px-2 py-1 transition hover:bg-gray-100 disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                &lt;
              </button>
              <span>
                {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                className="rounded border border-gray-300 px-2 py-1 transition hover:bg-gray-100 disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Chọn nhóm và nhấn &quot;Tải thành viên&quot; để xem danh sách
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="w-10 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={allSelected ? onDeselectAllMembers : onSelectAllMembers}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-2">Thành viên</th>
                <th className="px-4 py-2">Vai trò</th>
                <th className="px-4 py-2">Nhóm</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, idx) => (
                <tr
                  key={`${row.member.id}-${row.groupName}-${idx}`}
                  className="border-b border-gray-100 transition hover:bg-gray-50"
                >
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.has(row.member.id)}
                      onChange={() => onToggleMember(row.member.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {row.member.avatar ? (
                        <img
                          src={row.member.avatar}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                          {(row.member.displayName || row.member.zaloName || '?').charAt(0)}
                        </div>
                      )}
                      <span className="text-gray-900">
                        {row.member.displayName || row.member.zaloName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        row.role === 'Trưởng nhóm'
                          ? 'text-xs font-medium text-blue-700'
                          : row.role === 'Phó nhóm'
                            ? 'text-xs font-medium text-emerald-700'
                            : 'text-xs text-gray-600'
                      }
                    >
                      {row.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{row.groupName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
