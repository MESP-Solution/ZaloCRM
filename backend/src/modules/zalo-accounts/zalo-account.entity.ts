export type ZaloAccountStatus =
  | 'pending_login'
  | 'active'
  | 'disconnected'
  | 'restricted';

export interface ZaloAccount {
  id: string;
  customerId: string;
  displayName: string;
  providerAccountId?: string;
  status: ZaloAccountStatus;
  createdAt: Date;
  updatedAt: Date;
}
