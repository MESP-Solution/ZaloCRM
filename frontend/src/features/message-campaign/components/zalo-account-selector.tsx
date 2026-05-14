import type { ZaloAccount } from '../../zalo-accounts/types';
import { getQuotaColor, getQuotaTextColor } from '../../../lib/utils/quota-display';

interface QuotaInfo {
  used: number;
  dailyLimit: number;
}

interface Props {
  accounts: ZaloAccount[];
  loading: boolean;
  selectedIds: string[];
  quotaMap?: Map<string, QuotaInfo>;
  hideQuota?: boolean;
  onChange: (ids: string[]) => void;
}

const STATUS_LABELS: Record<ZaloAccount['status'], string> = {
  active: 'Đang hoạt động',
  disconnected: 'Mất kết nối',
  login_failed: 'Đăng nhập lỗi',
  pending_login: 'Chờ đăng nhập',
  restricted: 'Bị hạn chế',
};

export function ZaloAccountSelector({ accounts, loading, selectedIds, quotaMap, hideQuota, onChange }: Props) {
  function toggleAccount(account: ZaloAccount) {
    if (account.status !== 'active') return;

    const nextIds = selectedIds.includes(account.id)
      ? selectedIds.filter((id) => id !== account.id)
      : [...selectedIds, account.id];

    onChange(nextIds);
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-950">Tài khoản Zalo gửi</h2>
        <p className="mt-1 text-sm text-gray-500">Chọn nhiều tài khoản. Hệ thống gửi tuần tự, không gửi đồng thời trên cùng tài khoản.</p>
      </div>

      {loading ? (
        <div className="rounded-md bg-gray-50 px-3 py-4 text-sm text-gray-500">Đang tải tài khoản...</div>
      ) : accounts.length === 0 ? (
        <div className="rounded-md bg-amber-50 px-3 py-4 text-sm text-amber-800">Chưa có tài khoản Zalo. Thêm và kết nối tài khoản trước khi tạo chiến dịch.</div>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => {
            const active = account.status === 'active';
            const selected = selectedIds.includes(account.id);
            const quota = quotaMap?.get(account.id);

            return (
              <button
                key={account.id}
                type="button"
                className={[
                  'w-full rounded-lg border p-3 text-left transition',
                  selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white',
                  active ? 'hover:border-blue-400' : 'cursor-not-allowed opacity-60',
                ].join(' ')}
                onClick={() => toggleAccount(account)}
                disabled={!active}
              >
                <div className="flex items-center gap-3">
                  {account.avatarUrl ? (
                    <img src={account.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                      {account.displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-950">{account.displayName}</p>
                    <p className="truncate text-xs text-gray-500">{account.phoneNumber || 'Chưa có SĐT'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={active ? 'text-xs font-medium text-emerald-700' : 'text-xs font-medium text-gray-500'}>
                      {STATUS_LABELS[account.status]}
                    </span>
                    {hideQuota ? (
                      <span className="text-xs font-medium text-green-600">Không giới hạn</span>
                    ) : quota && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full transition-all ${getQuotaColor(quota.used, quota.dailyLimit)}`}
                            style={{ width: `${Math.min((quota.used / quota.dailyLimit) * 100, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${getQuotaTextColor(quota.used, quota.dailyLimit)}`}>
                          {quota.used}/{quota.dailyLimit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
