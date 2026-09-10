/** Tab UI V1 (Excel layout menyusul) */
export type StockReportTab =
  | "overview"
  | "incoming"
  | "outgoing"
  | "validation";

/** Baris flat LHS — tanpa SR/NR (dipakai agregasi + nanti Excel) */
export type LhsStockRow = {
  id: string;
  kode: string;
  skuName: string;
  inventoryItemId: string;
  stockAwal: number;
  /** Central = Inbound CWH (kosong jika API belum ada) */
  centralInbound: number;
  returDo: number;
  btb: number;
  /** Manual DO = FPPR Tambahan (submitted) */
  manualDo: number;
  /** Relokasi GI — dikosongkan */
  relokasi: number;
  /** DO MATIC = submitted qty SPB FINAL (non-FPPR) */
  doMatic: number;
  /** Add DO MATIC = revision (+) Form Tambahan */
  addDoMatic: number;
  /** Input fisik — dikosongkan dulu */
  fisikAkhir: number | null;
  /** META = SOH realtime (/on-hand-meta) — sama Good Prep (avail_to_reserve) */
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
