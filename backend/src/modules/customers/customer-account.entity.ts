export type CustomerStatus = 'active' | 'disabled';

export interface CustomerAccount {
  id: string;
  email: string;
  name: string;
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date;
}
