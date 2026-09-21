import React from "react";
import dayjs from "dayjs";
import { LhsMovementLine } from "../types";
import { formatPack } from "../logic";
import LhsTable, { LhsColumn } from "./LhsTable";

type Props = {
  lines: LhsMovementLine[];
  isLoading?: boolean;
};

const formatMovementDate = (raw?: string | null) => {
  if (!raw) return "—";
  const d = dayjs(raw);
  return d.isValid() ? d.format("YYYY-MM-DD") : String(raw);
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
      cell: () => <span className="text-slate-500">BKS</span>,
    },
    {
      id: "source",
      header: "Source",
      cell: (row) => <span className="text-slate-600">{row.source}</span>,
    },
    {
      id: "date",
      header: "Date",
      cell: (row) => (
        <span className="tabular-nums text-slate-600">
          {formatMovementDate(row.date)}
        </span>
      ),
    },
  ];

  return (
    <LhsTable
      columns={columns}
      data={lines}
      rowKey={(row) => row.id}
      isLoading={isLoading}
      emptyMessage="Tidak ada pergerakan incoming."
      footerNote={
        <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
          Tanggal: Callplan date (SPB) · BTB date (BTB)
        </p>
      }
    />
  );
}

export default IncomingTab;
