import { useEffect, useMemo, useState, useRef } from "react";
import { FaEye } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../Table/TableComponent";
import { useNavigate, useSearchParams } from "react-router-dom"; // Tambahkan useSearchParams
import StatusBadge from "../../../common/statusBadge";
import {
  STATUS_MAP_INVENTORY,
  STATUS_PROGRESSION_INVENTORY,
} from "../../../constants/statusMaps";
import { useStoreInventoryTracking } from "../../../DynamicAPI/stores/Store/MasterStore";

// ... (Type InventoryData tetap sama)
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
  current_items?: {
    item_id: string;
    item_name: string;
    current_quantity: number;
    uom: string;
    production_date: string;
    week_number: number;
  }[];
};

type MenuTableProps = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: string) => void;
  onRefresh?: () => void;
  filteredStatus?: any;
  filteredZone?: any;
  filteredBin?: any;
  filteredItem?: any;
};

const AdjustTable = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
  filteredZone,
  filteredBin,
  filteredItem,
}: MenuTableProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { fetchUsingPagination, list, pagination } =
    useStoreInventoryTracking();

  // 🔹 Sync State dengan URL
  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageIndex = currentPage - 1;
  const [pageSize, setPageSize] = useState(20);

  // 🔹 Refs untuk deteksi perubahan filter
  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef({
    globalFilter,
    filteredStatus,
    filteredZone,
    filteredBin,
    filteredItem,
  });

  // 🔹 Handler Perubahan Halaman (Update URL)
  const handlePageChange = (newPageIndex: number, newSize: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", (newPageIndex + 1).toString());
    setSearchParams(newParams);

    if (newSize !== pageSize) {
      setPageSize(newSize);
    }
  };

  // 🔹 Reset ke halaman 1 HANYA jika filter berubah
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const hasFilterChanged =
      prevFiltersRef.current.globalFilter !== globalFilter ||
      prevFiltersRef.current.filteredStatus !== filteredStatus ||
      prevFiltersRef.current.filteredZone !== filteredZone ||
      prevFiltersRef.current.filteredBin !== filteredBin ||
      prevFiltersRef.current.filteredItem !== filteredItem;

    if (hasFilterChanged) {
      prevFiltersRef.current = {
        globalFilter,
        filteredStatus,
        filteredZone,
        filteredBin,
        filteredItem,
      };

      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", "1");
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter, filteredStatus, filteredZone, filteredBin, filteredItem]);

  // 🔹 Fetch data berdasarkan currentPage dari URL
  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: currentPage,
      limit: pageSize,
      search: globalFilter || "",
      inventory_status: filteredStatus || "",
      warehouse_sub_id: filteredZone || "",
      warehouse_bin_id: filteredBin || "",
      item_id: filteredItem || "",
      sortOrder: "DESC",
      sortBy: "progression_status",
    });
  }, [
    fetchUsingPagination,
    currentPage, // Trigger by URL change
    pageSize,
    globalFilter,
    filteredStatus,
    filteredZone,
    filteredBin,
    filteredItem,
  ]);

  const columns: ColumnDef<InventoryData>[] = useMemo(
    () => [
      { accessorKey: "id", header: "ID", selectedRow: true },
      { accessorKey: "pallet_code", header: "Pallet ID" },
      {
        accessorKey: "item_name",
        header: "Items",
        cell: ({ row }) => {
          const items = (row.original.current_items || []).filter(
            (it) => it.current_quantity !== 0
          );
          if (items.length === 0) return "-";
          return (
            <ul className="space-y-1">
              {items.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="font-medium">{item.item_name}</span>
                  <span>
                    - {item.current_quantity} {item.uom}
                  </span>
                  <span className="font-medium">week {item.week_number}</span>
                </li>
              ))}
            </ul>
          );
        },
      },
      { accessorKey: "warehouse_name", header: "Warehouse" },
      { accessorKey: "warehouse_sub_name", header: "Zone" },
      { accessorKey: "warehouse_bin_name", header: "Bin" },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPage, pageSize]
  );

  const handleViewDetail = (id: any) => {
    navigate(`/inventory/detail`, { state: { invListId: id } });
  };

  const mappedList = useMemo(() => {
    return (list || []).map((item: any, index: number) => ({
      no: pageIndex * pageSize + (index + 1),
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
      current_items: item.pallet?.currentItems || [],
    }));
  }, [list, pageIndex, pageSize]);

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
        onPageChange={handlePageChange}
        onSelectionChange={() => {}}
      />
    </div>
  );
};

export default AdjustTable;

// import { useEffect, useMemo, useState } from "react";
// import { FaEye, FaEdit } from "react-icons/fa";
// import { ColumnDef } from "@tanstack/react-table";
// import TableComponent from "../Table/TableComponent";
// import { useNavigate } from "react-router-dom";
// import StatusBadge from "../../../common/statusBadge";
// import {
//   STATUS_MAP_INVENTORY,
//   STATUS_PROGRESSION_INVENTORY,
// } from "../../../constants/statusMaps";
// import { useStoreInventoryTracking } from "../../../DynamicAPI/stores/Store/MasterStore";

// type InventoryData = {
//   no: number;

//   id: string;
//   createdAt: string;
//   updatedAt: string;
//   deletedAt: string | null;

//   warehouse_id: string;
//   warehouse_name: string;

//   warehouse_sub_id: string;
//   warehouse_sub_name: string;

//   warehouse_bin_id: string | null;
//   warehouse_bin_name: string | null;

//   pallet_id: string;
//   pallet_code: string;
//   pallet_uom: string;
//   pallet_capacity: number;
//   pallet_current_qty: number;

//   inventory_date: string;
//   inventory_status: string;
//   progression_status: string;
//   inventory_note: string;

//   current_items?: {
//     item_id: string;
//     item_name: string;
//     current_quantity: number;
//     uom: string;
//     production_date: string;
//     week_number: number;
//   }[];
// };

// type MenuTableProps = {
//   globalFilter?: string;
//   setGlobalFilter?: (value: string) => void;
//   onDetail?: (id: string) => void;
//   onRefresh?: () => void;
//   filteredStatus?: any;
//   filteredZone?: any;
//   filteredBin?: any;
//   filteredItem?: any;
// };

// const AdjustTable = ({
//   globalFilter,
//   setGlobalFilter,
//   filteredStatus,
//   filteredZone,
//   filteredBin,
//   filteredItem,
// }: MenuTableProps) => {
//   const navigate = useNavigate();
//   const {
//     fetchUsingPagination,
//     list: list,
//     pagination,
//   } = useStoreInventoryTracking();

//   // 🔹 local state pagination
//   const [pageIndex, setPageIndex] = useState(0);
//   const [pageSize, setPageSize] = useState(20);

//   // 🔹 Fetch data setiap kali pagination / search berubah
//   useEffect(() => {
//     if (!fetchUsingPagination) return;
//     fetchUsingPagination({
//       page: pageIndex + 1,
//       limit: pageSize,
//       search: globalFilter || "",
//       inventory_status: filteredStatus || "",
//       warehouse_sub_id: filteredZone || "",
//       warehouse_bin_id: filteredBin || "",
//       item_id: filteredItem || "",
//       sortOrder: "DESC",
//       sortBy: "progression_status",
//     });
//   }, [
//     fetchUsingPagination,
//     pageIndex,
//     pageSize,
//     globalFilter,
//     filteredStatus,
//     filteredZone,
//     filteredBin,
//     filteredItem,
//   ]);

//   const columns: ColumnDef<InventoryData>[] = useMemo(
//     () => [
//       {
//         accessorKey: "id",
//         header: "ID",
//         selectedRow: true,
//       },
//       {
//         accessorKey: "pallet_code",
//         header: "Pallet ID",
//       },
//       {
//         accessorKey: "item_name",
//         header: "Items",
//         cell: ({ row }) => {
//           const items = (row.original.current_items || []).filter(
//             (it) => it.current_quantity !== 0
//           );

//           if (items.length === 0) return "-";

//           return (
//             <ul className="space-y-1">
//               {items.map((item, index) => (
//                 <li
//                   key={index}
//                   className="flex items-center gap-2 text-sm text-gray-700"
//                 >
//                   <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
//                   <span className="font-medium">{item.item_name}</span>
//                   <span>
//                     - {item.current_quantity} {item.uom}
//                   </span>
//                   <span className="font-medium">week {item.week_number}</span>
//                 </li>
//               ))}
//             </ul>
//           );
//         },
//       },

//       {
//         accessorKey: "warehouse_name",
//         header: "Warehouse",
//       },
//       {
//         accessorKey: "warehouse_sub_name",
//         header: "Zone",
//       },
//       {
//         accessorKey: "warehouse_bin_name",
//         header: "Bin",
//       },
//       {
//         accessorKey: "progression_status",
//         header: "Progression Status",
//         cell: ({ row }) => (
//           <StatusBadge
//             status={row.original.progression_status}
//             colorMap={STATUS_PROGRESSION_INVENTORY}
//             variant="solid"
//             size="sm"
//           />
//         ),
//       },
//       {
//         accessorKey: "inventory_status",
//         header: "Status",
//         cell: ({ row }) => (
//           <StatusBadge
//             status={row.original.inventory_status}
//             colorMap={STATUS_MAP_INVENTORY}
//             variant="solid"
//             size="sm"
//           />
//         ),
//       },
//       {
//         id: "actions",
//         header: "Action",
//         cell: ({ row }) => (
//           <div className="flex gap-2">
//             <button
//               onClick={() => handleViewDetail(row.original.id)}
//               className="text-blue-500"
//             >
//               <FaEye />
//             </button>
//           </div>
//         ),
//       },
//     ],
//     []
//   );

//   const handleViewDetail = (id: any) => {
//     navigate(`/inventory/detail`, { state: { invListId: id } });
//   };

//   // Mapping API data to table data
//   const mappedList = (list || []).map((item: any, index: number) => ({
//     no: index + 1,

//     id: item.id,
//     createdAt: item.createdAt || "",
//     updatedAt: item.updatedAt || "",
//     deletedAt: item.deletedAt || null,

//     warehouse_id: item.warehouse_id || "",
//     warehouse_name: item.warehouse?.name || "-",

//     warehouse_sub_id: item.warehouse_sub_id || "",
//     warehouse_sub_name: item.warehouseSub?.name || "-",

//     warehouse_bin_id: item.warehouse_bin_id || null,
//     warehouse_bin_name: item.warehouseBin?.name || null,

//     pallet_id: item.pallet_id || "",
//     pallet_code: item.pallet?.pallet_code || "",
//     pallet_uom: item.pallet?.uom || "",
//     pallet_capacity: item.pallet?.capacity || 0,
//     pallet_current_qty: item.pallet?.currentQuantity || 0,

//     inventory_date: item.inventory_date
//       ? new Date(item.inventory_date).toLocaleDateString("en-GB")
//       : "-",

//     inventory_status: item.inventory_status || "",
//     progression_status: item.progression_status || "",
//     inventory_note: item.inventory_note || "",
//     current_items: item.pallet?.currentItems || [],
//   }));

//   const handleSelectionChange = (selectedIds: string[]) => {
//     // console.log("Selected IDs:", selectedIds);
//     // if (JSON.stringify(selectedIds) !== JSON.stringify(selectedMemoIds)) {
//     //   const filtered = approvedMemos.filter(
//     //     (m) => typeof m.id === "string" && selectedIds.includes(m.id)
//     //   );
//     //   setSelectedMemoIds(selectedIds);
//     //   setSelectedMemos(filtered);
//     // }
//   };

//   return (
//     <div className="flex flex-col gap-4">
//       <TableComponent
//         data={mappedList}
//         columns={columns}
//         globalFilter={globalFilter}
//         setGlobalFilter={setGlobalFilter}
//         pageSize={pageSize}
//         pageIndex={pageIndex}
//         totalPages={pagination.totalPages}
//         onPageChange={(page, size) => {
//           setPageIndex(page);
//           setPageSize(size);
//         }}
//         onSelectionChange={handleSelectionChange}
//       />
//     </div>
//   );
// };

// export default AdjustTable;
