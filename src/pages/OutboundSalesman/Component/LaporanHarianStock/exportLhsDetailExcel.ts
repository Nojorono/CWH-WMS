import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { showErrorToast } from "../../../../components/toast";
import type { LhsApiDetailData } from "../../../../API/services/outbound-salesman/LhsReportService";
import { LhsStockComputed } from "./types";

type ExportLhsDetailParams = {
  detail: LhsApiDetailData | null;
  /** Fallback nama SKU + stock akhir / variance dari summary */
  rows: LhsStockComputed[];
  amoName: string;
  reportDateLabel: string;
  fileSlug?: string;
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
  indigo: "C5D0E6",
};

const n = (v: unknown) => {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
};

const setCell = (
  ws: XLSX.WorkSheet,
  r: number,
  c: number,
  value: string | number | null,
  style: Record<string, unknown>,
) => {
  const addr = XLSX.utils.encode_cell({ r, c });
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

const styleQty = (opts?: { bg?: string; bold?: boolean; color?: string }) => ({
  fill: opts?.bg
    ? { patternType: "solid", fgColor: { rgb: opts.bg } }
    : undefined,
  font: {
    ...baseFont,
    bold: Boolean(opts?.bold),
    color: { rgb: opts?.color || "000000" },
  },
  alignment: { horizontal: "center", vertical: "center" },
  border: borderThin,
  numFmt: "#,##0",
});

const rowBg = (ket1: string) => {
  const k = ket1.trim().toLowerCase();
  if (k === "stock awal") return COLORS.yellow;
  if (k === "incoming") return COLORS.red;
  if (k === "outgoing") return COLORS.blue;
  if (k === "stock meta") return COLORS.cyan;
  return COLORS.grey;
};

/**
 * Export LSH Detail dari API /lhs/detail (+ baris Stock Akhir / Variance dari summary FE).
 */
export const exportLhsDetailExcel = ({
  detail,
  rows,
  amoName,
  reportDateLabel,
  fileSlug,
}: ExportLhsDetailParams) => {
  try {
    const nameBySku = new Map(
      rows.map((r) => [r.kode.toUpperCase(), r.skuName] as const),
    );
    const summaryBySku = new Map(
      rows.map((r) => [r.kode.toUpperCase(), r] as const),
    );

    const itemCodes =
      (detail?.item_codes || []).filter(Boolean).length > 0
        ? (detail?.item_codes || []).map((c) => String(c).trim()).filter(Boolean)
        : rows.map((r) => r.kode);

    if (!itemCodes.length) {
      showErrorToast("Tidak ada data SKU untuk LSH Detail");
      return;
    }

    const apiRows = detail?.rows || [];
    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {};
    const merges: XLSX.Range[] = [];
    const lastCol = META_COLS + itemCodes.length - 1;
    let r = 0;

    // Title
    setCell(
      ws,
      r,
      0,
      `LSH Detail — ${amoName}`,
      styleMeta({ bold: true }),
    );
    merges.push({ s: { r, c: 0 }, e: { r, c: Math.min(4, lastCol) } });
    r += 1;
    setCell(ws, r, 0, `Tanggal: ${reportDateLabel}`, styleMeta());
    if (detail?.previous_date) {
      setCell(
        ws,
        r,
        2,
        `Previous: ${detail.previous_date}`,
        styleMeta(),
      );
    }
    r += 2;

    // Header row 1: meta + SKU codes
    ["KET1", "KET2", "ID Sales", "Nama Sales", "Channel"].forEach((h, c) => {
      setCell(ws, r, c, h, styleMeta({ bg: COLORS.grey, bold: true, align: "center" }));
    });
    itemCodes.forEach((code, i) => {
      setCell(
        ws,
        r,
        META_COLS + i,
        code,
        styleMeta({ bg: COLORS.grey, bold: true, align: "center" }),
      );
    });
    r += 1;

    // Header row 2: SKU names
    for (let c = 0; c < META_COLS; c += 1) {
      setCell(ws, r, c, "", styleMeta({ bg: COLORS.grey }));
    }
    itemCodes.forEach((code, i) => {
      setCell(
        ws,
        r,
        META_COLS + i,
        nameBySku.get(code.toUpperCase()) || code,
        styleMeta({ bg: COLORS.grey, align: "center" }),
      );
    });
    r += 1;

    // API detail rows
    apiRows.forEach((row) => {
      const ket1 = String(row.ket1 || "").trim();
      const bg = rowBg(ket1);
      const isSectionOnly =
        !row.ket2 && !row.sales_nik && ket1.toLowerCase() !== "stock awal" &&
        ket1.toLowerCase() !== "stock meta";

      setCell(
        ws,
        r,
        0,
        ket1,
        styleMeta({
          bg,
          bold: true,
          align: "center",
          color: bg === COLORS.section ? COLORS.white : undefined,
        }),
      );
      setCell(
        ws,
        r,
        1,
        String(row.ket2 || "").trim(),
        styleMeta({ bg, bold: Boolean(row.ket2) }),
      );
      setCell(
        ws,
        r,
        2,
        String(row.sales_nik || "").trim(),
        styleMeta({ bg, align: "center" }),
      );
      setCell(
        ws,
        r,
        3,
        String(row.sales_name || "").trim(),
        styleMeta({ bg }),
      );
      setCell(
        ws,
        r,
        4,
        String(row.channel || "").trim(),
        styleMeta({ bg, align: "center" }),
      );

      itemCodes.forEach((code, i) => {
        const qty = n(row.quantities?.[code]);
        setCell(
          ws,
          r,
          META_COLS + i,
          qty === 0 ? "" : qty,
          styleQty({ bg, bold: isSectionOnly || ket1.toLowerCase().includes("stock") }),
        );
      });
      r += 1;
    });

    // FE: Stock Akhir + Variance (jika belum ada di API)
    const hasStockAkhir = apiRows.some(
      (x) => String(x.ket1 || "").toLowerCase() === "stock akhir",
    );
    if (!hasStockAkhir) {
      setCell(
        ws,
        r,
        0,
        "Stock Akhir",
        styleMeta({ bg: COLORS.indigo, bold: true, align: "center" }),
      );
      for (let c = 1; c < META_COLS; c += 1) {
        setCell(ws, r, c, "", styleMeta({ bg: COLORS.indigo }));
      }
      itemCodes.forEach((code, i) => {
        const s = summaryBySku.get(code.toUpperCase());
        const qty = s?.stockAkhir ?? 0;
        setCell(
          ws,
          r,
          META_COLS + i,
          qty === 0 ? "" : qty,
          styleQty({ bg: COLORS.indigo, bold: true }),
        );
      });
      r += 1;

      setCell(
        ws,
        r,
        0,
        "Variance",
        styleMeta({ bg: COLORS.grey, bold: true, align: "center" }),
      );
      for (let c = 1; c < META_COLS; c += 1) {
        setCell(ws, r, c, "", styleMeta({ bg: COLORS.grey }));
      }
      itemCodes.forEach((code, i) => {
        const s = summaryBySku.get(code.toUpperCase());
        const qty = s?.variance ?? 0;
        setCell(
          ws,
          r,
          META_COLS + i,
          qty === 0 ? "" : qty,
          styleQty({ bg: COLORS.grey, bold: true }),
        );
      });
      r += 1;
    }

    ws["!merges"] = merges;
    ws["!cols"] = [
      { wch: 14 },
      { wch: 20 },
      { wch: 16 },
      { wch: 24 },
      { wch: 10 },
      ...itemCodes.map(() => ({ wch: 12 })),
    ];
    ws["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(r - 1, 0), c: lastCol },
    });

    XLSX.utils.book_append_sheet(wb, ws, "LSH Detail");
    const slug =
      fileSlug ||
      `LSH_Detail_${String(amoName).replace(/\s+/g, "_")}_${reportDateLabel.replace(/\s+/g, "_")}`;
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${slug}.xlsx`,
    );
  } catch (err) {
    console.error("exportLhsDetailExcel:", err);
    showErrorToast("Gagal mengekspor LSH Detail");
  }
};
