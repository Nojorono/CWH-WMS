import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { showErrorToast } from "../../../../components/toast";
import { LhsStockComputed } from "./types";

type ExportLhsExcelParams = {
  rows: LhsStockComputed[];
  amoName: string;
  reportDateLabel: string;
  /** Nama file aman (tanpa ekstensi) */
  fileSlug?: string;
};

const COLS = 18; // A..R

const borderThin = {
  top: { style: "thin", color: { rgb: "000000" } },
  bottom: { style: "thin", color: { rgb: "000000" } },
  left: { style: "thin", color: { rgb: "000000" } },
  right: { style: "thin", color: { rgb: "000000" } },
} as const;

const baseFont = { name: "Calibri", sz: 10, color: { rgb: "000000" } };

const headerStyle = (bg: string, opts?: { bold?: boolean; wrap?: boolean }) => ({
  fill: { patternType: "solid", fgColor: { rgb: bg } },
  font: { ...baseFont, bold: opts?.bold !== false, sz: 9 },
  alignment: {
    horizontal: "center",
    vertical: "center",
    wrapText: opts?.wrap !== false,
  },
  border: borderThin,
});

const cellStyle = (opts?: {
  bg?: string;
  bold?: boolean;
  align?: "left" | "right" | "center";
}) => ({
  fill: opts?.bg
    ? { patternType: "solid", fgColor: { rgb: opts.bg } }
    : undefined,
  font: { ...baseFont, bold: Boolean(opts?.bold) },
  alignment: {
    horizontal: opts?.align || "right",
    vertical: "center",
  },
  border: borderThin,
});

const COLORS = {
  grey: "D9D9D9",
  red: "FF6B6B",
  blue: "5B9BD5",
  yellow: "FFE699",
  cyan: "9DC3E6",
  total: "F4B183",
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

/**
 * Export Laporan Harian Stock ke Excel (layout template, tanpa SR/NR).
 * Formula: Total Terima, Total Keluar, Stock Akhir, VAR (Fisik−Akhir), VAR (Fisik−META).
 */
export const exportLhsExcel = ({
  rows,
  amoName,
  reportDateLabel,
  fileSlug,
}: ExportLhsExcelParams) => {
  if (!rows.length) {
    showErrorToast("Tidak ada data untuk diexport!");
    return;
  }

  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  // Row 0: title
  setCell(
    ws,
    0,
    0,
    "Laporan Harian Stock Gudang (Bungkus / Bks)",
    {
      font: { ...baseFont, bold: true, sz: 14 },
      alignment: { horizontal: "left", vertical: "center" },
    },
  );

  // Row 1: meta
  setCell(ws, 1, 0, amoName || "—", {
    font: { ...baseFont, bold: true, sz: 11 },
  });
  setCell(ws, 1, 2, reportDateLabel || "", {
    font: { ...baseFont, sz: 11 },
  });

  // Row 2–3: headers
  const h1 = 2;
  const h2 = 3;

  // Group / single headers row 2
  const groupDefs: {
    c: number;
    label: string;
    span?: number;
    bg: string;
  }[] = [
    { c: 0, label: "KODE", bg: COLORS.grey },
    { c: 1, label: "MATERIAL", bg: COLORS.grey },
    { c: 2, label: "STOCK AWAL", bg: COLORS.grey },
    { c: 3, label: "Incoming", span: 4, bg: COLORS.red },
    { c: 7, label: "TOTAL Terima", bg: COLORS.red },
    { c: 8, label: "Outgoing", span: 4, bg: COLORS.blue },
    { c: 12, label: "TOTAL Keluar", bg: COLORS.blue },
    { c: 13, label: "STOCK AKHIR", bg: COLORS.grey },
    { c: 14, label: "FISIK Akhir hari", bg: COLORS.yellow },
    { c: 15, label: "VAR", bg: COLORS.cyan },
    { c: 16, label: "META", bg: COLORS.yellow },
    { c: 17, label: "VAR", bg: COLORS.cyan },
  ];

  groupDefs.forEach(({ c, label, span = 1, bg }) => {
    setCell(ws, h1, c, label, headerStyle(bg));
    if (span === 1) {
      // merge vertically with sub-header row
      // filled below
    } else {
      for (let i = 1; i < span; i += 1) {
        setCell(ws, h1, c + i, "", headerStyle(bg));
      }
    }
  });

  const subHeaders: { c: number; label: string; bg: string }[] = [
    { c: 3, label: "Central\n(from CWH)", bg: COLORS.red },
    { c: 4, label: "ASMO\n(Stock Cabang)", bg: COLORS.red },
    { c: 5, label: "Retur", bg: COLORS.red },
    { c: 6, label: "BTB", bg: COLORS.red },
    { c: 8, label: "Manual DO\n(FPPR)", bg: COLORS.blue },
    { c: 9, label: "Relokasi\n(GI)", bg: COLORS.blue },
    { c: 10, label: "DO MATIC", bg: COLORS.blue },
    { c: 11, label: "Add DO MATIC", bg: COLORS.blue },
  ];

  // Empty sub cells for vertically-merged singles (will merge)
  [0, 1, 2, 7, 12, 13, 14, 15, 16, 17].forEach((c) => {
    const bg =
      c === 7 || c === 3
        ? COLORS.red
        : c === 12 || c === 8
          ? COLORS.blue
          : c === 14 || c === 16
            ? COLORS.yellow
            : c === 15 || c === 17
              ? COLORS.cyan
              : COLORS.grey;
    setCell(ws, h2, c, "", headerStyle(bg));
  });

  subHeaders.forEach(({ c, label, bg }) => {
    setCell(ws, h2, c, label, headerStyle(bg));
  });

  const merges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COLS - 1 } },
    // vertical merges for single columns
    { s: { r: h1, c: 0 }, e: { r: h2, c: 0 } },
    { s: { r: h1, c: 1 }, e: { r: h2, c: 1 } },
    { s: { r: h1, c: 2 }, e: { r: h2, c: 2 } },
    { s: { r: h1, c: 7 }, e: { r: h2, c: 7 } },
    { s: { r: h1, c: 12 }, e: { r: h2, c: 12 } },
    { s: { r: h1, c: 13 }, e: { r: h2, c: 13 } },
    { s: { r: h1, c: 14 }, e: { r: h2, c: 14 } },
    { s: { r: h1, c: 15 }, e: { r: h2, c: 15 } },
    { s: { r: h1, c: 16 }, e: { r: h2, c: 16 } },
    { s: { r: h1, c: 17 }, e: { r: h2, c: 17 } },
    // Incoming / Outgoing groups
    { s: { r: h1, c: 3 }, e: { r: h1, c: 6 } },
    { s: { r: h1, c: 8 }, e: { r: h1, c: 11 } },
  ];
  ws["!merges"] = merges;

  const dataStart = 4; // Excel row 5
  rows.forEach((row, idx) => {
    const r = dataStart + idx;
    const excelRow = r + 1; // 1-based for formulas

    setCell(ws, r, 0, row.kode, cellStyle({ align: "left", bold: true }));
    setCell(ws, r, 1, row.skuName, cellStyle({ align: "left" }));
    setCell(ws, r, 2, row.stockAwal, cellStyle());

    // Central / ASMO kosong
    setCell(ws, r, 3, "", cellStyle());
    setCell(ws, r, 4, "", cellStyle());
    setCell(ws, r, 5, row.spb || "", cellStyle());
    setCell(ws, r, 6, row.btb || "", cellStyle());

    // TOTAL Terima = Central + ASMO + Retur + BTB
    setCell(
      ws,
      r,
      7,
      null,
      cellStyle({ bold: true }),
      `SUM(${colLetter(3)}${excelRow}:${colLetter(6)}${excelRow})`,
    );

    setCell(ws, r, 8, row.manualDo || "", cellStyle());
    setCell(ws, r, 9, "", cellStyle()); // Relokasi kosong
    setCell(ws, r, 10, row.doMatic || "", cellStyle());
    setCell(ws, r, 11, row.addDoMatic || "", cellStyle());

    // TOTAL Keluar
    setCell(
      ws,
      r,
      12,
      null,
      cellStyle({ bold: true }),
      `SUM(${colLetter(8)}${excelRow}:${colLetter(11)}${excelRow})`,
    );

    // STOCK AKHIR = Stock Awal + Total Terima − Total Keluar
    setCell(
      ws,
      r,
      13,
      null,
      cellStyle({ bold: true }),
      `${colLetter(2)}${excelRow}+${colLetter(7)}${excelRow}-${colLetter(12)}${excelRow}`,
    );

    // FISIK kosong
    setCell(ws, r, 14, "", cellStyle({ bg: COLORS.yellow }));

    // VAR = Fisik − Stock Akhir
    setCell(
      ws,
      r,
      15,
      null,
      cellStyle({ bg: COLORS.cyan, bold: true }),
      `${colLetter(14)}${excelRow}-${colLetter(13)}${excelRow}`,
    );

    // META = SOH realtime saat generate
    setCell(ws, r, 16, row.meta || "", cellStyle({ bg: COLORS.yellow }));

    // VAR = Fisik − META
    setCell(
      ws,
      r,
      17,
      null,
      cellStyle({ bg: COLORS.cyan, bold: true }),
      `${colLetter(14)}${excelRow}-${colLetter(16)}${excelRow}`,
    );
  });

  const dataEnd = dataStart + rows.length - 1;
  const totalRow = dataEnd + 1;
  const firstExcel = dataStart + 1;
  const lastExcel = dataEnd + 1;

  setCell(
    ws,
    totalRow,
    0,
    "TOTAL",
    cellStyle({ bg: COLORS.total, bold: true, align: "left" }),
  );
  setCell(ws, totalRow, 1, "", cellStyle({ bg: COLORS.total }));

  // Sum value columns; formula columns also SUM of formula results
  const sumCols = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  sumCols.forEach((c) => {
    setCell(
      ws,
      totalRow,
      c,
      null,
      cellStyle({ bg: COLORS.total, bold: true }),
      `SUM(${colLetter(c)}${firstExcel}:${colLetter(c)}${lastExcel})`,
    );
  });

  // Signature block
  const sigRow = totalRow + 3;
  setCell(ws, sigRow, 0, "Dibuat Oleh,", {
    font: { ...baseFont, bold: true },
  });
  setCell(ws, sigRow, 8, "Warehouse", {
    font: { ...baseFont, bold: true },
  });

  const lastRow = sigRow + 4;
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: lastRow, c: COLS - 1 },
  });

  ws["!cols"] = [
    { wch: 10 },
    { wch: 28 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 11 },
    { wch: 11 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];

  ws["!rows"] = [{ hpt: 22 }, { hpt: 18 }, { hpt: 22 }, { hpt: 32 }];

  XLSX.utils.book_append_sheet(wb, ws, "LHS");

  const safeSlug =
    fileSlug ||
    `${(amoName || "LHS").replace(/[^\w\-]+/g, "_")}_${reportDateLabel.replace(/[^\w\-]+/g, "_")}`;
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `Laporan_Harian_Stock_${safeSlug}.xlsx`,
  );
};
