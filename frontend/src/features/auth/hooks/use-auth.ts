'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth-api';

export function useAuth() {
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    } finally {
      router.push('/login');
      router.refresh();
    }
  }, [router]);

  return { logout };
}
