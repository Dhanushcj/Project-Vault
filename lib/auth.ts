import { jwtDecode } from 'jwt-decode';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'developer' | 'viewer';
}

export interface AuthTokens {
  token: string;
  user: User;
}

export const setAuthData = (data: AuthTokens) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
};

export const getAuthData = (): AuthTokens | null => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && user) {
    return { token, user: JSON.parse(user) };
  }
  return null;
};

export const clearAuthData = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const authData = getAuthData();
  return authData?.user || null;
};

export const hasRole = (role: string): boolean => {
  const user = getCurrentUser();
  return user?.role === role;
};

export const canAccess = (requiredRole: 'admin' | 'developer' | 'viewer'): boolean => {
  const user = getCurrentUser();
  if (!user) return false;

  const roleHierarchy = { admin: 3, developer: 2, viewer: 1 };
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
};