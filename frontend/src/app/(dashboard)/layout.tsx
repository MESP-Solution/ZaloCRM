import { AppShell } from "~features/app-shell/components/app-shell";
import { ToastProvider } from "~lib/ui/toast-context";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
    </ToastProvider>
  );
}
