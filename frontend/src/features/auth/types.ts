export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  status: 'active' | 'disabled';
}

export interface LoginResponse {
  expiresAt: string;
  user: AuthUser;
}
