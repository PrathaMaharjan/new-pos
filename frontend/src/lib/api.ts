// Lightweight API client compatible with Axios-like calls (api.get, api.post, api.patch, api.delete)

export interface RequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  response: {
    status: number;
    data: any;
  };

  constructor(status: number, data: any) {
    super(typeof data?.error === 'string' ? data.error : 'API Request Failed');
    this.name = 'ApiError';
    this.response = { status, data };
  }
}

async function request<T = any>(
  endpoint: string,
  method: string,
  body?: any,
  config?: RequestConfig
): Promise<{ data: T }> {
  const url = new URL(
    endpoint.startsWith('http')
      ? endpoint
      : `${endpoint.startsWith('/') ? '' : '/'}${endpoint.startsWith('api/') || endpoint.startsWith('/api/') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`}`,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  );

  if (config?.params) {
    Object.entries(config.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.append(k, String(v));
      }
    });
  }

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers ?? {}),
      },
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(res.status, data);
    }

    return { data };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, { error: err?.message || 'Network error' });
  }
}

export const api = {
  get: <T = any>(url: string, config?: RequestConfig) => request<T>(url, 'GET', undefined, config),
  post: <T = any>(url: string, body?: any, config?: RequestConfig) => request<T>(url, 'POST', body, config),
  patch: <T = any>(url: string, body?: any, config?: RequestConfig) => request<T>(url, 'PATCH', body, config),
  put: <T = any>(url: string, body?: any, config?: RequestConfig) => request<T>(url, 'PUT', body, config),
  delete: <T = any>(url: string, config?: RequestConfig) => request<T>(url, 'DELETE', undefined, config),
};

export default api;
