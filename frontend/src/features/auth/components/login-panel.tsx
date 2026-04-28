'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth-api';

export function LoginPanel() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.login(email, password);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-gray-950 text-white lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex flex-col justify-between px-8 py-10 md:px-14">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold">
            Z
          </span>
          <span className="text-lg font-semibold">ZaloCRM</span>
        </div>

        <div className="max-w-2xl py-20">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-blue-200">
            CRM SaaS tool
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-6xl">
            Quan ly lead, deal va khach hang trong mot he thong gon.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-gray-300">
            Frontend da san sang ket noi NestJS API qua service layer typed.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-10 text-gray-950">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold">Dang nhap</h2>
          <p className="mt-2 text-sm text-gray-500">
            Tren he thong ZaloCRM.
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input
                className="mt-2 h-12 w-full rounded-lg border border-gray-300 px-4 outline-none focus:border-blue-600"
                name="email"
                placeholder="you@company.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Password</span>
              <input
                className="mt-2 h-12 w-full rounded-lg border border-gray-300 px-4 outline-none focus:border-blue-600"
                name="password"
                placeholder="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button
              className="h-12 w-full rounded-lg bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Dang nhap...' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
