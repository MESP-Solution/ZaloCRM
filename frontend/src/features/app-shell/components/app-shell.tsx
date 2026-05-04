'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppLogo } from '~components/app-logo';
import { mainNavigation } from '~config/navigation';
import { useAuth } from '~features/auth/hooks/use-auth';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, loading, logout, fetchCurrentUser } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  function isActive(href?: string) {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  }

  function getPageTitle(path: string): string {
    const titles: Record<string, string> = {
      '/dashboard': 'Trang chủ',
      '/accounts': 'Tài khoản Zalo',
      '/message-with-phone': 'Nhắn tin theo số điện thoại',
      '/contacts': 'Liên hệ',
      '/companies': 'Công ty',
      '/deals': 'Giao dịch',
    };
    for (const [route, title] of Object.entries(titles)) {
      if (path === route || path.startsWith(route + '/')) return title;
    }
    return 'ZaloMKT';
  }

  function getPageDescription(path: string): string {
    const descriptions: Record<string, string> = {
      '/dashboard': 'Tổng quan hoạt động',
      '/accounts': 'Quản lý kết nối tài khoản Zalo',
      '/message-with-phone': 'Tạo chiến dịch gửi tin nhắn Zalo đến danh sách SĐT',
      '/contacts': 'Quản lý danh sách liên hệ',
      '/companies': 'Quản lý công ty',
      '/deals': 'Quản lý giao dịch',
    };
    for (const [route, desc] of Object.entries(descriptions)) {
      if (path === route || path.startsWith(route + '/')) return desc;
    }
    return '';
  }

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <div className="min-h-screen bg-gray-100">
      <aside
        className={`fixed inset-y-0 left-0 hidden border-r border-gray-200 bg-white px-5 py-6 transition-all duration-200 lg:block ${
          collapsed ? 'w-16' : 'w-72'
        }`}
      >
        <div className="flex items-center justify-between">
          {!collapsed && <AppLogo />}
          <button
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`size-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {!collapsed && (
          <nav className="mt-10 space-y-1">
            {mainNavigation.map((item) => (
              item.children && item.children.length > 0 ? (
                <details className="group" key={item.label}>
                  <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-950">
                    <div className="flex items-center justify-between gap-2">
                      <span>{item.label}</span>
                      <span className="text-xs transition group-open:rotate-180">v</span>
                    </div>
                  </summary>
                  <div className="mt-1 space-y-1 pl-3">
                    {item.children.map((child) => (
                      <Link
                        className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isActive(child.href)
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
                        }`}
                        href={child.href ?? '#'}
                        key={child.href ?? child.label}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
                  }`}
                  href={item.href ?? '#'}
                  key={item.href ?? item.label}
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>
        )}

        {collapsed && (
          <nav className="mt-10 space-y-1">
            {mainNavigation.map((item) => (
              <Link
                className={`flex items-center justify-center rounded-lg p-2 transition ${
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
                }`}
                href={item.href ?? '#'}
                key={item.href ?? item.label}
                title={item.label}
              >
                <span className="size-5 text-center text-sm font-medium">
                  {item.label.charAt(0).toUpperCase()}
                </span>
              </Link>
            ))}
          </nav>
        )}
      </aside>

      <div className={`transition-all duration-200 ${collapsed ? 'lg:pl-16' : 'lg:pl-72'}`}>
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="lg:hidden">
              <AppLogo />
            </div>
            <div className="hidden lg:block">
              <p className="font-semibold text-gray-950">{getPageTitle(pathname)}</p>
              <p className="text-sm text-gray-500">{getPageDescription(pathname)}</p>
            </div>
            <div className="flex items-center gap-3">
              {loading && !user ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  Loading...
                </div>
              ) : user ? (
                <>
                  <div className="hidden text-right md:block">
                    <p className="text-sm font-medium text-gray-950">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  href="/login"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="px-5 py-4 md:px-8">{children}</main>
      </div>
    </div>
  );
}
