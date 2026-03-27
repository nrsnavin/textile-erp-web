const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3009';

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.errors?.message ?? `Error ${res.status}`);
  return json.data;
}

// Orders
export const ordersApi = {
  list:    (token: string) =>
    apiFetch('/api/v1/orders', { token }),
  confirm: (id: string, token: string) =>
    apiFetch(`/api/v1/orders/${id}/confirm`, { method: 'POST', token }),
};