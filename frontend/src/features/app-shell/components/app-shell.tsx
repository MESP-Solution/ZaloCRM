import Link from "next/link";
import { AppLogo } from "~components/app-logo";
import { mainNavigation } from "~config/navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-gray-200 bg-white px-5 py-6 lg:block">
        <AppLogo />
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
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
                      href={child.href ?? "#"}
                      key={child.href ?? child.label}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <Link
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
                href={item.href ?? "#"}
                key={item.href ?? item.label}
              >
                {item.label}
              </Link>
            )
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="lg:hidden">
              <AppLogo />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm text-gray-500">CRM</p>
              <p className="font-semibold text-gray-950">Customer operations</p>
            </div>
            <Link
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              href="/login"
            >
              Login
            </Link>
          </div>
        </header>

        <main className="px-5 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
