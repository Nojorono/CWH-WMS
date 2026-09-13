/** Tab UI V1 (Excel layout menyusul) */
export type StockReportTab = "overview" | "incoming" | "outgoing";

/** Baris flat LHS — tanpa SR/NR (dipakai agregasi + nanti Excel) */
export type LhsStockRow = {
  id: string;
  kode: string;
  skuName: string;
  inventoryItemId: string;
  stockAwal: number;
  /**
   * Incoming SPB Adjustment (−):
   * |final − submitted| jika (final − submitted) < 0
   */
  spb: number;
  /** Incoming dari BTB (btb_qty) jika ada */
  btb: number;
  /** Manual DO = FPPR Tambahan (submitted qty) */
  manualDo: number;
  /** Relokasi GI — dikosongkan */
  relokasi: number;
  /** DO MATIC / SPB Submitted = submitted qty SPB FINAL (non-FPPR) */
  doMatic: number;
  /** Add DO MATIC / SPB Adjustment (+) = item_qty_revision > 0 */
  addDoMatic: number;
  /** Input fisik — dikosongkan dulu */
  fisikAkhir: number | null;
  /** META = SOH realtime; jika tidak ada → 0 */
  meta: number;
};

export type LhsStockComputed = LhsStockRow & {
  totalTerima: number;
  totalKeluar: number;
  stockAkhir: number;
  /** Fisik − Stock Akhir (fisik kosong = 0) */
  variance: number;
};

export type LhsReportContext = {
  amoName: string;
  organizationId: string;
  organizationCode: string;
  reportDate: string;
};

/** Baris detail Incoming/Outgoing untuk tab V1 */
export type LhsMovementLine = {
  id: string;
  kode: string;
  skuName: string;
  qty: number;
  source: string;
  group: "incoming" | "outgoing";
};
