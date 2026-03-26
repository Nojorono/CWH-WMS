import { useEffect, useMemo, useState } from "react";
import { FaEye, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { formatDateIndo } from "../../../../helper/FormatDate";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_INBOUND } from "../../../../constants/statusMaps";
import { useStoreInboundGoodStock } from "../../../../DynamicAPI/stores/Store/MasterStore";
import TableComponent from "../TableAndForm/component/Table/TableComponent";
import { usePagePermissions } from "../../../../utils/UserPermission/UserPagePermissions";

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
      page: pageIndex + 1, // jika backend 1-based
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
    });
  }, [fetchUsingPagination, pageIndex, pageSize, globalFilter, filteredStatus]);

  // 🔹 Kolom Table
  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "inbound_number",
        header: "Inbound No",
      },
      {
        accessorKey: "inbound_reference_number",
        header: "Inbound Reference No",
      },
      {
        header: "Principal",
        id: "principal", // Gunakan id karena kita pakai accessorFn/cell
        cell: ({ row }) => {
          const dos = row.original.inbound_dos;
          // Cek jika ada data di inbound_dos
          if (dos && dos.length > 0) {
            // Jika Anda hanya ingin mengambil principal dari DO pertama:
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

              {["CREATED", "WAITING FOR REVISION"].includes(item.status) && (
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

              {(!item.inbound_id_reference ||
                item.inbound_id_reference === "") && (
                <FaPlus
                  className="size-5 cursor-pointer text-purple-600"
                  onClick={() => handleAddToReceive(item)}
                  title="Add to Receive"
                />
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

  const handleAddToReceive = (data: any) => {
    console.log("Add data:", data);
    navigate("/inbound_planning/process", {
      state: { data, mode: "add", title: "Add Inbound Planning" },
    });
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <span className="text-gray-600 font-medium">Loading...</span>
        </div>
      )}

      <TableComponent
        data={list}
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
