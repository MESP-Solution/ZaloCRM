import { apiClient } from '../../../lib/api/api-client';
import type { AuthUser, LoginResponse } from '../types';

export const authApi = {
  login(email: string, password: string) {
    return apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      credentials: 'include',
    });
  },

  register(email: string, password: string, name: string) {
    return apiClient<LoginResponse>('/auth/register', {
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

  me() {
    return apiClient<{ user: AuthUser }>('/auth/me', {
      credentials: 'include',
    });
  },
};
