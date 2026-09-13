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
    />
  );
}

export default OverviewTab;
