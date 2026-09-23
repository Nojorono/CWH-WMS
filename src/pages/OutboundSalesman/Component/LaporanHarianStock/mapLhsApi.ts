import type {
  LhsApiDetailData,
  LhsApiDetailRow,
  LhsApiItem,
} from "../../../../API/services/outbound-salesman/LhsReportService";
import type { LhsMovementLine, LhsStockComputed, LhsStockRow } from "./types";
import { computeRow } from "./logic";

const n = (v: unknown) => {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
};

const hasNumber = (v: unknown): v is number =>
  v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));

/**
 * Map item summary API → baris Overview.
 * - stock_awal = SOH pada previous_date
 * - stock_meta = SOH pada date
 * Field yang sudah ada di API dipakai; yang kosong dihitung di FE.
 */
export const mapLhsApiItemToRow = (item: LhsApiItem): LhsStockComputed => {
  const kode = String(item.item_code || "").trim();
  const stockAwal = hasNumber(item.stock_awal) ? n(item.stock_awal) : 0;
  const btb = hasNumber(item.btb_qty) ? n(item.btb_qty) : 0;
  const submitted = hasNumber(item.qty_submitted) ? n(item.qty_submitted) : 0;
  const finalQty = hasNumber(item.qty_final)
    ? n(item.qty_final)
    : submitted;
  const meta = hasNumber(item.stock_meta) ? n(item.stock_meta) : 0;

  // Incoming adj (−): |final − submitted| jika final < submitted
  const spbAdjIn =
    finalQty - submitted < 0 ? Math.abs(finalQty - submitted) : 0;
  // Outgoing adj (+): final − submitted jika final > submitted
  const spbAdjOut =
    finalQty - submitted > 0 ? finalQty - submitted : 0;

  const incomingApi = hasNumber(item.incoming) ? n(item.incoming) : null;
  const outgoingApi = hasNumber(item.outgoing) ? n(item.outgoing) : null;

  const btbPart = btb;
  const spbPart = spbAdjIn;
  /** FPPR Awal (submitted); tanpa mo_type di summary — FPPR Tambahan = 0 */
  const fpprAwalPart =
    outgoingApi != null
      ? Math.max(0, outgoingApi - spbAdjOut)
      : submitted;
  const fpprTambahanPart = 0;
  const addDoMaticPart = spbAdjOut;

  const base: LhsStockRow = {
    id: kode || `sku-${Math.random().toString(36).slice(2)}`,
    kode,
    skuName: String(item.item_description || kode).trim() || kode,
    inventoryItemId: "",
    stockAwal,
    spb: spbPart,
    btb: btbPart,
    manualDo: fpprTambahanPart,
    relokasi: 0,
    doMatic: fpprAwalPart,
    addDoMatic: addDoMaticPart,
    fisikAkhir: null,
    meta,
  };

  const computed = computeRow(base);

  // Override totals dari API bila tersedia; Stock Akhir selalu dihitung FE
  if (incomingApi != null) computed.totalTerima = incomingApi;
  if (outgoingApi != null) computed.totalKeluar = outgoingApi;
  computed.stockAkhir =
    computed.stockAwal + computed.totalTerima - computed.totalKeluar;

  // Variance: Fisik − Akhir; jika Fisik kosong → META (SOH date) − Akhir
  computed.variance =
    computed.fisikAkhir != null
      ? computed.fisikAkhir - computed.stockAkhir
      : computed.meta - computed.stockAkhir;

  return computed;
};

export const mapLhsApiItemsToRows = (items: LhsApiItem[] | undefined) =>
  (items || [])
    .map(mapLhsApiItemToRow)
    .filter((r) => Boolean(r.kode))
    .sort((a, b) => a.kode.localeCompare(b.kode));

const resolveSkuName = (
  kode: string,
  nameBySku: Map<string, string>,
) => nameBySku.get(kode.toUpperCase()) || kode;

/**
 * Flatten baris detail API → Incoming / Outgoing movement lines (tab UI).
 */
export const buildMovementLinesFromDetail = (
  detail: LhsApiDetailData | null | undefined,
  nameBySku: Map<string, string>,
  reportDate: string,
): { incoming: LhsMovementLine[]; outgoing: LhsMovementLine[] } => {
  const incoming: LhsMovementLine[] = [];
  const outgoing: LhsMovementLine[] = [];
  const rows = detail?.rows || [];

  rows.forEach((row, rowIdx) => {
    const ket1 = String(row.ket1 || "").trim().toLowerCase();
    const isIn = ket1 === "incoming";
    const isOut = ket1 === "outgoing";
    if (!isIn && !isOut) return;

    const ket2Raw = String(row.ket2 || "").trim();
    const ket2 = isOut ? normalizeOutgoingKet2(ket2Raw) : ket2Raw;
    const sales = String(row.sales_name || "").trim();
    const sourceParts = [
      ket2 || (isIn ? "Incoming" : "FPPR Awal"),
      sales,
    ].filter(Boolean);
    const source = sourceParts.join(" · ");

    Object.entries(row.quantities || {}).forEach(([sku, qtyRaw], qIdx) => {
      const qty = n(qtyRaw);
      if (qty <= 0) return;
      const kode = String(sku || "").trim();
      if (!kode) return;

      const line: LhsMovementLine = {
        id: `${ket1}-${rowIdx}-${kode}-${qIdx}`,
        kode,
        skuName: resolveSkuName(kode, nameBySku),
        qty,
        source,
        date: reportDate,
        group: isIn ? "incoming" : "outgoing",
      };
      if (isIn) incoming.push(line);
      else outgoing.push(line);
    });
  });

  const bySku = (a: LhsMovementLine, b: LhsMovementLine) =>
    a.kode.localeCompare(b.kode) || a.source.localeCompare(b.source);
  incoming.sort(bySku);
  outgoing.sort(bySku);

  return { incoming, outgoing };
};

const normalizeOutgoingKet2 = (ket2: string) => {
  const raw = String(ket2 || "").trim();
  const k = raw.toLowerCase();
  if (!raw) return "FPPR Awal";
  if (
    k.includes("spb submitted") ||
    k === "submitted" ||
    k.includes("do matic") ||
    k.includes("fppr awal")
  ) {
    return "FPPR Awal";
  }
  if (
    k.includes("fppr tambahan") ||
    k.includes("manual do") ||
    k.includes("manual")
  ) {
    return "FPPR Tambahan";
  }
  if (
    (k.includes("spb adjustment") || k.includes("spb adj") || k.includes("adjustment")) &&
    (k.includes("+") || k.includes("plus") || k.includes("tambah"))
  ) {
    return "SPB Adjustment (+)";
  }
  return raw;
};

const isSpbAdjOutgoingSource = (source: string) => {
  const s = source.toLowerCase();
  return (
    s.includes("spb adjustment (+)") ||
    s.includes("spb adj (+)") ||
    (s.includes("adjustment") && s.includes("+"))
  );
};

const isSpbAdjIncomingSource = (source: string) => {
  const s = source.toLowerCase();
  return (
    s.includes("spb adjustment (−)") ||
    s.includes("spb adj (−)") ||
    s.includes("spb adjustment (-)") ||
    (s.includes("adjustment") &&
      (s.includes("−") || s.includes("minus") || /\(\s*-\s*\)/.test(s)) &&
      !s.includes("+"))
  );
};

/**
 * Incoming tab = BTB (detail API) + SPB Adjustment (−) dari summary
 * (qty_final − qty_submitted < 0 → |delta|).
 * Jika detail sudah punya baris Adj (−), tidak diduplikasi dari summary.
 */
export const buildIncomingOutgoingLines = (
  detail: LhsApiDetailData | null | undefined,
  summaryRows: LhsStockComputed[],
  reportDate: string,
): { incoming: LhsMovementLine[]; outgoing: LhsMovementLine[] } => {
  const nameBySku = new Map(
    summaryRows.map((r) => [r.kode.toUpperCase(), r.skuName] as const),
  );

  const hasDetailMovement = (detail?.rows || []).some((r) => {
    const k = String(r.ket1 || "").toLowerCase();
    return k === "incoming" || k === "outgoing";
  });

  const fromDetail = hasDetailMovement
    ? buildMovementLinesFromDetail(detail, nameBySku, reportDate)
    : { incoming: [] as LhsMovementLine[], outgoing: [] as LhsMovementLine[] };

  const detailHasSpbAdj = fromDetail.incoming.some((l) =>
    isSpbAdjIncomingSource(l.source),
  );

  const incoming = [...fromDetail.incoming];

  // SPB Adjustment (−) dari summary bila belum ada di detail
  if (!detailHasSpbAdj) {
    summaryRows.forEach((r) => {
      const qty = Number(r.spb) || 0;
      if (qty <= 0 || !r.kode) return;
      incoming.push({
        id: `${r.kode}-in-spb-adj`,
        kode: r.kode,
        skuName: r.skuName,
        qty,
        source: "SPB Adjustment (−)",
        date: reportDate,
        group: "incoming",
      });
    });
  }

  // Fallback Incoming: jika detail kosong, pecah BTB + Adj (−) dari summary
  if (!hasDetailMovement) {
    summaryRows.forEach((r) => {
      const btbQty = Number(r.btb) || 0;
      if (btbQty > 0) {
        incoming.push({
          id: `${r.kode}-in-btb`,
          kode: r.kode,
          skuName: r.skuName,
          qty: btbQty,
          source: "BTB",
          date: reportDate,
          group: "incoming",
        });
      }
    });
  }

  const outgoing =
    fromDetail.outgoing.length > 0
      ? [...fromDetail.outgoing]
      : ([] as LhsMovementLine[]);

  const detailHasSpbAdjOut = outgoing.some((l) =>
    isSpbAdjOutgoingSource(l.source),
  );

  // SPB Adjustment (+) dari summary bila belum ada di detail
  if (!detailHasSpbAdjOut) {
    summaryRows.forEach((r) => {
      const qty = Number(r.addDoMatic) || 0;
      if (qty <= 0 || !r.kode) return;
      outgoing.push({
        id: `${r.kode}-out-spb-adj-plus`,
        kode: r.kode,
        skuName: r.skuName,
        qty,
        source: "SPB Adjustment (+)",
        date: reportDate,
        group: "outgoing",
      });
    });
  }

  // Fallback Outgoing: pecah FPPR Awal + FPPR Tambahan + Adj (+) dari summary
  if (!hasDetailMovement || fromDetail.outgoing.length === 0) {
    summaryRows.forEach((r) => {
      const fpprAwal = Number(r.doMatic) || 0;
      const fpprTambahan = Number(r.manualDo) || 0;
      if (fpprAwal > 0) {
        outgoing.push({
          id: `${r.kode}-out-fppr-awal`,
          kode: r.kode,
          skuName: r.skuName,
          qty: fpprAwal,
          source: "FPPR Awal",
          date: reportDate,
          group: "outgoing",
        });
      }
      if (fpprTambahan > 0) {
        outgoing.push({
          id: `${r.kode}-out-fppr-tambahan`,
          kode: r.kode,
          skuName: r.skuName,
          qty: fpprTambahan,
          source: "FPPR Tambahan",
          date: reportDate,
          group: "outgoing",
        });
      }
    });
  }

  // Dedup by id (fallback + detail adj bisa overlap)
  const uniqOut = new Map<string, LhsMovementLine>();
  outgoing.forEach((l) => {
    const prev = uniqOut.get(l.id);
    if (!prev) uniqOut.set(l.id, l);
  });
  const outgoingFinal = [...uniqOut.values()];

  const bySku = (a: LhsMovementLine, b: LhsMovementLine) =>
    a.kode.localeCompare(b.kode) || a.source.localeCompare(b.source);
  incoming.sort(bySku);
  outgoingFinal.sort(bySku);

  return { incoming, outgoing: outgoingFinal };
};

/** Fallback tab: 1 baris per SKU dari agregat summary */
export const buildMovementLinesFromSummary = (
  rows: LhsStockComputed[],
  reportDate: string,
): { incoming: LhsMovementLine[]; outgoing: LhsMovementLine[] } => {
  const incoming: LhsMovementLine[] = [];
  const outgoing: LhsMovementLine[] = [];

  rows.forEach((r) => {
    if (r.totalTerima > 0) {
      incoming.push({
        id: `${r.kode}-in-summary`,
        kode: r.kode,
        skuName: r.skuName,
        qty: r.totalTerima,
        source: "Incoming (summary)",
        date: reportDate,
        group: "incoming",
      });
    }
    if (r.totalKeluar > 0) {
      outgoing.push({
        id: `${r.kode}-out-summary`,
        kode: r.kode,
        skuName: r.skuName,
        qty: r.totalKeluar,
        source: "Outgoing (summary)",
        date: reportDate,
        group: "outgoing",
      });
    }
  });

  return { incoming, outgoing };
};

export type { LhsApiDetailData, LhsApiDetailRow, LhsApiItem };
