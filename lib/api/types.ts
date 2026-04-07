// Shared types matching the backend DTOs and Prisma schema

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  tableName: string;
  recordId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ── Buyer ─────────────────────────────────────────────────────────────────────
export type PaymentTerms = 'NET30' | 'NET60' | 'NET90' | 'IMMEDIATE' | 'ADVANCE';
export type BuyerSegment = 'A' | 'B' | 'C';

export interface Buyer {
  id: string;
  tenantId: string;
  name: string;
  country: string;
  email?: string;
  phone?: string;
  currency: string;
  address?: string;
  isActive: boolean;
  paymentTerms?: PaymentTerms;
  creditLimit?: number;
  creditDays?: number;
  taxId?: string;
  segment?: BuyerSegment;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerStats {
  buyerId: string;
  totalOrders: number;
  gmv: number;
  outstandingBalance: number;
  paidAmount: number;
  averageOrderValue: number;
  lastOrderDate?: string;
}

export interface CreateBuyerDto {
  name: string;
  country: string;
  email?: string;
  phone?: string;
  currency?: string;
  address?: string;
  paymentTerms?: PaymentTerms;
  creditLimit?: number;
  creditDays?: number;
  taxId?: string;
  segment?: BuyerSegment;
  website?: string;
}

export interface BuyerFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  segment?: BuyerSegment;
  paymentTerms?: PaymentTerms;
  isActive?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// ── Supplier ───────────────────────────────────────────────────────────────────
export type SupplierService =
  | 'FABRIC'
  | 'KNITTING'
  | 'DYEING'
  | 'PRINTING'
  | 'SEWING'
  | 'PACKING'
  | 'EMBROIDERY';

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  gstin?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  services?: SupplierService[];
  vendorScore: number;
  isActive: boolean;
  pan?: string;
  paymentTerms?: PaymentTerms;
  creditDays?: number;
  bankAccount?: string;
  bankIfsc?: string;
  bankName?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierStats {
  supplierId: string;
  totalPOs: number;
  vendorScore: number;
  totalValue?: number;
}

export interface CreateSupplierDto {
  name: string;
  gstin?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  services?: SupplierService[];
  pan?: string;
  paymentTerms?: PaymentTerms;
  creditDays?: number;
  bankAccount?: string;
  bankIfsc?: string;
  bankName?: string;
  website?: string;
}

export interface SupplierFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  service?: SupplierService;
  paymentTerms?: PaymentTerms;
  isActive?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// ── Purchase Orders ────────────────────────────────────────────────────────────
export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACKNOWLEDGED'
  | 'PART_RECEIVED'
  | 'CLOSED'
  | 'CANCELLED';

export interface PurchaseOrderLine {
  id: string;
  tenantId: string;
  poId: string;
  itemId: string;
  description?: string;
  qty: number;
  unit: string;
  rate: number;
  hsnCode?: string;
  gstPct: number;
  receivedQty: number;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  supplierId: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  poDate: string;
  expectedDate: string;
  remarks?: string;
  sentAt?: string;
  createdById: string;
  lines: PurchaseOrderLine[];
  supplier?: Supplier;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePoLineDto {
  itemId: string;
  description?: string;
  qty: number;
  unit: string;
  rate: number;
  hsnCode?: string;
  gstPct?: number;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  poDate: string;
  expectedDate: string;
  remarks?: string;
  lines: CreatePoLineDto[];
}

export interface PoFilterParams {
  page?: number;
  limit?: number;
  supplierId?: string;
  status?: PurchaseOrderStatus;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// ── Orders ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'IN_PRODUCTION'
  | 'QC_PASSED'
  | 'DISPATCHED'
  | 'CANCELLED';

export interface OrderLine {
  id: string;
  orderId: string;
  itemId: string;
  item?: Item;
  styleCode: string;
  colour?: string;
  qty: number;
  sizesJson: Record<string, number>;
  unitPrice?: number;
}

export interface OrderRevision {
  id: string;
  orderId: string;
  revisionNo: number;
  changedFields: Record<string, { before: unknown; after: unknown }>;
  linesSnapshot?: OrderLine[];
  reason?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  tenantId: string;
  buyerId: string;
  buyer?: Buyer;
  poNumber: string;
  status: OrderStatus;
  deliveryDate: string;
  season?: string;
  remarks?: string;
  linesJson?: OrderLine[];
  totalQty: number;
  totalStyles: number;
  lines?: OrderLine[];
  revisions?: OrderRevision[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderLineDto {
  itemId: string;
  styleCode: string;
  colour?: string;
  sizesJson: Record<string, number>;
  unitPrice?: number;
}

export interface CreateOrderDto {
  buyerId: string;
  poNumber: string;
  deliveryDate: string;
  season?: string;
  remarks?: string;
  lines: CreateOrderLineDto[];
}

export interface OrderFilterParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  buyerId?: string;
  search?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export interface BomLine {
  id: string;
  bomId: string;
  rawItemId: string;
  rawItem?: Item;
  qty: number;
  unit: string;
  wastagePct: number;
}

export interface Bom {
  id: string;
  tenantId: string;
  itemId: string;
  item?: Item;
  styleCode?: string;
  version: number;
  isActive: boolean;
  remarks?: string;
  lines?: BomLine[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBomLineDto {
  rawItemId: string;
  qty: number;
  unit: string;
  wastagePct?: number;
}

export interface CreateBomDto {
  itemId: string;
  styleCode?: string;
  remarks?: string;
  lines: CreateBomLineDto[];
}

export interface StockBalance {
  id: string;
  itemId: string;
  item?: Item;
  location: string;
  onHand: number;
  reserved: number;
  available: number;
}

export interface StockLedgerEntry {
  id: string;
  itemId: string;
  item?: Item;
  location: string;
  entryType: string;
  qty: number;
  balanceQty: number;
  rate?: number;
  refType?: string;
  refId?: string;
  remarks?: string;
  createdAt: string;
}

// ── Items ──────────────────────────────────────────────────────────────────────
export type ItemCategory = 'FABRIC' | 'TRIM' | 'PACKING' | 'FINISHED_GOODS';

export interface Item {
  id: string;
  tenantId: string;
  name: string;
  unit: string;
  category: ItemCategory;
  properties?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
