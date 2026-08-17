// Pure browser cookie helpers — no external packages needed, SSR-safe
import { apiFetch } from './api-client';

function setCookie(name: string, value: string, days: number, path = '/') {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function removeCookie(name: string, path = '/') {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
}

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roleCode: string;
  role?: string;
  phone?: string;
  customerCode?: string;
  balanceVnd?: number;
  avatarUrl?: string;
  preferredLanguage?: string;
}

const TOKEN_KEY = 'ocv_access_token';
const REFRESH_KEY = 'ocv_refresh_token';
const USER_KEY = 'ocv_user_session';
let profileRequest: Promise<UserSession> | null = null;

export const authStore = {
  setSession(tokens: { accessToken: string; refreshToken: string }, user: UserSession) {
    setCookie(TOKEN_KEY, tokens.accessToken, 1);
    setCookie(REFRESH_KEY, tokens.refreshToken, 7);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    }
  },

  async loginWithApi(email: string, password?: string): Promise<UserSession> {
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      }, false);
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const { tokens, user } = json.data;
        const sessionUser: UserSession = {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roleCode: user.roleCode || 'CUSTOMER',
          role: user.roleCode || 'CUSTOMER',
          phone: user.phone,
          customerCode: user.customerCode,
          balanceVnd: user.balanceVnd || 0,
        };
        this.setSession(tokens, sessionUser);
        return sessionUser;
      } else if (json.message) {
        throw new Error(json.message);
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
    }

    throw new Error('Không thể kết nối máy chủ. Vui lòng thử lại sau.');
  },

  async logoutWithApi(): Promise<void> {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {}
    this.clearSession();
  },

  getUser(): UserSession | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;

    try {
      const sessionUser: UserSession = JSON.parse(data);
      return sessionUser;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return getCookie(TOKEN_KEY);
  },

  isLoggedIn(): boolean {
    return !!this.getUser();
  },

  async refreshProfile(): Promise<UserSession> {
    if (profileRequest) return profileRequest;

    profileRequest = (async () => {
      const response = await apiFetch('/auth/me');
      const responseText = await response.text();
      let json: any = {};
      try {
        json = responseText ? JSON.parse(responseText) : {};
      } catch {
        if (!response.ok) throw new Error(responseText || 'Không thể tải hồ sơ');
        throw new Error('Phản hồi hồ sơ từ máy chủ không hợp lệ');
      }
      if (!response.ok) throw new Error(json.message || 'Không thể tải hồ sơ');
      const user = json.user || json.data;
      const session = { ...this.getUser(), ...user, balanceVnd: Number(user.balanceVnd ?? user.balance ?? 0) } as UserSession;
      if (typeof window !== 'undefined') localStorage.setItem(USER_KEY, JSON.stringify(session));
      return session;
    })().finally(() => {
      profileRequest = null;
    });

    return profileRequest;
  },

  async updateProfile(data: Record<string, unknown>): Promise<UserSession> {
    const response = await apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify(data) });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Không thể cập nhật hồ sơ');
    const session = { ...this.getUser(), ...json.data } as UserSession;
    if (typeof window !== 'undefined') localStorage.setItem(USER_KEY, JSON.stringify(session));
    return session;
  },

  clearSession() {
    removeCookie(TOKEN_KEY, '/');
    removeCookie(REFRESH_KEY, '/');
    removeCookie('ocv_access_token', '/');
    removeCookie('ocv_refresh_token', '/');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      sessionStorage.clear();
    }
  },
};
