import { apiClient } from '../../../lib/api/api-client';
import type { ZaloAccount, UpdateZaloAccountRequest, LoginWithCookieRequest, LoginWithQrRequest } from '../types';

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

  reconnect(accountId: string) {
    return apiClient<{ success: boolean; message: string }>(
      `/zalo-connections/${accountId}/reconnect`,
      { method: 'POST' },
    );
  },

  disconnect(accountId: string) {
    return apiClient<{ success: boolean; message: string }>(
      `/zalo-connections/${accountId}/disconnect`,
      { method: 'POST' },
    );
  },

  getQuota() {
    return apiClient<{ accountId: string; used: number; dailyLimit: number }[]>(
      '/zalo-accounts/quota',
    );
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

  loginWithQr(data: LoginWithQrRequest) {
    return apiClient<{ success: boolean; accountId: string }>(
      '/zalo-connections/login-qr',
      {
        method: 'POST',
        body: data,
        credentials: 'include',
      },
    );
  },

  cancelQrLogin() {
    return apiClient<{ success: boolean; message: string }>(
      '/zalo-connections/login-qr/cancel',
      {
        method: 'POST',
        credentials: 'include',
      },
    );
  },
};
