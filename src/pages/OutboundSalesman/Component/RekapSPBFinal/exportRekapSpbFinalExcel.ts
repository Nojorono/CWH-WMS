import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { showErrorToast } from "../../../../components/toast";
import { Callplan } from "../../types/CallplanTypes";

dayjs.locale("id");

type MasterItem = { sku?: string; description?: string };

type ExportParams = {
  callplans: Callplan[];
  amoName: string;
  reportDate: string;
  itemList?: MasterItem[];
};

type SkuColumn = {
  code: string;
  name: string;
};

const borderThin = {
  top: { style: "thin", color: { rgb: "000000" } },
  bottom: { style: "thin", color: { rgb: "000000" } },
  left: { style: "thin", color: { rgb: "000000" } },
  right: { style: "thin", color: { rgb: "000000" } },
} as const;

const baseFont = { name: "Calibri", sz: 10, color: { rgb: "000000" } };

const headerStyle = (bg: string) => ({
  fill: { patternType: "solid", fgColor: { rgb: bg } },
  font: { ...baseFont, bold: true, sz: 9 },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
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
  orange: "F4B183",
  white: "FFFFFF",
};

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

const resolveItemName = (
  sku: string,
  itemList: MasterItem[] | undefined,
) => {
  const master = itemList?.find(
    (m) => String(m.sku || "").trim().toUpperCase() === sku.toUpperCase(),
  );
  return master?.description || sku;
};

/**
 * Export Rekap SPB FINAL — matrix SPB × SKU (qty = item_qty_final).
 * Satuan: Bungkus / Bks.
 */
export const exportRekapSpbFinalExcel = ({
  callplans,
  amoName,
  reportDate,
  itemList,
}: ExportParams) => {
  if (!callplans.length) {
    showErrorToast("Tidak ada data untuk diexport!");
    return;
  }

  const skuMap = new Map<string, SkuColumn>();
  callplans.forEach((doc) => {
    (doc.details || []).forEach((d) => {
      const code = String(d.item_code || "").trim();
      if (!code) return;
      if (!skuMap.has(code)) {
        skuMap.set(code, {
          code,
          name: resolveItemName(code, itemList),
        });
      }
    });
  });

  const skuColumns = Array.from(skuMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code, "id", { numeric: true }),
  );

  if (!skuColumns.length) {
    showErrorToast("Tidak ada SKU pada data SPB FINAL!");
    return;
  }

  const fixedCols = 4; // SPB Number, Status, ID Sales, Nama Salesman
  const totalCols = fixedCols + skuColumns.length;

  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  const dateLabel = dayjs(reportDate).isValid()
    ? dayjs(reportDate).format("ddd, DD MMMM YYYY")
    : reportDate;

  // Row 0: title meta
  setCell(ws, 0, 0, "Rekap SPB MATIC Final (Bungkus / Bks)", {
    font: { ...baseFont, bold: true, sz: 13 },
    alignment: { horizontal: "left", vertical: "center" },
  });
  setCell(ws, 0, 2, `AMO : ${amoName || "—"}`, {
    font: { ...baseFont, bold: true, sz: 11 },
    alignment: { horizontal: "center", vertical: "center" },
  });
  setCell(ws, 0, Math.max(fixedCols, totalCols - 2), `Hari/tgl DO : ${dateLabel}`, {
    font: { ...baseFont, bold: true, sz: 11 },
    alignment: { horizontal: "right", vertical: "center" },
  });

  // Row 1–2: headers
  const hName = 1;
  const hCode = 2;

  const fixedHeaders = [
    { label: "SPB Number", c: 0 },
    { label: "Status", c: 1 },
    { label: "ID Sales", c: 2 },
    { label: "Nama Salesman", c: 3 },
  ];

  fixedHeaders.forEach(({ label, c }) => {
    setCell(ws, hName, c, label, headerStyle(COLORS.grey));
    setCell(ws, hCode, c, "", headerStyle(COLORS.grey));
  });

  skuColumns.forEach((sku, idx) => {
    const c = fixedCols + idx;
    setCell(ws, hName, c, sku.name, headerStyle(COLORS.grey));
    setCell(ws, hCode, c, sku.code, headerStyle(COLORS.grey));
  });

  const merges: XLSX.Range[] = [
    { s: { r: hName, c: 0 }, e: { r: hCode, c: 0 } },
    { s: { r: hName, c: 1 }, e: { r: hCode, c: 1 } },
    { s: { r: hName, c: 2 }, e: { r: hCode, c: 2 } },
    { s: { r: hName, c: 3 }, e: { r: hCode, c: 3 } },
  ];
  ws["!merges"] = merges;

  const dataStart = 3;
  const dataEnd = dataStart + callplans.length - 1;

  callplans.forEach((doc, rowIdx) => {
    const r = dataStart + rowIdx;
    const qtyBySku = new Map<string, number>();
    (doc.details || []).forEach((d) => {
      const code = String(d.item_code || "").trim();
      if (!code) return;
      const qty = Number(d.item_qty_final) || 0;
      qtyBySku.set(code, (qtyBySku.get(code) || 0) + qty);
    });

    setCell(
      ws,
      r,
      0,
      doc.spb_number || doc.callplan_number || "—",
      cellStyle({ align: "left" }),
    );
    setCell(
      ws,
      r,
      1,
      String(doc.status || "FINAL").toUpperCase(),
      cellStyle({ align: "center" }),
    );
    setCell(ws, r, 2, doc.sales_nik || "—", cellStyle({ align: "center" }));
    setCell(
      ws,
      r,
      3,
      doc.sales_name || "—",
      cellStyle({ align: "left", bold: true }),
    );

    skuColumns.forEach((sku, idx) => {
      const qty = qtyBySku.get(sku.code) || 0;
      setCell(
        ws,
        r,
        fixedCols + idx,
        qty > 0 ? qty : "",
        cellStyle(),
      );
    });
  });

  const totalRow = dataEnd + 1;
  const firstExcelRow = dataStart + 1; // 1-based
  const lastExcelRow = dataEnd + 1;

  setCell(ws, totalRow, 0, "", cellStyle({ bg: COLORS.orange }));
  setCell(ws, totalRow, 1, "", cellStyle({ bg: COLORS.orange }));
  setCell(ws, totalRow, 2, "", cellStyle({ bg: COLORS.orange }));
  setCell(
    ws,
    totalRow,
    3,
    "TOTAL ALL",
    cellStyle({ bg: COLORS.orange, bold: true, align: "left" }),
  );
  skuColumns.forEach((_sku, idx) => {
    const col = XLSX.utils.encode_col(fixedCols + idx);
    setCell(
      ws,
      totalRow,
      fixedCols + idx,
      null,
      cellStyle({ bg: COLORS.orange, bold: true }),
      `SUM(${col}${firstExcelRow}:${col}${lastExcelRow})`,
    );
  });

  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: totalRow + 1, c: totalCols - 1 },
  });

  ws["!cols"] = [
    { wch: 36 },
    { wch: 12 },
    { wch: 12 },
    { wch: 24 },
    ...skuColumns.map(() => ({ wch: 10 })),
  ];

  ws["!rows"] = [{ hpt: 22 }, { hpt: 20 }, { hpt: 18 }];

  XLSX.utils.book_append_sheet(wb, ws, "Rekap SPB Final");

  const safeAmo = (amoName || "AMO").replace(/[^\w\-]+/g, "_");
  const safeDate = reportDate.replace(/[^\w\-]+/g, "_");
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `Rekap_SPB_Final_${safeAmo}_${safeDate}.xlsx`,
  );
};
