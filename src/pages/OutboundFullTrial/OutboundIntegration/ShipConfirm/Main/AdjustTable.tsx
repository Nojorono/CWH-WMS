import { useEffect, useMemo, useState } from "react";
import {
  FaChevronDown,
  FaChevronRight,
  FaTruck,
  FaExclamationTriangle,
} from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import StatusBadge from "../../../../../common/statusBadge";
import { STATUS_MAP_INTEGRATION_OUTBOUND } from "../../../../../constants/statusMaps";
import { useStoreShipConfirm } from "../../../../../DynamicAPI/stores/Store/MasterStore";
import ActIndicator from "../../../../../components/ui/activityIndicator";
import ExpandableTableComponent from "../component/Table";
import { formatDateTimeIndo } from "../../../../../helper/FormatDateTime";
import { OutboundDoUI } from "../../../../../DynamicAPI/types/ShipConfirmType";
import { ShipConfirmRowDetail } from "../component/ShipConfirmRowDetail";
import { mapShipConfirmLogList } from "../Helper/mappinganUI";

const OutboundShipConfirmTable = ({
  globalFilter,
  setGlobalFilter,
  filteredIO,
}: any) => {
  const { fetchAll, list, pagination, isLoading } = useStoreShipConfirm();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredData = useMemo(() => {
    if (!list || list.length === 0) return [];
    const mappedUI = mapShipConfirmLogList(list);
    if (!mappedUI || mappedUI.length === 0) return [];

    let result = [...mappedUI];
    if (filteredIO) {
      result = result.filter(
        (doItem: any) => doItem.organization_id === filteredIO,
      );
    }
    if (globalFilter) {
      const lowerFilter = globalFilter.toLowerCase();
      result = result.filter((doItem: any) =>
        doItem.outbound_do_number?.toLowerCase().includes(lowerFilter),
      );
    }
    return result;
  }, [list, filteredIO, globalFilter]);

  const columns: ColumnDef<OutboundDoUI>[] = useMemo(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <button className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
              {row.getIsExpanded() ? (
                <FaChevronDown className="text-blue-600 w-3 h-3" />
              ) : (
                <FaChevronRight className="text-slate-400 w-3 h-3" />
              )}
            </button>
          </div>
        ),
      },
      {
        header: "DO & Memo",
        accessorKey: "outbound_do_number",
        cell: ({ row }) => {
          const doData = row.original;
          const firstMemo = doData.outbound_memos?.[0];
          return (
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                DO Number
              </span>
              <span className="font-bold text-blue-700 font-mono text-sm">
                {doData.outbound_do_number || "-"}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded font-mono mt-1 max-w-max">
                Memo: {firstMemo?.outbound_memo_number || "-"}
              </span>
            </div>
          );
        },
      },
      {
        header: "Transaction Type",
        id: "transaction_type",
        cell: ({ row }) => {
          const doData = row.original as any;
          const itemLog = doData.outbound_memos?.[0]?.outbound_memo_items?.[0];
          const sourceSystem =
            itemLog?.integration_data?.source_system || "WMS";

          return (
            <div className="flex flex-col">
              <span className="text-[11px] leading-tight text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-100 max-w-max font-mono">
                {doData.log_transaction_type || "-"}
              </span>
              <span className="text-[10px] text-slate-500 italic mt-1">
                Source: {sourceSystem}
              </span>
            </div>
          );
        },
      },
      {
        header: "Integration Status",
        id: "ship_confirm_status",
        cell: ({ row }) => {
          const doData = row.original as any;

          // 🔹 TERIMA BERSIH: Tinggal render data hasil komputasi mapper helper
          return (
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5">
                <StatusBadge
                  status={doData.computed_status}
                  colorMap={STATUS_MAP_INTEGRATION_OUTBOUND || {}}
                  variant="solid"
                  size="sm"
                />
              </div>
              <span className="text-[9px] text-slate-400 font-mono tracking-tight bg-slate-100 px-1.5 rounded mt-0.5">
                REQ ID: {doData.computed_req_id}
              </span>
            </div>
          );
        },
      },
      {
        header: "Expedition Info",
        accessorKey: "expedition",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-700 font-bold truncate max-w-[150px]">
              {row.original.expedition || "No Expedition"}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
              <FaTruck size={10} />
              <span>{row.original.license_plate || "-"}</span>
            </div>
          </div>
        ),
      },
      {
        header: "Created Date",
        accessorKey: "createdAt",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-700 font-semibold">
              {formatDateTimeIndo(row.original.createdAt)}
            </span>
          </div>
        ),
      },
      {
        header: "Updated Date",
        accessorKey: "updatedAt",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-700 font-semibold">
              {formatDateTimeIndo(row.original.updatedAt)}
            </span>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="relative bg-[#f1f5f9] p-4 min-h-screen">
      {isLoading && <ActIndicator />}
      <ExpandableTableComponent
        data={filteredData}
        columns={columns}
        renderRowDetails={(row) => (
          <ShipConfirmRowDetail doData={row.original} />
        )}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalPages={pagination?.totalPages || 0}
        onPageChange={(page: number, size: number) => {
          setPageIndex(page);
          setPageSize(size);
        }}
      />
    </div>
  );
};

export default OutboundShipConfirmTable;
