import React, { useMemo } from "react";
import { GudangFormConfig } from "./config";
import { formatQty } from "./formatters";
import { GudangFormRow } from "./types";

type GudangFormTableProps = {
  config: GudangFormConfig;
  rows: GudangFormRow[];
};

const thBase =
  "border-2 border-dashed border-gray-800 p-2 text-center text-xs font-semibold";
const tdBase = "border-2 border-dashed border-gray-800 p-2";

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
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th
            rowSpan={2}
            className="w-20 border-2 border-dashed border-gray-800 p-2 text-left uppercase"
          >
            Kode
          </th>
          <th
            rowSpan={2}
            className="border-2 border-dashed border-gray-800 p-2 text-left uppercase"
          >
            Jenis Rokok
          </th>
          <th
            colSpan={3}
            className="border-2 border-dashed border-gray-800 p-2 text-center uppercase"
          >
            Total Pack
          </th>
          <th
            colSpan={4}
            className="border-2 border-dashed border-gray-800 p-2 text-center uppercase"
          >
            {config.groupHeader}
          </th>
        </tr>
        <tr>
          <th className={`${thBase} w-24`}>Sisa barang</th>
          <th className={`${thBase} w-24`}>Final DO</th>
          <th className={`${thBase} w-24`}>{config.deltaLabel}</th>
          <th className={`${thBase} w-20`}>Case</th>
          <th className={`${thBase} w-20`}>Bal</th>
          <th className={`${thBase} w-20`}>Slop</th>
          <th className={`${thBase} w-20`}>Pack</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={9}
              className={`${tdBase} p-6 text-center italic text-slate-400`}
            >
              {config.emptyText}
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
            <tr key={`${row.code}-${idx}`}>
              <td className={tdBase}>{row.code || "-"}</td>
              <td className={`${tdBase} font-bold`}>{row.name || "-"}</td>
              <td
                className={`${tdBase} text-center ${
                  row.sisaBarang === null ? "text-slate-400" : "text-blue-600"
                }`}
              >
                {formatQty(row.sisaBarang)}
              </td>
              <td className={`${tdBase} text-center text-blue-600`}>
                {formatQty(row.finalDo)}
              </td>
              <td className={`${tdBase} text-center ${config.deltaBoldClass}`}>
                {formatQty(row.qtyDelta)}
              </td>
              <td className={`${tdBase} text-center ${config.accentClass}`}>
                {formatQty(row.caseQty ?? null)}
              </td>
              <td className={`${tdBase} text-center ${config.accentClass}`}>
                {formatQty(row.balQty ?? null)}
              </td>
              <td className={`${tdBase} text-center ${config.accentClass}`}>
                {formatQty(row.slopQty ?? null)}
              </td>
              <td className={`${tdBase} text-center ${config.accentClass}`}>
                {formatQty(row.packQty ?? null)}
              </td>
            </tr>
          ))
        )}

        <tr>
          <td colSpan={2} className={`${tdBase} font-bold uppercase`}>
            Jumlah
          </td>
          <td
            className={`${tdBase} text-center font-bold ${
              sisaTotal === null ? "text-slate-400" : ""
            }`}
          >
            {formatQty(sisaTotal)}
          </td>
          <td className={`${tdBase} text-center font-bold`}>
            {formatQty(totals.finalDo)}
          </td>
          <td className={`${tdBase} text-center font-bold ${config.deltaBoldClass}`}>
            {formatQty(totals.qtyDelta)}
          </td>
          <td className={`${tdBase} text-center font-bold`}>
            {formatQty(totals.caseQty || null)}
          </td>
          <td className={`${tdBase} text-center font-bold`}>
            {formatQty(totals.balQty || null)}
          </td>
          <td className={`${tdBase} text-center font-bold`}>
            {formatQty(totals.slopQty || null)}
          </td>
          <td className={`${tdBase} text-center font-bold`}>
            {formatQty(totals.packQty || null)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};
