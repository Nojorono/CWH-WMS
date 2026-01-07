import { useEffect, useMemo, useState } from "react";
import { FaTasks } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../Table/TableComponent";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_DO } from "../../../../constants/statusMaps";
import { OutboundDo } from "../Helper/doTypes";
import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { mapPickingTransactions } from "../Helper/mappedList";
import { formatDateIndo } from "../../../../helper/FormatDate";

type Props = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  filteredStatus?: any;
};

const AdjustTable = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
}: Props) => {
  const navigate = useNavigate();
  const { fetchUsingPagination, list, pagination } =
    useStoreOutboundDeliveryOrder();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: pageIndex + 1,
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
    });
  }, [fetchUsingPagination, pageIndex, pageSize, globalFilter, filteredStatus]);

  const mappedList: OutboundDo[] = useMemo(() => {
    return mapPickingTransactions(list || []);
  }, [list]);

  const MemoCell = ({ memos }: { memos: any[] }) => {
    const [openMemoId, setOpenMemoId] = useState<string | null>(null);

    return (
      <ul className="space-y-2">
        {memos.map((memo) => {
          const isOpen = openMemoId === memo.id;

          const pickings = Array.isArray(memo.transaction_pickings)
            ? memo.transaction_pickings
            : memo.transaction_pickings
            ? [memo.transaction_pickings]
            : [];

          return (
            <li key={memo.id} className="border border-gray-200 rounded-md p-2">
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {memo.outbound_memo_number}
                </div>

                {/* TOGGLE */}
                <button
                  type="button"
                  onClick={() => setOpenMemoId(isOpen ? null : memo.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {isOpen
                    ? "Hide Items"
                    : `Show Items (${memo.transaction_pickings?.length ?? 0})`}
                </button>
              </div>

              {/* EXPANDED CONTENT */}
              {isOpen && (
                <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                  {pickings.map((tp: any) => (
                    <li key={tp.id}>
                      <span className="font-medium">{tp.item?.sku}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        | Qty: {tp.quantity}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        | UOM: {tp.uom}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        | Week: {tp.week_number}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const columns: ColumnDef<OutboundDo>[] = useMemo(
    () => [
      { accessorKey: "outbound_do_number", header: "DO Number" },
      {
        accessorKey: "outbound_memos",
        header: "Memo Number",
        cell: ({ row }) => (
          <MemoCell memos={row.original.outbound_memos || []} />
        ),
      },

      { accessorKey: "outbound_type", header: "Type" },
      { accessorKey: "origin", header: "Origin" },
      {
        accessorKey: "delivery_date",
        header: "Delivery Date",
        cell: ({ row }) => formatDateIndo(row.original.delivery_date),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            colorMap={STATUS_MAP_DO}
            variant="solid"
            size="sm"
          />
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-3">
            <FaTasks
              className={`size-5 cursor-pointer text-blue-600 ${
                row.original.status === "PENDING"
                  ? "opacity-20 cursor-not-allowed"
                  : ""
              }`}
              onClick={() =>
                row.original.status !== "PENDING" && handleAdjust(row.original)
              }
              title="Adjust Picking Transaction"
            />
          </div>
        ),
      },
    ],
    []
  );

  const handleAdjust = (data: OutboundDo) => {
    navigate("/outbound_do/detach_attach", {
      state: {
        params: data,
        mode: "adjust",
        title: "Adjust Picking Transaction",
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <TableComponent
        data={mappedList}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalPages={pagination.totalPages}
        onPageChange={(page, size) => {
          setPageIndex(page);
          setPageSize(size);
        }}
      />
    </div>
  );
};

export default AdjustTable;
