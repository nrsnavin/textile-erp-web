import { api, unwrap } from './client';
import type {
  Bom,
  CreateBomDto,
  StockBalance,
  StockLedgerEntry,
  PaginatedResponse,
} from './types';

const BOM_BASE  = '/api/v1/inventory/boms';
const STOCK_BASE = '/api/v1/inventory/stock';
const GRN_BASE   = '/api/v1/inventory/grn';

export const inventoryApi = {
  // BOMs
  listBoms: (params?: { page?: number; limit?: number }) =>
    unwrap<PaginatedResponse<Bom>>(api.get(BOM_BASE, { params })),

  getBom: (id: string) =>
    unwrap<Bom>(api.get(`${BOM_BASE}/${id}`)),

  createBom: (data: CreateBomDto) =>
    unwrap<Bom>(api.post(BOM_BASE, data)),

  // Stock
  listStock: (location?: string) =>
    unwrap<StockBalance[]>(api.get(STOCK_BASE, { params: location ? { location } : undefined })),

  getStockLedger: (params?: { itemId?: string; location?: string; from?: string; to?: string }) =>
    unwrap<StockLedgerEntry[]>(api.get(`${STOCK_BASE}/ledger`, { params })),

  adjustStock: (data: {
    itemId: string;
    location: string;
    qty: number;
    reason?: string;
  }) =>
    unwrap<StockBalance>(api.post(`${STOCK_BASE}/adjust`, data)),

  // GRN
  postGrn: (grnId: string) =>
    unwrap<{ id: string }>(api.patch(`${GRN_BASE}/${grnId}/post`, {})),
};
