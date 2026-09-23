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
  /** FPPR Tambahan — submitted qty (mo_type FPPR Tambahan) */
  manualDo: number;
  /** Relokasi GI — dikosongkan */
  relokasi: number;
  /** FPPR Awal — submitted qty (mo_type FPPR Awal / SPB biasa) */
  doMatic: number;
  /** SPB Adjustment (+) = max(0, qty_final − qty_submitted) */
  addDoMatic: number;
  /** Input fisik — dikosongkan dulu */
  fisikAkhir: number | null;
  /** META = SOH pada `date` laporan */
  meta: number;
};

export type LhsStockComputed = LhsStockRow & {
  totalTerima: number;
  totalKeluar: number;
  stockAkhir: number;
  /**
   * Variance:
   * - ada Fisik → Fisik − Stock Akhir
   * - tanpa Fisik → META (SOH date) − Stock Akhir
   */
  variance: number;
};

export type LhsReportContext = {
  amoName: string;
  organizationId: string;
  organizationCode: string;
  /** Tanggal laporan (SOH Meta) */
  reportDate: string;
  /** Tanggal SOH untuk Stock Awal */
  previousDate?: string | null;
};

/** Baris detail Incoming/Outgoing untuk tab V1 */
export type LhsMovementLine = {
  id: string;
  kode: string;
  skuName: string;
  qty: number;
  source: string;
  /** Tanggal sumber: callplan_date_start (SPB) atau btb_date (BTB) */
  date?: string | null;
  group: "incoming" | "outgoing";
};
