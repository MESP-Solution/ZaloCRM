export interface AuthSession {
  accessToken: string;
  expiresAt: Date;
  user: AuthenticatedPrincipal;
}

export type AuthRole = 'admin' | 'customer' | 'manager';

export interface AuthenticatedPrincipal {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  status: 'active' | 'disabled';
}

export type PublicAuthSession = Omit<AuthSession, 'accessToken'>;
