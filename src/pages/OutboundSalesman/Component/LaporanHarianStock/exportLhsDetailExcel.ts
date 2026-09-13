import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { showErrorToast } from "../../../../components/toast";
import { Callplan } from "../../types/CallplanTypes";
import { BTB } from "../../types/BTBtypes";
import { isFpprTambahanMoType } from "../Calculation/calculationMoType";
import { LhsStockComputed } from "./types";

type ExportLhsDetailParams = {
  rows: LhsStockComputed[];
  finalCallplans: Callplan[];
  btbList: BTB[];
  amoName: string;
  reportDateLabel: string;
  fileSlug?: string;
};

type SalesBucket = {
  salesNik: string;
  salesName: string;
  channel: string;
  /** index SKU → qty */
  qtys: number[];
};

const META_COLS = 5; // KET1 | KET2 | ID Sales | Nama Sales | Channel

const borderThin = {
  top: { style: "thin", color: { rgb: "000000" } },
  bottom: { style: "thin", color: { rgb: "000000" } },
  left: { style: "thin", color: { rgb: "000000" } },
  right: { style: "thin", color: { rgb: "000000" } },
} as const;

const baseFont = { name: "Calibri", sz: 10, color: { rgb: "000000" } };

const COLORS = {
  grey: "D9D9D9",
  red: "FF6B6B",
  redDark: "C00000",
  blue: "5B9BD5",
  blueDark: "2F5496",
  yellow: "FFE699",
  cyan: "9DC3E6",
  section: "1F1F1F",
  white: "FFFFFF",
};

const colLetter = (index0: number) => XLSX.utils.encode_col(index0);

const setCell = (
  ws: XLSX.WorkSheet,
  r: number,
  c: number,
  value: string | number | null,
  style: Record<string, unknown>,
  formula?: string,
) => {
  const addr = XLSX.utils.encode_cell({ r, c });
  if (formula) {
    ws[addr] = { t: "n", f: formula, s: style };
    return;
  }
  if (value === null || value === undefined || value === "") {
    ws[addr] = { t: "s", v: "", s: style };
    return;
  }
  if (typeof value === "number") {
    ws[addr] = { t: "n", v: value, s: style };
    return;
  }
  ws[addr] = { t: "s", v: value, s: style };
};

const styleMeta = (opts?: {
  bg?: string;
  bold?: boolean;
  color?: string;
  align?: "left" | "center";
}) => ({
  fill: opts?.bg
    ? { patternType: "solid", fgColor: { rgb: opts.bg } }
    : undefined,
  font: {
    ...baseFont,
    bold: Boolean(opts?.bold),
    color: { rgb: opts?.color || "000000" },
  },
  alignment: {
    horizontal: opts?.align || "left",
    vertical: "center",
    wrapText: true,
  },
  border: borderThin,
});

const styleQty = (opts?: { bg?: string; bold?: boolean }) => ({
  fill: opts?.bg
    ? { patternType: "solid", fgColor: { rgb: opts.bg } }
    : undefined,
  font: { ...baseFont, bold: Boolean(opts?.bold) },
  alignment: { horizontal: "center", vertical: "center" },
  border: borderThin,
});

const skuIndexMap = (rows: LhsStockComputed[]) => {
  const map = new Map<string, number>();
  rows.forEach((row, idx) => {
    const kode = String(row.kode || "").trim().toUpperCase();
    const inv = String(row.inventoryItemId || "").trim();
    if (kode) map.set(kode, idx);
    if (inv) map.set(inv, idx);
    if (kode && inv) map.set(`${kode}__${inv}`, idx);
  });
  return map;
};

const resolveSkuIdx = (
  map: Map<string, number>,
  sku: string,
  inventoryItemId?: string,
) => {
  const kode = String(sku || "").trim().toUpperCase();
  const inv = String(inventoryItemId || "").trim();
  if (kode && inv && map.has(`${kode}__${inv}`)) {
    return map.get(`${kode}__${inv}`) as number;
  }
  if (inv && map.has(inv)) return map.get(inv) as number;
  if (kode && map.has(kode)) return map.get(kode) as number;
  return -1;
};

const emptyBucket = (
  n: number,
  salesNik = "",
  salesName = "",
  channel = "",
): SalesBucket => ({
  salesNik,
  salesName,
  channel,
  qtys: Array.from({ length: n }, () => 0),
});

const ensureBucket = (
  store: Map<string, SalesBucket>,
  salesNik: string,
  salesName: string,
  channel: string,
  n: number,
) => {
  const key = salesNik || salesName || "__blank__";
  const existing = store.get(key);
  if (existing) {
    if (!existing.salesName && salesName) existing.salesName = salesName;
    if (!existing.channel && channel) existing.channel = channel;
    return existing;
  }
  const created = emptyBucket(n, salesNik, salesName, channel);
  store.set(key, created);
  return created;
};

const calcSpbIncomingQty = (detail: Callplan["details"][number]): number => {
  const submitted = Number(detail.item_qty_submitted) || 0;
  const finalQty =
    Number(detail.item_qty_final ?? detail.item_qty_submitted) || 0;
  const delta = finalQty - submitted;
  return delta < 0 ? Math.abs(delta) : 0;
};

/**
 * Pecah Callplan/BTB → bucket per salesman untuk baris detail.
 */
const buildSalesBuckets = (
  rows: LhsStockComputed[],
  finalCallplans: Callplan[],
  btbList: BTB[],
) => {
  const n = rows.length;
  const idxMap = skuIndexMap(rows);

  const spbAdjMinus = new Map<string, SalesBucket>();
  const manualDo = new Map<string, SalesBucket>();
  const spbSubmitted = new Map<string, SalesBucket>();
  const spbAdjPlus = new Map<string, SalesBucket>();
  const btb = new Map<string, SalesBucket>();

  finalCallplans.forEach((doc) => {
    const nik = String(doc.sales_nik || "").trim();
    const name = String(doc.sales_name || "").trim();
    const channel = String(doc.trip_type || "").trim();
    const isFppr = isFpprTambahanMoType(doc.mo_type);

    (doc.details || []).forEach((d) => {
      const sku = String(d.item_code || "").trim();
      if (!sku) return;
      const invId = String(d.inventory_item_id || "").trim();
      const idx = resolveSkuIdx(idxMap, sku, invId);
      if (idx < 0) return;

      const submitted = Number(d.item_qty_submitted) || 0;
      if (isFppr) {
        if (submitted > 0) {
          ensureBucket(manualDo, nik, name, channel, n).qtys[idx] += submitted;
        }
      } else if (submitted > 0) {
        ensureBucket(spbSubmitted, nik, name, channel, n).qtys[idx] +=
          submitted;
      }

      const revisionRaw = String(d.item_qty_revision ?? "").trim();
      const revision = Number(revisionRaw);
      if (revisionRaw && !Number.isNaN(revision) && revision > 0) {
        ensureBucket(spbAdjPlus, nik, name, channel, n).qtys[idx] += revision;
      }

      const retur = calcSpbIncomingQty(d);
      if (retur > 0) {
        ensureBucket(spbAdjMinus, nik, name, channel, n).qtys[idx] += retur;
      }
    });
  });

  btbList.forEach((doc) => {
    const nik = String(doc.sales_nik || "").trim();
    const name = String(doc.sales_name || "").trim();
    (doc.details || []).forEach((d) => {
      const sku = String(d.item_code || "").trim();
      if (!sku) return;
      const invId = String(d.inventory_item_id || "").trim();
      const idx = resolveSkuIdx(idxMap, sku, invId);
      if (idx < 0) return;
      const qty = Number(d.btb_qty) || 0;
      if (qty > 0) {
        ensureBucket(btb, nik, name, "", n).qtys[idx] += qty;
      }
    });
  });

  const toList = (store: Map<string, SalesBucket>) => {
    const list = Array.from(store.values()).filter((b) =>
      b.qtys.some((q) => q > 0),
    );
    list.sort((a, b) =>
      (a.salesName || a.salesNik).localeCompare(
        b.salesName || b.salesNik,
        "id",
        { sensitivity: "base" },
      ),
    );
    return list.length ? list : [emptyBucket(n)];
  };

  return {
    spbAdjMinus: toList(spbAdjMinus),
    btb: toList(btb),
    manualDo: toList(manualDo),
    spbSubmitted: toList(spbSubmitted),
    spbAdjPlus: toList(spbAdjPlus),
  };
};

/**
 * Export LHS Detail — layout transposed (SKU sebagai kolom),
 * bahasa & formula selaras dengan export summary.
 */
export const exportLhsDetailExcel = ({
  rows,
  finalCallplans,
  btbList,
  amoName,
  reportDateLabel,
  fileSlug,
}: ExportLhsDetailParams) => {
  if (!rows.length) {
    showErrorToast("Tidak ada data untuk diexport!");
    return;
  }

  const skus = rows;
  const skuCount = skus.length;
  const lastCol = META_COLS + skuCount - 1;
  const buckets = buildSalesBuckets(skus, finalCallplans, btbList);

  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];

  // ── Title / meta ──────────────────────────────────────────
  setCell(ws, 0, 0, "Laporan Harian Stock Detail (Bungkus / Bks)", {
    font: { ...baseFont, bold: true, sz: 14 },
    alignment: { horizontal: "left", vertical: "center" },
  });
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.min(lastCol, 8) } });

  setCell(ws, 1, 0, amoName || "—", {
    font: { ...baseFont, bold: true, sz: 11 },
  });
  setCell(ws, 1, 2, reportDateLabel || "", {
    font: { ...baseFont, sz: 11 },
  });

  // ── Header rows (2): nomor + kode SKU ─────────────────────
  const h1 = 2;
  const h2 = 3;

  const metaHeaders = [
    { c: 0, label: "KET1" },
    { c: 1, label: "KET2" },
    { c: 2, label: "ID Sales" },
    { c: 3, label: "Nama Sales" },
    { c: 4, label: "Channel" },
  ];

  metaHeaders.forEach(({ c, label }) => {
    setCell(ws, h1, c, label, styleMeta({ bg: COLORS.grey, bold: true, align: "center" }));
    setCell(ws, h2, c, "", styleMeta({ bg: COLORS.grey }));
    merges.push({ s: { r: h1, c }, e: { r: h2, c } });
  });

  skus.forEach((sku, i) => {
    const c = META_COLS + i;
    setCell(
      ws,
      h1,
      c,
      i + 1,
      styleMeta({ bg: COLORS.grey, bold: true, align: "center" }),
    );
    setCell(
      ws,
      h2,
      c,
      sku.kode,
      styleMeta({ bg: COLORS.grey, bold: true, align: "center" }),
    );
  });

  // Track logical rows for formulas
  type RowRef = { r: number; excel: number };
  const rowRefs: {
    stockAwal?: RowRef;
    centralAsmo?: RowRef;
    spbAdjMinus: RowRef[];
    btb: RowRef[];
    totalTerima?: RowRef;
    manualDo: RowRef[];
    relokasi?: RowRef;
    spbSubmitted: RowRef[];
    spbAdjPlus: RowRef[];
    totalKeluar?: RowRef;
    stockAkhir?: RowRef;
    fisik?: RowRef;
    varFisik?: RowRef;
    meta?: RowRef;
    varMeta?: RowRef;
  } = {
    spbAdjMinus: [],
    btb: [],
    manualDo: [],
    spbSubmitted: [],
    spbAdjPlus: [],
  };

  let r = 4;

  const paintMetaRow = (
    row: number,
    ket1: string,
    ket2: string,
    bg: string,
    sales?: { nik?: string; name?: string; channel?: string },
    opts?: { bold?: boolean; color?: string },
  ) => {
    setCell(
      ws,
      row,
      0,
      ket1,
      styleMeta({
        bg,
        bold: true,
        color: opts?.color,
        align: "center",
      }),
    );
    setCell(
      ws,
      row,
      1,
      ket2,
      styleMeta({ bg, bold: opts?.bold, color: opts?.color }),
    );
    setCell(
      ws,
      row,
      2,
      sales?.nik || "",
      styleMeta({ bg, color: opts?.color, align: "center" }),
    );
    setCell(
      ws,
      row,
      3,
      sales?.name || "",
      styleMeta({ bg, color: opts?.color }),
    );
    setCell(
      ws,
      row,
      4,
      sales?.channel || "",
      styleMeta({ bg, color: opts?.color, align: "center" }),
    );
  };

  const writeQtyRow = (
    row: number,
    values: number[],
    bg: string,
    opts?: { bold?: boolean; asBlankZero?: boolean },
  ) => {
    values.forEach((qty, i) => {
      const v =
        opts?.asBlankZero && (!qty || qty === 0) ? "" : qty || (opts?.asBlankZero ? "" : 0);
      setCell(ws, row, META_COLS + i, v === "" ? "" : Number(v), styleQty({ bg, bold: opts?.bold }));
    });
  };

  const writeFormulaRow = (
    row: number,
    formulaForCol: (skuCol: number) => string,
    bg: string,
    bold = true,
  ) => {
    for (let i = 0; i < skuCount; i += 1) {
      setCell(
        ws,
        row,
        META_COLS + i,
        null,
        styleQty({ bg, bold }),
        formulaForCol(META_COLS + i),
      );
    }
  };

  const pushRef = (row: number): RowRef => ({ r: row, excel: row + 1 });

  // ── Stock Awal ────────────────────────────────────────────
  paintMetaRow(r, "", "Stock Awal", COLORS.yellow, undefined, { bold: true });
  writeQtyRow(
    r,
    skus.map((s) => s.stockAwal),
    COLORS.yellow,
    { bold: true, asBlankZero: true },
  );
  rowRefs.stockAwal = pushRef(r);
  r += 1;

  // ── Incoming section banner ───────────────────────────────
  paintMetaRow(r, "", "Incoming", COLORS.section, undefined, {
    bold: true,
    color: COLORS.white,
  });
  for (let c = 2; c <= lastCol; c += 1) {
    setCell(
      ws,
      r,
      c,
      "",
      styleMeta({ bg: COLORS.section, color: COLORS.white }),
    );
  }
  merges.push({ s: { r, c: 1 }, e: { r, c: 4 } });
  r += 1;

  const incomingStart = r;

  // Central / ASMO (masih kosong — input manual)
  paintMetaRow(r, "", "Central / ASMO", COLORS.red);
  writeQtyRow(r, Array(skuCount).fill(0), COLORS.red, { asBlankZero: true });
  rowRefs.centralAsmo = pushRef(r);
  r += 1;

  // SPB Adjustment (−) per sales
  buckets.spbAdjMinus.forEach((b, i) => {
    paintMetaRow(
      r,
      "",
      i === 0 ? "SPB Adjustment (−)" : "",
      COLORS.red,
      { nik: b.salesNik, name: b.salesName, channel: b.channel },
    );
    writeQtyRow(r, b.qtys, COLORS.red, { asBlankZero: true });
    rowRefs.spbAdjMinus.push(pushRef(r));
    r += 1;
  });

  // BTB per sales
  buckets.btb.forEach((b, i) => {
    paintMetaRow(
      r,
      "",
      i === 0 ? "BTB" : "",
      COLORS.red,
      { nik: b.salesNik, name: b.salesName, channel: b.channel },
    );
    writeQtyRow(r, b.qtys, COLORS.red, { asBlankZero: true });
    rowRefs.btb.push(pushRef(r));
    r += 1;
  });

  const incomingEnd = r - 1;

  // Merge KET1 Incoming over detail rows
  if (incomingEnd >= incomingStart) {
    setCell(
      ws,
      incomingStart,
      0,
      "Incoming",
      styleMeta({ bg: COLORS.red, bold: true, align: "center" }),
    );
    merges.push({
      s: { r: incomingStart, c: 0 },
      e: { r: incomingEnd, c: 0 },
    });
  }

  // TOTAL Terima
  paintMetaRow(r, "", "TOTAL Terima", COLORS.redDark, undefined, {
    bold: true,
    color: COLORS.white,
  });
  writeFormulaRow(
    r,
    (skuCol) => {
      const parts = [
        rowRefs.centralAsmo!.excel,
        ...rowRefs.spbAdjMinus.map((x) => x.excel),
        ...rowRefs.btb.map((x) => x.excel),
      ];
      return parts.map((er) => `${colLetter(skuCol)}${er}`).join("+");
    },
    COLORS.redDark,
  );
  // white bold font on qty cells
  for (let i = 0; i < skuCount; i += 1) {
    const addr = XLSX.utils.encode_cell({ r, c: META_COLS + i });
    if (ws[addr]?.s) {
      (ws[addr].s as { font: Record<string, unknown> }).font = {
        ...baseFont,
        bold: true,
        color: { rgb: COLORS.white },
      };
    }
  }
  rowRefs.totalTerima = pushRef(r);
  r += 1;

  // ── Outgoing section banner ───────────────────────────────
  paintMetaRow(r, "Outgoing", "Outgoing", COLORS.section, undefined, {
    bold: true,
    color: COLORS.white,
  });
  for (let c = 2; c <= lastCol; c += 1) {
    setCell(ws, r, c, "", styleMeta({ bg: COLORS.section, color: COLORS.white }));
  }
  merges.push({ s: { r, c: 1 }, e: { r, c: 4 } });
  r += 1;

  const outgoingStart = r;

  buckets.manualDo.forEach((b, i) => {
    paintMetaRow(
      r,
      "",
      i === 0 ? "Manual DO (FPPR)" : "",
      COLORS.blue,
      { nik: b.salesNik, name: b.salesName, channel: b.channel },
    );
    writeQtyRow(r, b.qtys, COLORS.blue, { asBlankZero: true });
    rowRefs.manualDo.push(pushRef(r));
    r += 1;
  });

  paintMetaRow(r, "", "Relokasi (GI)", COLORS.blue);
  writeQtyRow(r, Array(skuCount).fill(0), COLORS.blue, { asBlankZero: true });
  rowRefs.relokasi = pushRef(r);
  r += 1;

  buckets.spbSubmitted.forEach((b, i) => {
    paintMetaRow(
      r,
      "",
      i === 0 ? "SPB Submitted" : "",
      COLORS.blue,
      { nik: b.salesNik, name: b.salesName, channel: b.channel },
    );
    writeQtyRow(r, b.qtys, COLORS.blue, { asBlankZero: true });
    rowRefs.spbSubmitted.push(pushRef(r));
    r += 1;
  });

  buckets.spbAdjPlus.forEach((b, i) => {
    paintMetaRow(
      r,
      "",
      i === 0 ? "SPB Adjustment (+)" : "",
      COLORS.blue,
      { nik: b.salesNik, name: b.salesName, channel: b.channel },
    );
    writeQtyRow(r, b.qtys, COLORS.blue, { asBlankZero: true });
    rowRefs.spbAdjPlus.push(pushRef(r));
    r += 1;
  });

  const outgoingEnd = r - 1;
  if (outgoingEnd >= outgoingStart) {
    setCell(
      ws,
      outgoingStart,
      0,
      "Outgoing",
      styleMeta({ bg: COLORS.blue, bold: true, align: "center" }),
    );
    merges.push({
      s: { r: outgoingStart, c: 0 },
      e: { r: outgoingEnd, c: 0 },
    });
  }

  // TOTAL Keluar
  paintMetaRow(r, "", "TOTAL Keluar", COLORS.blueDark, undefined, {
    bold: true,
    color: COLORS.white,
  });
  writeFormulaRow(
    r,
    (skuCol) => {
      const parts = [
        ...rowRefs.manualDo.map((x) => x.excel),
        rowRefs.relokasi!.excel,
        ...rowRefs.spbSubmitted.map((x) => x.excel),
        ...rowRefs.spbAdjPlus.map((x) => x.excel),
      ];
      return parts.map((er) => `${colLetter(skuCol)}${er}`).join("+");
    },
    COLORS.blueDark,
  );
  for (let i = 0; i < skuCount; i += 1) {
    const addr = XLSX.utils.encode_cell({ r, c: META_COLS + i });
    if (ws[addr]?.s) {
      (ws[addr].s as { font: Record<string, unknown> }).font = {
        ...baseFont,
        bold: true,
        color: { rgb: COLORS.white },
      };
    }
  }
  rowRefs.totalKeluar = pushRef(r);
  r += 1;

  // ── Stock Akhir / Fisik / META / VAR ──────────────────────
  paintMetaRow(r, "", "Stock Akhir", COLORS.yellow, undefined, { bold: true });
  writeFormulaRow(
    r,
    (skuCol) =>
      `${colLetter(skuCol)}${rowRefs.stockAwal!.excel}+${colLetter(skuCol)}${rowRefs.totalTerima!.excel}-${colLetter(skuCol)}${rowRefs.totalKeluar!.excel}`,
    COLORS.yellow,
  );
  rowRefs.stockAkhir = pushRef(r);
  r += 1;

  paintMetaRow(r, "", "FISIK Akhir hari", COLORS.yellow);
  writeQtyRow(r, Array(skuCount).fill(0), COLORS.yellow, { asBlankZero: true });
  rowRefs.fisik = pushRef(r);
  r += 1;

  paintMetaRow(r, "", "VAR (Fisik − Stock Akhir)", COLORS.cyan, undefined, {
    bold: true,
  });
  writeFormulaRow(
    r,
    (skuCol) =>
      `${colLetter(skuCol)}${rowRefs.fisik!.excel}-${colLetter(skuCol)}${rowRefs.stockAkhir!.excel}`,
    COLORS.cyan,
  );
  rowRefs.varFisik = pushRef(r);
  r += 1;

  paintMetaRow(r, "", "META", COLORS.yellow, undefined, { bold: true });
  writeQtyRow(
    r,
    skus.map((s) =>
      typeof s.meta === "number" && !Number.isNaN(s.meta) ? s.meta : 0,
    ),
    COLORS.yellow,
    { bold: true },
  );
  rowRefs.meta = pushRef(r);
  r += 1;

  paintMetaRow(r, "", "VAR (META − Stock Akhir)", COLORS.cyan, undefined, {
    bold: true,
  });
  writeFormulaRow(
    r,
    (skuCol) =>
      `${colLetter(skuCol)}${rowRefs.meta!.excel}-${colLetter(skuCol)}${rowRefs.stockAkhir!.excel}`,
    COLORS.cyan,
  );
  rowRefs.varMeta = pushRef(r);
  r += 1;

  // ── Signature ─────────────────────────────────────────────
  const sigRow = r + 2;
  setCell(ws, sigRow, 0, "Dibuat Oleh,", {
    font: { ...baseFont, bold: true },
  });
  setCell(ws, sigRow, 3, "Warehouse", {
    font: { ...baseFont, bold: true },
  });

  const lastRow = sigRow + 4;
  ws["!merges"] = merges;
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: lastRow, c: lastCol },
  });

  ws["!cols"] = [
    { wch: 11 },
    { wch: 22 },
    { wch: 12 },
    { wch: 18 },
    { wch: 10 },
    ...skus.map(() => ({ wch: 8 })),
  ];

  ws["!rows"] = [
    { hpt: 22 },
    { hpt: 18 },
    { hpt: 18 },
    { hpt: 28 },
  ];

  // Freeze meta cols + header
  ws["!freeze"] = {
    xSplit: META_COLS,
    ySplit: h2 + 1,
    topLeftCell: XLSX.utils.encode_cell({ r: h2 + 1, c: META_COLS }),
    activePane: "bottomRight",
    state: "frozen",
  };

  XLSX.utils.book_append_sheet(wb, ws, "LHS Detail");

  const safeSlug =
    fileSlug ||
    `${(amoName || "LHS").replace(/[^\w\-]+/g, "_")}_${reportDateLabel.replace(/[^\w\-]+/g, "_")}`;
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `Laporan_Harian_Stock_Detail_${safeSlug}.xlsx`,
  );
};
