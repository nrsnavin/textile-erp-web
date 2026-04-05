import { api, unwrap } from './client';
import type { Item, PaginatedResponse } from './types';

export const itemsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
    unwrap<PaginatedResponse<Item>>(api.get('/api/v1/items', { params })),

  get: (id: string) =>
    unwrap<Item>(api.get(`/api/v1/items/${id}`)),
};
