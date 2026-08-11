/**
 * Types untuk Realtime Stock On Hand (Outbound Salesman)
 * GET /outbound-sales/on-hand-meta
 */

export type GetRealTimeSOHParams = {
  /** Organization code dinamis, contoh: JAT */
  organization_code?: string;
  /** Backward compatibility: beberapa caller masih kirim organization_name berisi code (contoh: JAT) */
  organization_name?: string;
};

export type RealTimeSOHItem = {
  id?: string;
  sku?: string;
  item_code?: string;
  item_number?: string;
  item_description?: string;
  inventory_item_id?: string | number | null;
  organization_code?: string;
  organization_id?: string;
  subinventory_code?: string;
  quantity: number;
  avail_to_reserve?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  raw?: unknown;
};

export type RealTimeSOHMeta = {
  fetchedAt?: string;
  source?: string;
  date?: string;
  subinventory_code?: string;
  [key: string]: unknown;
};

export type RealTimeSOHResult = {
  data: RealTimeSOHItem[];
  meta: RealTimeSOHMeta | null;
};
