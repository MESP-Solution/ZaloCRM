'use client';

import type { ZaloAccount } from '../../zalo-accounts/types';

interface Props {
  accounts: ZaloAccount[];
  accountsLoading: boolean;
  selectedAccountId: string;
  link: string;
  loading: boolean;
  onAccountChange: (id: string) => void;
  onLinkChange: (link: string) => void;
  onSubmit: () => void;
}

export function GroupLinkInput({
  accounts,
  accountsLoading,
  selectedAccountId,
  link,
  loading,
  onAccountChange,
  onLinkChange,
  onSubmit,
}: Props) {
  const activeAccounts = accounts.filter((a) => a.status === 'active');

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Link nhóm Zalo
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="https://zalo.me/g/..."
          value={link}
          onChange={(e) => onLinkChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        />
      </div>

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
        onClick={onSubmit}
        disabled={loading || !link || !selectedAccountId}
      >
        {loading ? 'Đang tải...' : 'Lấy ngay'}
      </button>
    </div>
  );
}
