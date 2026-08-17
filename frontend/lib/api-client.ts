'use client';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'ocv_access_token';
const REFRESH_KEY = 'ocv_refresh_token';

let refreshPromise: Promise<string | null> | null = null;

function readStorage(key: string) {
  return typeof window === 'undefined' ? null : localStorage.getItem(key);
}

async function renewAccessToken(): Promise<string | null> {
  const refreshToken = readStorage(REFRESH_KEY);
  if (!refreshToken) return null;
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return null;
  const json = await response.json();
  const tokens = json?.data?.tokens;
  if (!tokens?.accessToken || !tokens?.refreshToken) return null;
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  return tokens.accessToken;
}

export async function apiFetch(path: string, init: RequestInit = {}, requireAuth = true): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = readStorage(TOKEN_KEY);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  let response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, { ...init, headers });
  if (requireAuth && response.status === 401 && readStorage(REFRESH_KEY)) {
    refreshPromise ||= renewAccessToken().finally(() => { refreshPromise = null; });
    const nextToken = await refreshPromise;
    if (nextToken) {
      headers.set('Authorization', `Bearer ${nextToken}`);
      response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, { ...init, headers });
    }
  }
  return response;
}

export { API_URL, SITE_URL };
