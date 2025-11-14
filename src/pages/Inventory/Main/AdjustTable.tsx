// import { useState, useMemo, useCallback, use } from "react";
// import { ColumnDef } from "@tanstack/react-table";
// import TableComponent from "../../../components/tables/MasterDataTable/TableComponent";
// import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
// import { useNavigate } from "react-router";

// interface Props {
//   data: any[];
//   globalFilter?: string;
//   isCreateModalOpen: boolean;
//   onCloseCreateModal: () => void;
//   columns: ColumnDef<any>[];
//   formFields: any[];
//   onSubmit?: (data: any) => Promise<any>;
//   onUpdate?: (data: any) => Promise<any>;
//   onDelete?: (id: any) => Promise<void>;
//   onRefresh: () => void;
//   getRowId?: (row: any) => any;
//   title?: string;
//   noActions?: boolean;
//   isDeleted?: boolean;
//   isEdited?: boolean;
//   isView?: boolean;
//   onSelectedChange?: (ids: any[]) => void; // ✅ callback ke parent
// }

// const AdjustTable = ({
//   data,
//   globalFilter,
//   columns,
//   onDelete,
//   onRefresh,
//   getRowId = (row) => row.id,
//   noActions,
//   isDeleted = true,
//   isEdited = true,
//   isView = false,
//   onSelectedChange,
// }: Props) => {
//   const navigate = useNavigate();
//   const [selectedItem, setSelectedItem] = useState<any | null>(null);
//   const [selectedIds, setSelectedIds] = useState<any[]>([]);

//   const handleDelete = useCallback(
//     async (id: any) => {
//       if (onDelete) {
//         await onDelete(id);
//       }
//       await onRefresh();
//     },
//     [onDelete, onRefresh]
//   );

//   const handleViewDetail = (id: any) => {
//     navigate(`/inventory/detail`, { state: { invListId: id } });
//   };

//   const enhancedColumns = useMemo(() => {
//     if (noActions) return columns;
//     return [
//       ...columns,
// {
//   id: "actions",
//   header: "Action",
//   cell: ({ row }) => (
//     <div className="flex gap-2">
//       {isEdited && (
//         <button
//           className="text-green-600"
//           onClick={() => setSelectedItem(row.original)}
//         >
//           <FaEdit />
//         </button>
//       )}

//       {isDeleted && (
//         <button
//           onClick={() => handleDelete(getRowId(row.original))}
//           className="text-red-500"
//         >
//           <FaTrash />
//         </button>
//       )}

//       {isView && (
//         <button
//           onClick={() => handleViewDetail(getRowId(row.original))}
//           className="text-blue-500"
//         >
//           <FaEye />
//         </button>
//       )}
//     </div>
//   ),
// },
//     ];
//   }, [columns, getRowId, handleDelete]);

//   // ✅ hanya update saat ada event, bukan di render
//   const handleSelectionChange = useCallback(
//     (ids: any[]) => {
//       setSelectedIds(ids);
//       if (onSelectedChange) {
//         onSelectedChange(ids); // kirim ke parent
//       }
//     },
//     [onSelectedChange]
//   );

//   return (
//     <>
//       <TableComponent
//         data={data}
//         columns={enhancedColumns}
//         globalFilter={globalFilter}
//         onSelectionChange={handleSelectionChange}
//       />
//     </>
//   );
// };

// export default AdjustTable;

import { useEffect, useMemo, useState } from "react";
import { FaEye, FaEdit } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../Table/TableComponent";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../../common/statusBadge";
import {
  STATUS_MAP_INVENTORY,
  STATUS_PROGRESSION_INVENTORY,
} from "../../../constants/statusMaps";
import { useStoreInventoryTracking } from "../../../DynamicAPI/stores/Store/MasterStore";

type InventoryData = {
  no: number;

  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  warehouse_id: string;
  warehouse_name: string;

  warehouse_sub_id: string;
  warehouse_sub_name: string;

  warehouse_bin_id: string | null;
  warehouse_bin_name: string | null;

  pallet_id: string;
  pallet_code: string;
  pallet_uom: string;
  pallet_capacity: number;
  pallet_current_qty: number;

  inventory_date: string;
  inventory_status: string;
  progression_status: string;
  inventory_note: string;
};

type MenuTableProps = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: string) => void;
  onRefresh?: () => void;
  filteredStatus?: any;
};

const AdjustTable = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
}: MenuTableProps) => {
  const navigate = useNavigate();
  const {
    fetchUsingPagination,
    list: list,
    pagination,
  } = useStoreInventoryTracking();

  // 🔹 local state pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // 🔹 Fetch data setiap kali pagination / search berubah
  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: pageIndex + 1, // jika backend 1-based
      limit: pageSize,
      search: globalFilter || "",
      inventory_status: filteredStatus || "",
      sortOrder: "DESC",
      sortBy: "progression_status",
    });
  }, [fetchUsingPagination, pageIndex, pageSize, globalFilter, filteredStatus]);

  console.log("list", list);

  const columns: ColumnDef<InventoryData>[] = useMemo(
    () => [
      {
        accessorKey: "pallet_code",
        header: "Pallet ID",
      },
      {
        accessorKey: "warehouse_name",
        header: "Warehouse",
      },
      {
        accessorKey: "warehouse_sub_name",
        header: "Zone",
      },
      {
        accessorKey: "warehouse_bin_name",
        header: "Bin",
      },
      {
        accessorKey: "progression_status",
        header: "Progression Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.progression_status}
            colorMap={STATUS_PROGRESSION_INVENTORY}
            variant="solid"
            size="sm"
          />
        ),
      },
      {
        accessorKey: "inventory_status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.inventory_status}
            colorMap={STATUS_MAP_INVENTORY}
            variant="solid"
            size="sm"
          />
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-2">
            {/* {isEdited && (
              <button
                className="text-green-600"
                onClick={() => setSelectedItem(row.original)}
              >
                <FaEdit />
              </button>
            )}

            {isDeleted && (
              <button
                onClick={() => handleDelete(getRowId(row.original))}
                className="text-red-500"
              >
                <FaTrash />
              </button>
            )}

            {isView && (
              <button
                onClick={() => handleViewDetail(getRowId(row.original))}
                className="text-blue-500"
              >
                <FaEye />
              </button>
            )} */}

            <button
              onClick={() => handleViewDetail(row.original.id)}
              className="text-blue-500"
            >
              <FaEye />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const handleViewDetail = (id: any) => {
    navigate(`/inventory/detail`, { state: { invListId: id } });
  };

  // Mapping API data to table data
  const mappedList = (list || []).map((item: any, index: number) => ({
    no: index + 1,

    id: item.id,
    createdAt: item.createdAt || "",
    updatedAt: item.updatedAt || "",
    deletedAt: item.deletedAt || null,

    warehouse_id: item.warehouse_id || "",
    warehouse_name: item.warehouse?.name || "-",

    warehouse_sub_id: item.warehouse_sub_id || "",
    warehouse_sub_name: item.warehouseSub?.name || "-",

    warehouse_bin_id: item.warehouse_bin_id || null,
    warehouse_bin_name: item.warehouseBin?.name || null,

    pallet_id: item.pallet_id || "",
    pallet_code: item.pallet?.pallet_code || "",
    pallet_uom: item.pallet?.uom || "",
    pallet_capacity: item.pallet?.capacity || 0,
    pallet_current_qty: item.pallet?.currentQuantity || 0,

    inventory_date: item.inventory_date
      ? new Date(item.inventory_date).toLocaleDateString("en-GB")
      : "-",

    inventory_status: item.inventory_status || "",
    progression_status: item.progression_status || "",
    inventory_note: item.inventory_note || "",
  }));

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
