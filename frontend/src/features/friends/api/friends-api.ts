import { apiClient } from '../../../lib/api/api-client';
import type { ZaloFriend } from '../types';

export const friendsApi = {
  getAll(accountId?: string) {
    const params = accountId ? `?${new URLSearchParams({ accountId })}` : '';
    return apiClient<ZaloFriend[]>(`/zalo-connections/friends${params}`, {
      credentials: 'include',
    });
  },

};
