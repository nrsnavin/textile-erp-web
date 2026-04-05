import { api, unwrap } from './client';
import type {
  Supplier,
  SupplierStats,
  SupplierFilterParams,
  CreateSupplierDto,
  PaginatedResponse,
  AuditLog,
  PurchaseOrder,
  CreatePurchaseOrderDto,
  PoFilterParams,
  PurchaseOrderLine,
} from './types';

const BASE = '/api/v1/suppliers';
const PO_BASE = '/api/v1/suppliers/purchase-orders';

export const suppliersApi = {
  list: (params?: SupplierFilterParams) =>
    unwrap<PaginatedResponse<Supplier>>(api.get(BASE, { params })),

  get: (id: string) =>
    unwrap<Supplier>(api.get(`${BASE}/${id}`)),

  stats: (id: string) =>
    unwrap<SupplierStats>(api.get(`${BASE}/${id}/stats`)),

  audit: (id: string) =>
    unwrap<AuditLog[]>(api.get(`${BASE}/${id}/audit`)),

  create: (data: CreateSupplierDto) =>
    unwrap<Supplier>(api.post(BASE, data)),

  update: (id: string, data: Partial<CreateSupplierDto> & { isActive?: boolean }) =>
    unwrap<Supplier>(api.patch(`${BASE}/${id}`, data)),

  deactivate: (id: string) =>
    unwrap<Supplier>(api.delete(`${BASE}/${id}`)),
};

export const purchaseOrdersApi = {
  list: (params?: PoFilterParams) =>
    unwrap<PaginatedResponse<PurchaseOrder>>(api.get(PO_BASE, { params })),

  get: (id: string) =>
    unwrap<PurchaseOrder>(api.get(`${PO_BASE}/${id}`)),

  create: (data: CreatePurchaseOrderDto) =>
    unwrap<PurchaseOrder>(api.post(PO_BASE, data)),

  updateLines: (id: string, lines: Partial<PurchaseOrderLine>[]) =>
    unwrap<PurchaseOrder>(api.patch(`${PO_BASE}/${id}/lines`, lines)),

  send: (id: string) =>
    unwrap<PurchaseOrder>(api.patch(`${PO_BASE}/${id}/send`, {})),

  acknowledge: (id: string) =>
    unwrap<PurchaseOrder>(api.patch(`${PO_BASE}/${id}/acknowledge`, {})),

  close: (id: string) =>
    unwrap<PurchaseOrder>(api.patch(`${PO_BASE}/${id}/close`, {})),

  cancel: (id: string) =>
    unwrap<PurchaseOrder>(api.patch(`${PO_BASE}/${id}/cancel`, {})),
};
