import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "./Table";
import { useNavigate } from "react-router-dom";
import {
  CallPlanDetail,
  CallPlanBindings,
} from "../../../../API/types/callPlan";

interface AdjustTableProps {
  data: CallPlanDetail[];
  globalFilter: string;
  setGlobalFilter: (val: string) => void;
}

const AdjustTable = ({
  data,
  globalFilter,
  setGlobalFilter,
}: AdjustTableProps) => {
  const navigate = useNavigate();

  // Filter data berdasarkan globalFilter (Search)
  const filteredData = useMemo(() => {
    if (!globalFilter) return data;
    const lowerFilter = globalFilter.toLowerCase();
    return data.filter(
      (item) =>
        item.SALES_NIK.toLowerCase().includes(lowerFilter) ||
        item.SALES_NAME.toLowerCase().includes(lowerFilter) ||
        item.ROUTE_NUMBER.toLowerCase().includes(lowerFilter),
    );
  }, [data, globalFilter]);

  const columns: ColumnDef<CallPlanDetail>[] = useMemo(
    () => [
      {
        accessorKey: "SALES_NIK",
        header: () => <div className="text-left">NIK</div>,
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-slate-700">
            {row.original.SALES_NIK}
          </span>
        ),
      },
      {
        accessorKey: "SALES_NAME",
        header: () => <div className="text-left">NAMA SALES</div>,
        cell: ({ row }) => (
          <span className="text-sm font-medium text-slate-600">
            {row.original.SALES_NAME}
          </span>
        ),
      },
      {
        accessorKey: "ROUTE_NUMBER",
        header: () => <div className="text-center">ROUTE</div>,
        cell: ({ row }) => (
          <span className="text-sm text-center block text-slate-600">
            {row.original.ROUTE_NUMBER}
          </span>
        ),
      },
      {
        accessorKey: "CALL_PLAN_NUMBER",
        header: () => <div className="text-left">CALLPLAN NO</div>,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.CALL_PLAN_NUMBER}
          </span>
        ),
      },
      //  {
      //   accessorKey: "CALL_PLAN_START_DATE",
      //   header: () => <div className="text-left">CALLPLAN START DATE</div>,
      //   cell: ({ row }) => (
      //     <span className="text-sm text-slate-600">{row.original.CALL_PLAN_START_DATE}</span>
      //   ),
      // },
      {
        id: "action",
        header: () => <div className="text-center">ACTION</div>,
        cell: () => (
          <div className="flex justify-center">
            <button
              onClick={() => navigate("generate_do")}
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#F97316] hover:bg-orange-600 text-white shadow-sm transition-all"
            >
              Generate Suggestion
            </button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <TableComponent
        data={filteredData}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        // Pagination props sesuaikan dengan implementasi TableComponent Anda
      />
    </div>
  );
};

export default AdjustTable;
