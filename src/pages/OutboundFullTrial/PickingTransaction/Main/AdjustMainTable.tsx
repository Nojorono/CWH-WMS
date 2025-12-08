import { useEffect, useMemo, useState } from "react";
import { FaTasks } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../Table/TableComponent";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../../../common/statusBadge";
import {
  STATUS_MAP_DO,
} from "../../../../constants/statusMaps";
import { OutboundDo } from "../Helper/doTypes";
import { useStoreOutboundDelivery } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { mapPickingTransactions } from "../Helper/mappedList";

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
  const { fetchUsingPagination, list, pagination } = useStoreOutboundDelivery();

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

  const columns: ColumnDef<OutboundDo>[] = useMemo(
    () => [
      { accessorKey: "id", header: "DO Id" },
      { accessorKey: "outbound_do_number", header: "DO Number" },
      { accessorKey: "memo_id", header: "Memo Id" },
      {
        accessorKey: "outbound_memos",
        header: "Memo Number",
        cell: ({ row }) =>
          row.original.outbound_memos
            .map((memo) => memo.outbound_memo_number)
            .join(", "),
      },
      { accessorKey: "outbound_type", header: "Type" },
      { accessorKey: "origin", header: "Origin" },
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
                row.original.status !== "IN_PROGRESS"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={() =>
                row.original.status === "IN_PROGRESS" &&
                handleAdjust(row.original)
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
