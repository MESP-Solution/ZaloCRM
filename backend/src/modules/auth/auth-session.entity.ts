export interface AuthSession {
  accessToken: string;
  expiresAt: Date;
  user: AuthenticatedPrincipal;
}

export interface AuthenticatedPrincipal {
  id: string;
  email: string;
  name: string;
  roles: string[];
  status: 'active' | 'disabled';
}

export type PublicAuthSession = Omit<AuthSession, 'accessToken'>;
