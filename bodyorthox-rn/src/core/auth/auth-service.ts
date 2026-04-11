export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'practitioner';
  firstName?: string;
  lastName?: string;
}

export interface IAuthService {
  login(email: string, password: string): Promise<{ user: AuthUser }>;
  logout(): Promise<void>;
  getMe(): Promise<AuthUser>;
}
