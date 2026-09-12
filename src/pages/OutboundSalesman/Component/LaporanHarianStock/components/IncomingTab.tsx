import React from "react";
import { LhsMovementLine } from "../types";
import { formatPack } from "../logic";
import LhsTable, { LhsColumn } from "./LhsTable";

type Props = {
  lines: LhsMovementLine[];
  isLoading?: boolean;
};

function IncomingTab({ lines, isLoading }: Props) {
  const columns: LhsColumn<LhsMovementLine>[] = [
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
      id: "qty",
      header: "Qty",
      align: "right",
      cell: (row) => (
        <span className="font-semibold tabular-nums text-emerald-600">
          +{formatPack(row.qty, false)}
        </span>
      ),
    },
    {
      id: "uom",
      header: "UOM",
      cell: () => <span className="text-slate-500">Bks</span>,
    },
    {
      id: "source",
      header: "Source",
      cell: (row) => <span className="text-slate-600">{row.source}</span>,
    },
  ];

  return (
    <LhsTable
      columns={columns}
      data={lines}
      rowKey={(row) => row.id}
      isLoading={isLoading}
      emptyMessage="Tidak ada pergerakan incoming."
    />
  );
}

export default IncomingTab;
