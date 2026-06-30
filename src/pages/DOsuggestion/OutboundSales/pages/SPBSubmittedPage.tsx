import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FaArrowRight } from "react-icons/fa";
import { BaseTable } from "../component/BaseTable";
import Button from "../../../../components/ui/button/Button";
import { GroupedSPBData } from "../MainTable";
import { DOSuggestionDetail } from "../../../../API/types/draftDOsuggestion";
import { FaPrint } from "react-icons/fa6";
import { formatDateTimeIndo } from "../../../../helper/FormatDateTime";

interface SPBSubmittedPageProps {
  data: GroupedSPBData[];
  onProceed: () => void;
  onGoToPreparation: () => void;
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
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-red-100 px-2 py-1 rounded">
                        BTB Not Exist
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                        BTB Exist
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
  onGoToPreparation,
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
      { accessorKey: "callplan_number", header: "Callplan Number" },
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
        header: "Callplan Start Date",
        cell: (info) => info.getValue<string>(),
      },
      {
        accessorKey: "callplan_date_end",
        header: "Callplan End Date",
        cell: (info) => info.getValue<string>(),
      },
      { accessorKey: "status", header: "status" },
      {
        accessorKey: "createdAt",
        header: "created at",
        cell: (info) => formatDateTimeIndo(info.getValue<string>()),
      },
      {
        accessorKey: "updatedAt",
        header: "updated at",
        cell: (info) => formatDateTimeIndo(info.getValue<string>()),
      },
    ],
    [],
  );

  // Di SPBSubmittedPage.tsx
  const isFinalStatus =
    allSalesmen.length > 0 && allSalesmen[0].status === "FINAL";

  const footerButton = useMemo(() => {
    if (isFinalStatus) {
      return {
        label: "Proceed to Printing",
        icon: <FaPrint />,
        action: () => {
          onGoToPreparation();
        },
        className: "bg-emerald-600 hover:bg-emerald-700",
      };
    } else {
      return {
        label: "Proceed to Calculation",
        icon: <FaArrowRight />,
        action: onProceed,
        className: "bg-blue-600 hover:bg-blue-700",
      };
    }
  }, [isFinalStatus, allSalesmen, onProceed, onGoToPreparation]);

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
          onClick={footerButton.action}
          variant="primary"
          className={footerButton.className}
          endIcon={footerButton.icon}
        >
          {footerButton.label}
        </Button>
      }
    />
  );
};
