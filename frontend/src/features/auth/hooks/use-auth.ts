'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth-api';
import type { AuthUser } from '../types';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      setUser(response.user);
      setInitialized(true);
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authApi.me();
      setUser(response.user);
      setInitialized(true);
      return response.user;
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      setUser(null);
      setInitialized(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      router.push('/login');
      router.refresh();
    }
  }, [router]);

  return { user, loading, initialized, login, logout, fetchCurrentUser };
}
