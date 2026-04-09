import { api, unwrap } from './client';
import type {
  Bom,
  CreateBomDto,
  StockBalance,
  StockLedgerEntry,
  IssueToProductionDto,
  ReturnFromProductionDto,
  TransferStockDto,
  SetOpeningStockDto,
  MovementFilterParams,
  PaginatedResponse,
} from './types';

const BOM_BASE   = '/api/v1/inventory/boms';
const STOCK_BASE = '/api/v1/inventory/stock';
const GRN_BASE   = '/api/v1/inventory/grn';

export const inventoryApi = {
  // BOMs
  listBoms: (params?: { page?: number; limit?: number }) =>
    unwrap<Bom[]>(api.get(BOM_BASE, { params })),

  getBom: (id: string) =>
    unwrap<Bom>(api.get(`${BOM_BASE}/${id}`)),

  createBom: (data: CreateBomDto) =>
    unwrap<Bom>(api.post(BOM_BASE, data)),

  // Stock balances
  listStock: (location?: string) =>
    unwrap<StockBalance[]>(api.get(STOCK_BASE, { params: location ? { location } : undefined })),

  // Movement history (replaces getStockLedger)
  getMovements: (params?: MovementFilterParams) =>
    unwrap<PaginatedResponse<StockLedgerEntry>>(api.get(`${STOCK_BASE}/movements`, { params })),

  // Stock movements
  adjustStock: (data: { itemId: string; location?: string; qty: number; reason: string }) =>
    unwrap<{ ledger: StockLedgerEntry; balance: StockBalance }>(api.post(`${STOCK_BASE}/adjust`, data)),

  issueToProduction: (data: IssueToProductionDto) =>
    unwrap<{ ledger: StockLedgerEntry; balance: StockBalance }>(api.post(`${STOCK_BASE}/issue`, data)),

  returnFromProduction: (data: ReturnFromProductionDto) =>
    unwrap<{ ledger: StockLedgerEntry; balance: StockBalance }>(api.post(`${STOCK_BASE}/return`, data)),

  transferStock: (data: TransferStockDto) =>
    unwrap<{ srcLedger: StockLedgerEntry; dstLedger: StockLedgerEntry }>(api.post(`${STOCK_BASE}/transfer`, data)),

  setOpeningStock: (data: SetOpeningStockDto) =>
    unwrap<{ ledger: StockLedgerEntry; balance: StockBalance }>(api.post(`${STOCK_BASE}/opening`, data)),

  rebuildBalance: (itemId: string, location: string) =>
    unwrap<{ balance: StockBalance; rebuiltFrom: string }>(api.post(`${STOCK_BASE}/rebuild`, { itemId, location })),

  // GRN
  postGrn: (grnId: string) =>
    unwrap<{ id: string }>(api.patch(`${GRN_BASE}/${grnId}/post`, {})),
};
