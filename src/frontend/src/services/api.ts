export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '');

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    if (res.status === 401 && window.location.pathname !== '/login' && window.location.pathname !== '/') {
      window.location.href = '/login';
    }
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postFormData: <T>(path: string, formData: FormData) =>
    fetch(`${BASE_URL}${path}`, { method: 'POST', body: formData, credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401 && window.location.pathname !== '/login' && window.location.pathname !== '/') {
            window.location.href = '/login';
          }
          throw new ApiError(res.status, await res.text());
        }
        return res.json() as Promise<T>;
      }),
};

/**
 * Open a Server-Sent Events stream. Returns the EventSource and a close() function.
 * Credentials (cookies) are always included.
 */
export function openStream(
  path: string,
  onMessage: (payload: Record<string, unknown>) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): { es: EventSource; close: () => void } {
  const url = `${BASE_URL}${path}`;
  const es = new EventSource(url, { withCredentials: true });
  es.onmessage = (e) => {
    try {
      const payload = JSON.parse(e.data as string) as Record<string, unknown>;
      if (payload.type === 'done') {
        onDone();
        es.close();
      } else {
        onMessage(payload);
      }
    } catch { /* ignore malformed frames */ }
  };
  es.onerror = () => {
    onError('SSE connection error');
    es.close();
  };
  return { es, close: () => es.close() };
}
