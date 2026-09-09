import React, { useMemo } from "react";
import { GudangFormConfig } from "./config";
import { formatQty } from "./formatters";
import { GudangFormRow } from "./types";

type GudangFormTableProps = {
  config: GudangFormConfig;
  rows: GudangFormRow[];
};

const th =
  "border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold print:p-1.5 print:text-[10px]";
const td =
  "border-2 border-dashed border-gray-800 p-2 print:p-1.5 print:text-[11px]";

/** Acuan panjang nama yang masih nyaman di kolom */
const SKU_NAME_FIT_LEN = "CLASMILD BLUETEA DUO 16".length;

const getSkuNameTextClass = (name: string) => {
  const len = String(name || "").trim().length;
  if (len <= SKU_NAME_FIT_LEN) {
    return "text-[11px] font-bold leading-snug print:text-[10px]";
  }
  if (len <= SKU_NAME_FIT_LEN + 10) {
    return "text-[10px] font-bold leading-tight print:text-[9px]";
  }
  return "text-[9px] font-bold leading-tight print:text-[8px]";
};

export const GudangFormTable = ({ config, rows }: GudangFormTableProps) => {
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        sisaBarang:
          row.sisaBarang === null
            ? acc.sisaBarang
            : (acc.sisaBarang ?? 0) + (Number(row.sisaBarang) || 0),
        hasSisa: acc.hasSisa || row.sisaBarang !== null,
        finalDo: acc.finalDo + (Number(row.finalDo) || 0),
        qtyDelta: acc.qtyDelta + (Number(row.qtyDelta) || 0),
        caseQty: acc.caseQty + (Number(row.caseQty) || 0),
        balQty: acc.balQty + (Number(row.balQty) || 0),
        slopQty: acc.slopQty + (Number(row.slopQty) || 0),
        packQty: acc.packQty + (Number(row.packQty) || 0),
      }),
      {
        sisaBarang: null as number | null,
        hasSisa: false,
        finalDo: 0,
        qtyDelta: 0,
        caseQty: 0,
        balQty: 0,
        slopQty: 0,
        packQty: 0,
      },
    );
  }, [rows]);

  const sisaTotal = totals.hasSisa ? totals.sisaBarang : null;

  return (
    <table className="gudang-form-table w-full table-fixed border-collapse text-sm print:text-[11px]">
      <colgroup>
        <col className="w-[12%]" />
        <col className="w-[28%]" />
        <col className="w-[8%]" />
        <col className="w-[8%]" />
        <col className="w-[8%]" />
        <col className="w-[9%]" />
        <col className="w-[9%]" />
        <col className="w-[9%]" />
        <col className="w-[9%]" />
      </colgroup>
      <thead>
        <tr>
          <th
            rowSpan={2}
            className="border-2 border-dashed border-gray-800 p-2 text-left uppercase print:p-1.5 print:text-[10px]"
          >
            Kode
          </th>
          <th
            rowSpan={2}
            className="border-2 border-dashed border-gray-800 p-2 text-left uppercase print:p-1.5 print:text-[10px]"
          >
            SKU Name
          </th>
          <th
            colSpan={3}
            className="border-2 border-dashed border-gray-800 p-2 text-center uppercase print:p-1.5 print:text-[10px]"
          >
            Total Bks
          </th>
          <th
            colSpan={4}
            className="border-2 border-dashed border-gray-800 p-2 text-center uppercase print:p-1.5 print:text-[10px]"
          >
            {config.groupHeader}
          </th>
        </tr>
        <tr>
          <th className={th}>Sisa barang</th>
          <th className={th}>{config.finalDoLabel}</th>
          <th className={th}>{config.deltaLabel}</th>
          <th className={th}>Dus</th>
          <th className={th}>Bal</th>
          <th className={th}>Pres</th>
          <th className={th}>Bks</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={9}
              className={`${td} p-4 text-center italic text-slate-400`}
            >
              {config.emptyText}
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => {
            const skuName = row.name || "-";
            return (
              <tr key={`${row.code}-${idx}`} className="break-inside-avoid">
                <td className={`${td} break-all`}>{row.code || "-"}</td>
                <td className={`${td} align-middle`}>
                  <span
                    className={`block break-words ${getSkuNameTextClass(skuName)}`}
                    title={skuName}
                  >
                    {skuName}
                  </span>
                </td>
                <td
                  className={`${td} text-center ${
                    row.sisaBarang === null ? "text-slate-400" : "text-blue-600"
                  }`}
                >
                  {formatQty(row.sisaBarang)}
                </td>
                <td className={`${td} text-center text-blue-600`}>
                  {formatQty(row.finalDo)}
                </td>
                <td className={`${td} text-center ${config.deltaBoldClass}`}>
                  {formatQty(row.qtyDelta)}
                </td>
                <td className={`${td} text-center`}>
                  {formatQty(row.caseQty ?? null)}
                </td>
                <td className={`${td} text-center`}>
                  {formatQty(row.balQty ?? null)}
                </td>
                <td className={`${td} text-center`}>
                  {formatQty(row.slopQty ?? null)}
                </td>
                <td className={`${td} text-center`}>
                  {formatQty(row.packQty ?? null)}
                </td>
              </tr>
            );
          })
        )}

        <tr className="break-inside-avoid">
          <td colSpan={2} className={`${td} font-bold uppercase`}>
            Jumlah
          </td>
          <td
            className={`${td} text-center font-bold ${
              sisaTotal === null ? "text-slate-400" : "text-blue-600"
            }`}
          >
            {formatQty(sisaTotal)}
          </td>
          <td className={`${td} text-center font-bold text-blue-600`}>
            {formatQty(totals.finalDo)}
          </td>
          <td
            className={`${td} text-center font-bold ${config.deltaBoldClass}`}
          >
            {formatQty(totals.qtyDelta)}
          </td>
          <td className={`${td} text-center font-bold`}>
            {formatQty(totals.caseQty || null)}
          </td>
          <td className={`${td} text-center font-bold`}>
            {formatQty(totals.balQty || null)}
          </td>
          <td className={`${td} text-center font-bold`}>
            {formatQty(totals.slopQty || null)}
          </td>
          <td className={`${td} text-center font-bold`}>
            {formatQty(totals.packQty || null)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};
