import { apiClient } from '../../../lib/api/api-client';

export const authApi = {
  login(email: string, password: string) {
    return apiClient<{
      accessToken: string;
      customerId: string;
      expiresAt: string;
    }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      credentials: 'include',
    });
  },

  register(email: string, password: string, name: string) {
    return apiClient<{
      accessToken: string;
      customerId: string;
      expiresAt: string;
    }>('/auth/register', {
      method: 'POST',
      body: { email, password, name },
      credentials: 'include',
    });
  },

  logout() {
    return apiClient<{ message: string }>('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  },
};
