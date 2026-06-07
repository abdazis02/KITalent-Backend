'use client';

import { auth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Skip the Authorization header (e.g. for login). */
  anonymous?: boolean;
  signal?: AbortSignal;
}

let refreshPromise: Promise<boolean> | null = null;

/** Single-flight refresh so concurrent 401s don't stampede the refresh endpoint. */
async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  const token = auth.refreshToken;
  if (!token) return false;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      auth.set({ accessToken: data.accessToken, refreshToken: data.refreshToken, tenantId: auth.tenantId });
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function request<T>(path: string, opts: RequestOptions = {}, isRetry = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!opts.anonymous && auth.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`;
  if (auth.tenantId) headers['x-tenant-id'] = auth.tenantId;

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  // Transparently refresh once on 401, then retry.
  if (res.status === 401 && !opts.anonymous && !isRetry) {
    const ok = await refreshAccessToken();
    if (ok) return request<T>(path, opts, true);
    auth.clear();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    const message =
      (body as { message?: string | string[] })?.message?.toString() ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown, opts?: Pick<RequestOptions, 'anonymous'>) =>
    request<T>(path, { method: 'POST', body, ...opts }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
