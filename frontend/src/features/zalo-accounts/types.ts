export type ZaloAccountStatus =
  | 'pending_login'
  | 'active'
  | 'disconnected'
  | 'restricted'
  | 'login_failed';

export interface ZaloAccount {
  id: string;
  displayName: string;
  avatarUrl?: string;
  status: ZaloAccountStatus;
  phoneNumber?: string;
  proxyUrl?: string;
  providerAccountId?: string;
  lastConnectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateZaloAccountRequest {
  displayName?: string;
  imei?: string;
  userAgent?: string;
  cookie?: object[];
}

export interface LoginWithCookieRequest {
  imei: string;
  userAgent: string;
  cookie: object[];
  proxyUrl?: string;
}
