export interface NavigationItem {
  label: string;
  href?: string;
  children?: NavigationItem[];
}

export const mainNavigation: NavigationItem[] = [
  { label: "Trang chủ", href: "/dashboard" },
  {
    label: "Zalo",
    children: [
      { label: "Nhắn tin", href: "/messages" },
      { label: "Tài khoản Zalo", href: "/accounts" },
    ],
  },
  { label: "Liên hệ", href: "/contacts" },
  { label: "Công ty", href: "/companies" },
  { label: "Giao dịch", href: "/deals" },
];
