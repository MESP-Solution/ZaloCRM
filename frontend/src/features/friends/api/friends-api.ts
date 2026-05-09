import { apiClient } from '../../../lib/api/api-client';
import type { ZaloFriend } from '../types';

export const friendsApi = {
  getAll(accountId?: string) {
    const params = accountId ? `?${new URLSearchParams({ accountId })}` : '';
    return apiClient<ZaloFriend[]>(`/zalo-connections/friends${params}`, {
      credentials: 'include',
    });
  },

  getRelatedGroups(friendIds: string[], accountId?: string) {
    return apiClient<Record<string, string[]>>(
      '/zalo-connections/friends/related-groups',
      {
        method: 'POST',
        body: { friendIds, accountId },
        credentials: 'include',
      },
    );
  },
};
