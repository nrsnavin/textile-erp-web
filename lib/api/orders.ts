import { api, unwrap } from './client';
import type {
  Order,
  CreateOrderDto,
  OrderFilterParams,
  PaginatedResponse,
} from './types';

const BASE = '/api/v1/orders';

export const ordersApi = {
  list: (params?: OrderFilterParams) =>
    unwrap<PaginatedResponse<Order>>(api.get(BASE, { params })),

  get: (id: string) =>
    unwrap<Order>(api.get(`${BASE}/${id}`)),

  create: (data: CreateOrderDto) =>
    unwrap<Order>(api.post(BASE, data)),

  update: (id: string, data: Partial<CreateOrderDto>) =>
    unwrap<Order>(api.patch(`${BASE}/${id}`, data)),

  confirm: (id: string) =>
    unwrap<Order>(api.patch(`${BASE}/${id}/confirm`, {})),

  cancel: (id: string) =>
    unwrap<Order>(api.patch(`${BASE}/${id}/cancel`, {})),

  dispatch: (id: string) =>
    unwrap<Order>(api.patch(`${BASE}/${id}/dispatch`, {})),
};
