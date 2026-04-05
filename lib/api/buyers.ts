import { api, unwrap } from './client';
import type {
  Buyer,
  BuyerStats,
  BuyerFilterParams,
  CreateBuyerDto,
  PaginatedResponse,
  AuditLog,
} from './types';

const BASE = '/api/v1/buyers';

export const buyersApi = {
  list: (params?: BuyerFilterParams) =>
    unwrap<PaginatedResponse<Buyer>>(api.get(BASE, { params })),

  get: (id: string) =>
    unwrap<Buyer>(api.get(`${BASE}/${id}`)),

  stats: (id: string) =>
    unwrap<BuyerStats>(api.get(`${BASE}/${id}/stats`)),

  audit: (id: string) =>
    unwrap<AuditLog[]>(api.get(`${BASE}/${id}/audit`)),

  create: (data: CreateBuyerDto) =>
    unwrap<Buyer>(api.post(BASE, data)),

  update: (id: string, data: Partial<CreateBuyerDto> & { isActive?: boolean }) =>
    unwrap<Buyer>(api.patch(`${BASE}/${id}`, data)),

  deactivate: (id: string) =>
    unwrap<Buyer>(api.delete(`${BASE}/${id}`)),

  reactivate: (id: string) =>
    unwrap<Buyer>(api.patch(`${BASE}/${id}/reactivate`, {})),
};
