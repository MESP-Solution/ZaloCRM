import { apiClient } from '../../../lib/api/api-client';
import type { ZaloAccount, UpdateZaloAccountRequest, LoginWithCookieRequest } from '../types';

export const zaloAccountsApi = {
  list() {
    return apiClient<ZaloAccount[]>('/zalo-accounts', {
      credentials: 'include',
    });
  },

  get(accountId: string) {
    return apiClient<ZaloAccount>(`/zalo-accounts/${accountId}`, {
      credentials: 'include',
    });
  },

  update(accountId: string, data: UpdateZaloAccountRequest) {
    return apiClient<{ success: boolean; message: string }>(`/zalo-accounts/${accountId}`, {
      method: 'PATCH',
      body: data,
      credentials: 'include',
    });
  },

  delete(accountId: string) {
    return apiClient<{ success: boolean; message: string }>(`/zalo-accounts/${accountId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  },

  loginWithCookie(data: LoginWithCookieRequest) {
    return apiClient<{ success: boolean; accountId: string; message: string }>(
      '/zalo-connections/login-cookie',
      {
        method: 'POST',
        body: data,
        credentials: 'include',
      },
    );
  },
};
