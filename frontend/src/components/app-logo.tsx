import Link from "next/link";

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
        Z
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-gray-950">ZaloCRM</span>
        <span className="block text-xs text-gray-500">Sales CRM</span>
      </span>
    </Link>
  );
}
