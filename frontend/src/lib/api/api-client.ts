'use client';

import { appConfig } from '../../config/app-config';
import { ApiError } from './api-error';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  accessToken?: string;
  body?: unknown;
  method?: HttpMethod;
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : undefined;
}

function createApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, appConfig.apiBaseUrl).toString();
}

function createHeaders(options: ApiRequestOptions): Headers {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const token = options.accessToken ?? getCookie('access_token');
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  return headers;
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export async function apiClient<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(createApiUrl(path), {
    ...options,
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
    headers: createHeaders(options),
    method: options.method ?? 'GET',
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String(payload.message)
        : 'NestJS API request failed';

    throw new ApiError(message, response.status, payload);
  }

  return payload as TResponse;
}
