import React from "react";
import { LhsStockComputed } from "../types";
import { formatPack, formatSigned, LhsTotals } from "../logic";
import LhsTable, { LhsColumn } from "./LhsTable";
import { VarianceBadge } from "./VarianceBadge";

type Props = {
  rows: LhsStockComputed[];
  totals: LhsTotals;
  isLoading?: boolean;
};

function OverviewTab({ rows, totals, isLoading }: Props) {
  const columns: LhsColumn<LhsStockComputed>[] = [
    {
      id: "kode",
      header: "Kode",
      cell: (row) => (
        <span className="font-semibold text-slate-700">{row.kode}</span>
      ),
    },
    {
      id: "skuName",
      header: "SKU Name",
      cell: (row) => <span className="text-slate-600">{row.skuName}</span>,
    },
    {
      id: "stockAwal",
      header: "Stock Awal",
      align: "right",
      cell: (row) => (
        <span className="tabular-nums text-slate-700">
          {formatPack(row.stockAwal, false)}
        </span>
      ),
    },
    {
      id: "incoming",
      header: "Incoming",
      align: "right",
      headerClassName: "text-emerald-700",
      cell: (row) => (
        <span className="font-semibold tabular-nums text-emerald-600">
          {formatSigned(row.totalTerima)}
        </span>
      ),
    },
    {
      id: "outgoing",
      header: "Outgoing",
      align: "right",
      headerClassName: "text-rose-700",
      cell: (row) => (
        <span className="font-semibold tabular-nums text-rose-600">
          {formatSigned(-Math.abs(row.totalKeluar))}
        </span>
      ),
    },
    {
      id: "stockAkhir",
      header: "Stock Akhir",
      align: "right",
      cell: (row) => (
        <span className="font-bold tabular-nums text-indigo-700">
          {formatPack(row.stockAkhir, false)}
        </span>
      ),
    },
    {
      id: "fisik",
      header: "Fisik",
      align: "right",
      cell: () => <span className="tabular-nums text-slate-300">—</span>,
    },
    {
      id: "meta",
      header: "META",
      align: "right",
      cell: (row) => (
        <span className="tabular-nums text-slate-700">
          {formatPack(row.meta, false)}
        </span>
      ),
    },
    {
      id: "variance",
      header: "Variance",
      align: "center",
      cell: (row) => <VarianceBadge value={row.variance} />,
    },
  ];

  return (
    <LhsTable
      columns={columns}
      data={rows}
      rowKey={(row) => row.id}
      isLoading={isLoading}
      emptyMessage="Tidak ada data untuk tanggal / cabang ini."
      minWidthClassName="min-w-[900px]"
      footer={
        rows.length > 0 ? (
          <tfoot>
            <tr className="bg-orange-500 text-white">
              <td
                colSpan={2}
                className="px-4 py-3 text-xs font-bold uppercase tracking-wide"
              >
                Total All (Bks)
              </td>
              <td className="px-4 py-3 text-right font-bold tabular-nums">
                {formatPack(totals.stockAwal, false)}
              </td>
              <td className="px-4 py-3 text-right font-bold tabular-nums">
                {formatSigned(totals.totalTerima)}
              </td>
              <td className="px-4 py-3 text-right font-bold tabular-nums">
                {formatSigned(-Math.abs(totals.totalKeluar))}
              </td>
              <td className="px-4 py-3 text-right font-bold tabular-nums">
                {formatPack(totals.stockAkhir, false)}
              </td>
              <td className="px-4 py-3 text-right text-white/70">—</td>
              <td className="px-4 py-3 text-right font-bold tabular-nums">
                {formatPack(totals.meta, false)}
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-rose-700/90 px-2.5 py-0.5 text-xs font-bold text-white">
                  {formatSigned(totals.variance)}
                </span>
              </td>
            </tr>
          </tfoot>
        ) : undefined
      }
    />
  );
}

export default OverviewTab;
