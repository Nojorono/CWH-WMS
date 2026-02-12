import { useEffect, useMemo, useState, useRef } from "react";
import {
  FaEye,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaLayerGroup,
} from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../Table/TableComponent";
import { useNavigate, useSearchParams } from "react-router-dom";
import StatusBadge from "../../../common/statusBadge";
import {
  STATUS_MAP_INVENTORY,
  STATUS_PROGRESSION_INVENTORY,
} from "../../../constants/statusMaps";
import { useStoreInventoryTracking } from "../../../DynamicAPI/stores/Store/MasterStore";
import WarehouseMapView from "./LayoutWH";

// --- Sub-Component untuk Menangani 10+ Varian Item (Normal & Bad Stock) ---
const InventoryContentCell = ({
  items,
  badInventory,
}: {
  items: any[];
  badInventory: any[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter hanya item dengan qty > 0
  const filteredItems = (items || []).filter(
    (item) => item.current_quantity > 0,
  );
  const filteredBad = (badInventory || []).filter((bad) => bad.quantity > 0);

  const totalNormal = filteredItems.length;
  const totalBad = filteredBad.length;
  const totalVariants = totalNormal + totalBad;

  if (totalVariants === 0)
    return <span className="text-gray-400 italic text-xs">tidak ada item</span>;

  return (
    <div className="flex flex-col gap-1 w-full min-w-[300px] py-2">
      {/* Header Ringkasan: Menampilkan akumulasi SKU */}
      <div
        onClick={() => totalVariants > 0 && setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
          isExpanded
            ? "bg-blue-50 border-blue-200 shadow-inner"
            : "bg-gray-50 border-gray-100 hover:border-blue-300 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`${
              totalBad > 0 ? "bg-amber-500" : "bg-blue-500"
            } p-1.5 rounded-md text-white shadow-sm`}
          >
            <FaLayerGroup size={12} />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-gray-700">
              {totalVariants} SKU
            </span>
          </div>
        </div>
        <div className="text-gray-400">
          {isExpanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
        </div>
      </div>

      {/* Area Detail yang bisa di-Collapse */}
      {isExpanded && (
        <div className="mt-2 flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {/* Loop Item Normal */}
          {filteredItems.map((item, idx) => (
            <div
              key={`normal-${idx}`}
              className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 shadow-sm"
            >
              <div className="flex flex-col">
                <span className="text-[12px] font-semibold text-gray-800 leading-tight">
                  {item.item_name}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  Week {item.week_number}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[12px] font-bold text-blue-600">
                  {item.current_quantity}
                </span>
                <span className="text-[10px] ml-1 text-gray-400 font-medium uppercase">
                  {item.uom}
                </span>
              </div>
            </div>
          ))}

          {/* Loop Item Rusak (Bad Inventory) */}
          {filteredBad.map((bad, idx) => (
            <div
              key={`bad-${idx}`}
              className="flex flex-col bg-red-50 p-2 rounded border border-red-100 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FaExclamationTriangle className="text-red-500" size={12} />
                  <span className="text-[12px] font-bold text-red-700 leading-tight">
                    {bad.item_id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-bold text-red-700">
                    {bad.quantity}
                  </span>
                  <span className="text-[10px] ml-1 text-red-600 uppercase font-medium">
                    {bad.uom}
                  </span>
                </div>
              </div>
              <div className="mt-1 pt-1 border-t border-red-100 flex flex-col gap-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-red-800 font-medium italic truncate max-w-[180px]">
                    "{bad.notes || "No notes"}"
                  </span>
                  <span className="text-red-400 font-bold uppercase tracking-tighter">
                    DAMAGED STOCK
                  </span>
                </div>
                <div className="flex gap-2 text-[13px] text-red-500 font-mono">
                  <span>Year: {bad.year || "-"}</span>
                  <span>HJE: {bad.hje || "-"}</span>
                  <span>
                    Produ:{" "}
                    {bad.production_date
                      ? new Date(bad.production_date).toLocaleDateString(
                          "id-ID",
                        )
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

type MenuTableProps = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  filteredStatus?: any;
  filteredZone?: any;
  filteredBin?: any;
  filteredItem?: any;
};

type InventoryData = {
  no: number;
  id: string;
  warehouse_sub_name: string;
  warehouse_bin_name: string | null;
  pallet_code: string;
  inventory_status: string;
  progression_status: string;
  current_items: any[];
  bad_inventory: any[];
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

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageIndex = currentPage - 1;
  const [pageSize, setPageSize] = useState(20);

  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef({
    globalFilter,
    filteredStatus,
    filteredZone,
    filteredBin,
    filteredItem,
  });

  const handlePageChange = (newPageIndex: number, newSize: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", (newPageIndex + 1).toString());
    setSearchParams(newParams);
    if (newSize !== pageSize) setPageSize(newSize);
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const hasFilterChanged =
      prevFiltersRef.current.globalFilter !== globalFilter ||
      prevFiltersRef.current.filteredStatus !== filteredStatus ||
      prevFiltersRef.current.filteredZone !== filteredZone;
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
  }, [globalFilter, filteredStatus, filteredZone, filteredBin, filteredItem]);

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
    currentPage,
    pageSize,
    globalFilter,
    filteredStatus,
    filteredZone,
    filteredBin,
    filteredItem,
  ]);

  const mappedList = useMemo(() => {
    return (list || []).map((item: any, index: number) => ({
      no: pageIndex * pageSize + (index + 1),
      id: item.id,
      warehouse_sub_name: item.warehouseSub?.name || "-",
      warehouse_bin_name: item.warehouseBin?.name || null,
      pallet_code: item.pallet?.pallet_code ? (
        item.pallet.pallet_code
      ) : (
        <span className="text-red-600 font-bold">NO-PALLET</span>
      ),
      inventory_status: item.inventory_status || "",
      progression_status: item.progression_status || "",
      current_items: item.pallet?.currentItems || [],
      bad_inventory: Array.isArray(item.inventoryTrackingBad)
        ? item.inventoryTrackingBad.map((bad: any) => ({
            item_id: bad.item_id,
            item_name: bad.item_name || bad.item_id,
            quantity: bad.quantity,
            uom: bad.uom,
            production_date: bad.production_date,
            year: bad.year,
            hje: bad.hje,
            notes: bad.notes,
          }))
        : [],
    }));
  }, [list, pageIndex, pageSize]);

  const columns: ColumnDef<InventoryData>[] = useMemo(
    () => [
      {
        accessorKey: "pallet_code",
        header: "Pallet ID",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-extrabold text-gray-900 tracking-tight">
              {row.original.pallet_code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "item_name",
        header: "Inventory Details (SKU)",
        cell: ({ row }) => (
          <InventoryContentCell
            items={row.original.current_items}
            badInventory={row.original.bad_inventory}
          />
        ),
      },
      {
        header: "Location",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold text-gray-700 bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100 w-fit">
              {row.original.warehouse_sub_name}
            </span>
            <span className="text-[14px] text-gray-500 font-medium px-2 italic">
              Bin: {row.original.warehouse_bin_name || "-"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "progression_status",
        header: "Progress",
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
            variant="light"
            size="sm"
          />
        ),
      },
      {
        id: "actions",
        header: "View",
        cell: ({ row }) => (
          <button
            onClick={() =>
              navigate(`/inventory/detail`, {
                state: { invListId: row.original.id },
              })
            }
            className="p-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <FaEye size={18} />
          </button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="flex flex-col gap-4">
      <WarehouseMapView data={mappedList} />

      <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white p-2">
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
    </div>
  );
};

export default AdjustTable;
