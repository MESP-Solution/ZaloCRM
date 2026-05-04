'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth-api';

const trustSignals = [
  'Luồng bán hàng rõ ràng',
  'Dữ liệu khách hàng tập trung',
];

export function LoginPanel() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const hasError = Boolean(error);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.login(email, password);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể đăng nhập';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate min-h-[100dvh] overflow-hidden bg-[#06111f] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(135deg,rgba(0,104,255,0.22),transparent_30%),linear-gradient(28deg,transparent_0%,rgba(0,184,255,0.16)_34%,transparent_58%),linear-gradient(180deg,#06111f_0%,#0a1b33_54%,#f7faff_54%,#f7faff_100%)] md:bg-[linear-gradient(115deg,#06111f_0%,#0a1b33_49%,#f7faff_49%,#f7faff_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:44px_44px]" />

      <section className="mx-auto grid min-h-[100dvh] w-full max-w-7xl grid-cols-1 px-4 py-8 md:grid-cols-[1.04fr_0.96fr] md:px-8 md:py-24 lg:px-12">
        <div className="login-reveal flex flex-col justify-between gap-12 md:pr-12">
          <div className="inline-flex w-fit items-center gap-3 rounded-full bg-white/[0.06] p-1.5 ring-1 ring-white/10">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#0068ff] text-sm font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.28)]">
              Z
            </span>
            <span className="pr-4 text-sm font-medium text-white/90">
              ZaloMKT
            </span>
          </div>

          <div className="max-w-2xl">
            <h1 className="mt-7 text-5xl font-semibold leading-[0.95] text-white md:text-7xl">
              MESP Xin chào!
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/70 md:text-lg">
              Đăng nhập để tiếp tục vận hành pipeline, chăm sóc khách hàng và
              theo dõi hiệu suất đội ngũ từ một giao diện MKT thống nhất.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 md:max-w-2xl">
            {trustSignals.map((signal) => (
              <div
                className="rounded-[1.35rem] bg-white/[0.055] p-1 ring-1 ring-white/10"
                key={signal}
              >
                <div className="min-h-24 rounded-[calc(1.35rem-0.25rem)] bg-white/[0.045] px-4 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
                  <span className="block text-[11px] font-medium uppercase text-[#9bd8ff]">
                    MKT
                  </span>
                  <p className="mt-3 text-sm leading-5 text-white/80">{signal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="login-reveal login-reveal-delayed flex items-center justify-center py-10 md:py-0">
          <div className="w-full max-w-[31rem] rounded-[2rem] bg-[#0068ff]/10 p-1.5 ring-1 ring-[#0068ff]/20 shadow-[0_30px_90px_rgba(0,104,255,0.18)]">
            <div className="rounded-[calc(2rem-0.375rem)] bg-[#f7faff] p-6 text-[#0b1220] shadow-[inset_0_1px_1px_rgba(255,255,255,0.92)] md:p-8">
              <div className="rounded-[1.5rem] bg-[#06111f] p-1 ring-1 ring-white/10">
                <div className="rounded-[calc(1.5rem-0.25rem)] bg-[linear-gradient(135deg,#0b2a55,#06111f)] px-5 py-5 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
                  <p className="text-[10px] font-medium uppercase text-[#9bd8ff]">
                    Phiên làm việc bảo mật
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold">
                    Đăng nhập
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Truy cập hệ thống ZaloMKT bằng tài khoản đã được cấp.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-[1.25rem] bg-[#fff0ed] p-1 ring-1 ring-[#f0b7aa]/50">
                  <p
                    className="rounded-[calc(1.25rem-0.25rem)] bg-white px-4 py-3 text-sm font-medium text-[#a33422] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]"
                    id="login-error"
                    role="alert"
                  >
                    {error}
                  </p>
                </div>
              )}

              <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-[#64748b]">
                    Email
                  </span>
                  <input
                    className="mt-2 h-14 w-full rounded-2xl bg-[#edf4ff] px-5 text-[15px] text-[#0b1220] outline-none ring-1 ring-[#0068ff]/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] transition-[box-shadow,transform,background-color] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-[#7890ad] focus:bg-white focus:ring-[#0068ff]/45 focus:-translate-y-px"
                    name="email"
                    placeholder="ten@congty.vn"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-describedby={hasError ? 'login-error' : undefined}
                    aria-invalid={hasError}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-[#64748b]">
                    Mật khẩu
                  </span>
                  <input
                    className="mt-2 h-14 w-full rounded-2xl bg-[#edf4ff] px-5 text-[15px] text-[#0b1220] outline-none ring-1 ring-[#0068ff]/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] transition-[box-shadow,transform,background-color] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-[#7890ad] focus:bg-white focus:ring-[#0068ff]/45 focus:-translate-y-px"
                    name="password"
                    placeholder="Nhập mật khẩu"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-describedby={hasError ? 'login-error' : undefined}
                    aria-invalid={hasError}
                    required
                  />
                </label>

                <button
                  className="group flex h-14 w-full items-center justify-between rounded-full bg-[#0068ff] pl-6 pr-2 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(0,104,255,0.28),inset_0_1px_1px_rgba(255,255,255,0.22)] transition-[transform,box-shadow,background-color,opacity] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#0054d9] hover:shadow-[0_24px_70px_rgba(0,104,255,0.34),inset_0_1px_1px_rgba(255,255,255,0.24)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={loading}
                >
                  <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
                  <span
                    className="flex size-10 items-center justify-center rounded-full bg-[#dbeafe] text-lg text-[#0068ff] transition-[transform] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[#64748b]">
                Liên hệ Zalo:{' '}
                <a
                  className="font-semibold text-[#0b1220] underline decoration-[#0068ff]/50 underline-offset-4 transition-[color] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#0068ff]"
                  href="https://zalo.me/0901267368"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  0901267368
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
