import { useEffect, useMemo, useState } from "react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { formatDateIndo } from "../../../../helper/FormatDate";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_INBOUND } from "../../../../constants/statusMaps";
import { useStoreInboundGoodStock } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { usePagePermissions } from "../../../../utils/UserPermission/UserPagePermissions";
import ActIndicator from "../../../../components/ui/activityIndicator";
import TableComponent from "../../../../components/tables/ActionTable/TableComponent";

type MenuTableProps = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: number) => void;
  onRefresh?: () => void;
  filteredStatus?: any;
};

const AdjustTable = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
}: MenuTableProps) => {
  const navigate = useNavigate();
  const { canCreate, canManage } = usePagePermissions();

  const { fetchUsingPagination, deleteData, list, pagination, isLoading } =
    useStoreInboundGoodStock();

  // 🔹 local state pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // 🔹 Fetch data setiap kali pagination / search berubah
  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: pageIndex + 1,
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
    });
  }, [fetchUsingPagination, pageIndex, pageSize, globalFilter, filteredStatus]);

  console.log("list", list);

  // 🔹 Kolom Table
  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "inbound_number",
        header: "Inbound No",
      },
      {
        accessorKey: "origin",
        header: "Origin",
      },
      {
        accessorKey: "inbound_reference_number",
        header: "Inbound Reference No",
      },
      {
        id: "add_to_receipt_number",
        header: "Receipt No",
        // Karena data berada di dalam inbound_dos, kita ambil dari indeks pertama
        cell: ({ row }) => {
          const dos = row.original.inbound_dos;
          const receiptNo =
            dos && dos.length > 0 ? dos[0].add_to_receipt_number : null;

          return (
            <div className="font-medium text-slate-700">
              {receiptNo ? (
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100">
                  {receiptNo}
                </span>
              ) : (
                <span className="text-slate-400 italic text-xs">
                  Not Available
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: "Principal",
        id: "principal",
        cell: ({ row }) => {
          const dos = row.original.inbound_dos;
          if (dos && dos.length > 0) {
            return dos[0].principal || "-";
          }
          return "-";
        },
      },
      {
        accessorKey: "inbound_type",
        header: "Inbound Type",
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => formatDateIndo(row.original.createdAt),
      },
      {
        accessorKey: "license_plate",
        header: "Plat No",
      },
      {
        accessorKey: "driver_name",
        header: "Driver Name",
      },
      {
        accessorKey: "driver_phone",
        header: "Driver Phone",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            colorMap={STATUS_MAP_INBOUND}
            variant="solid"
            size="sm"
          />
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div style={{ display: "flex", gap: "8px" }}>
              <FaEye
                className="size-5 cursor-pointer text-green-600"
                onClick={() => handleDetail(item)}
                title="View"
              />

              {["CREATED", "WAITING FOR REVISION", "UNLOADING"].includes(
                item.status,
              ) && (
                <>
                  <FaEdit
                    className="size-5 cursor-pointer text-blue-600"
                    onClick={() => handleUpdate(item)}
                    title="Edit"
                  />

                  <FaTrash
                    className="size-5 cursor-pointer text-red-600"
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                  />
                </>
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  const handleDetail = (data: any) => {
    navigate("/inbound_planning/process", {
      state: { data, mode: "detail" },
    });
  };

  const handleUpdate = (data: any) => {
    navigate("/inbound_planning/process", {
      state: { data, mode: "edit", title: "Update Inbound Planning" },
    });
  };

  const handleDelete = (id: any) => {
    deleteData(id);
  };

  const mappedList = list || [];

  return (
    <div className="relative">
      {isLoading && <ActIndicator />}

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
