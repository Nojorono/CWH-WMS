import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FaArrowRight } from "react-icons/fa";
import { BaseTable } from "../component/BaseTable";
import Button from "../../../../components/ui/button/Button";
import { GroupedSPBData } from "../MainTable";
import { DOSuggestionDetail } from "../../../../API/types/draftDOsuggestion";

interface SPBSubmittedPageProps {
  data: GroupedSPBData[];
  onProceed: () => void;
}

// 1. KOMPONEN SUB-TABLE (Versi Scrollable - Tanpa Pagination)
const StandardSubTable = ({
  details,
}: {
  details: DOSuggestionDetail[];
  status?: string;
}) => {
  return (
    <div className="p-4 bg-slate-50/50">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header dengan informasi jumlah item */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
          <h4 className="font-semibold text-slate-800 text-sm">
            Product Detail ({details.length} Items)
          </h4>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium text-xs sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-3">SKU Name</th>
                <th className="px-5 py-3 text-right">Locked Qty</th>
                <th className="px-5 py-3 text-right">BTB Qty</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {details.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {item.item_code}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {item.item_qty_submitted}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-blue-600">
                    {item.qty_btb}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {item.no_found_in_btb ? (
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                        No BTB Data
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                        Synced
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 2. MAIN PAGE COMPONENT
export const SPBSubmittedPage = ({
  data,
  onProceed,
}: SPBSubmittedPageProps) => {
  const [globalFilter, setGlobalFilter] = React.useState("");

  const allSalesmen = useMemo(() => {
    return data.flatMap((spvGroup) =>
      spvGroup.salesmenDO.map((salesman) => ({
        ...salesman,
        sales_spv_name: spvGroup.sales_spv_name,
        sales_spv_nik: spvGroup.sales_spv_nik,
      })),
    );
  }, [data]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: "callplan_number", header: "Call Plan Number" },
      { accessorKey: "sales_nik", header: "NIK Sales" },
      { accessorKey: "sales_name", header: "Nama Sales" },
      { accessorKey: "sales_spv_name", header: "Nama SPV" },
      { accessorKey: "sales_spv_nik", header: "NIK SPV" },
      {
        id: "total_sku",
        header: "Total SKU",
        cell: ({ row }) => row.original.details?.length || 0,
      },
      {
        accessorKey: "callplan_date_start",
        header: "Start Date",
        cell: (info) => formatDate(info.getValue<string>()),
      },
      {
        accessorKey: "callplan_date_end",
        header: "End Date",
        cell: (info) => formatDate(info.getValue<string>()),
      },
    ],
    [],
  );

  return (
    <BaseTable
      data={allSalesmen}
      columns={columns}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      isExpandable={true}
      renderSubComponent={(row) => (
        <StandardSubTable details={row.details} status={row.status} />
      )}
      footerAction={
        <Button
          onClick={onProceed}
          variant="primary"
          endIcon={<FaArrowRight />}
        >
          Proceed to Allocation & Calculation
        </Button>
      }
    />
  );
};
