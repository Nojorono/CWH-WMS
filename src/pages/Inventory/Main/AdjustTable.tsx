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
import TabsSection from "../../../components/wms-components/inbound-component/tabs/TabsSection";

// --- Sub-Component untuk Menangani Detail SKU (Dipisahkan Logicnya) ---
const InventoryContentCell = ({
  items,
  type,
}: {
  items: any[];
  type: "good" | "bad";
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0)
    return <span className="text-gray-400 italic text-xs">tidak ada item</span>;

  // Untuk bad stock: tampilkan langsung tanpa expand
  if (type === "bad") {
    return (
      <div className="flex flex-col gap-2 w-full min-w-[300px] py-2">
        {items.map((bad, idx) => (
          <div
            key={`bad-${idx}`}
            className="flex flex-col bg-red-50 p-2 rounded border border-red-100 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FaExclamationTriangle className="text-red-500" size={12} />
                <span className="text-[12px] font-bold text-red-700 leading-tight">
                  {bad.item_name}
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
                  BAD STOCK
                </span>
              </div>
              <div className="flex gap-2 text-[11px] text-red-500 font-mono">
                <span>Year: {bad.year || "-"}</span>
                <span>HJE: {bad.hje || "-"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Untuk good stock: tetap gunakan expand/collapse
  return (
    <div className="flex flex-col gap-1 w-full min-w-[300px] py-2">
      {/* Header Ringkasan */}
      <div
        onClick={() => items.length > 0 && setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
          isExpanded
            ? "bg-blue-50 border-blue-200 shadow-inner"
            : "bg-gray-50 border-gray-100 hover:border-blue-300 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="bg-blue-500 p-1.5 rounded-md text-white shadow-sm">
            <FaLayerGroup size={12} />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-gray-700">
              {items.length} SKU (Good)
            </span>
          </div>
        </div>
        <div className="text-gray-400">
          {isExpanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
        </div>
      </div>
      {isExpanded && (
        <div className="mt-2 flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {items.map((item, idx) => (
            <div
              key={`good-${idx}`}
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
  filteredPallet?: any;
};

const AdjustTable = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
  filteredZone,
  filteredBin,
  filteredItem,
  filteredPallet,
}: MenuTableProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchUsingPagination, list, pagination } =
    useStoreInventoryTracking();

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageIndex = currentPage - 1;
  const [pageSize, setPageSize] = useState<number>(20);

  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef({
    globalFilter,
    filteredStatus,
    filteredZone,
    filteredBin,
    filteredItem,
    filteredPallet
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
      prevFiltersRef.current.filteredZone !== filteredZone ||
      prevFiltersRef.current.filteredBin !== filteredBin ||
      prevFiltersRef.current.filteredItem !== filteredItem ||
      prevFiltersRef.current.filteredPallet !== filteredPallet;
    if (hasFilterChanged) {
      prevFiltersRef.current = {
        globalFilter,
        filteredStatus,
        filteredZone,
        filteredBin,
        filteredItem,
        filteredPallet
      };
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", "1");
      setSearchParams(newParams, { replace: true });
    }
  }, [globalFilter, filteredStatus, filteredZone, filteredBin, filteredItem, filteredPallet]);

  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: currentPage,
      limit: pageSize,
      search: globalFilter,
      inventory_status: filteredStatus || "",
      warehouse_sub_id: filteredZone || "",
      warehouse_bin_id: filteredBin || "",
      item_id: filteredItem || "",
      sortOrder: "DESC",
      sortBy: "progression_status",
      pallet_id: filteredPallet || "",
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
    filteredPallet,
  

  ]);

  // Transformasi Data
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
      // Filter items yang qty > 0 saja
      // current_items: (item.pallet?.currentItems || []).filter(
      //   (i: any) => i.current_quantity > 0,
      // ),
      current_items: item.pallet?.currentItems || [],
      bad_inventory: (item.inventoryTrackingBad || [])
        .filter((b: any) => b.quantity > 0)
        .map((bad: any) => ({
          ...bad,
          item_name: bad.item_name || bad.item_id,
        })),
    }));
  }, [list, pageIndex, pageSize]);

  // Pisahkan Data untuk masing-masing Tab
  const goodStockData = useMemo(
    () => mappedList.filter((item) => item.current_items.length > 0),
    // () => mappedList,
    [mappedList],
  );

  console.log("mappedList",mappedList);
  

  const badStockData = useMemo(
    () => mappedList.filter((item) => item.bad_inventory.length > 0),
    [mappedList],
  );

  const createColumns = (type: "good" | "bad"): ColumnDef<any>[] => {
    const columns: ColumnDef<any>[] = [];

    // Hanya tampilkan kolom Pallet ID jika type === "good"
    if (type === "good") {
      columns.push(
        {
          accessorKey: "pallet_code",
          header: "Pallet ID",
          cell: ({ row }) => (
            <span className="font-extrabold text-gray-900 tracking-tight">
              {row.original.pallet_code}
            </span>
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
      );
    }

    columns.push(
      {
        header: "Inventory Details (SKU)",
        cell: ({ row }) => (
          <InventoryContentCell
            items={
              type === "good"
                ? row.original.current_items
                : row.original.bad_inventory
            }
            type={type}
          />
        ),
      },
      {
        header: "Location",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 w-fit">
              {row.original.warehouse_sub_name}
            </span>
            <span className="text-[12px] text-gray-500 font-medium italic">
              Bin: {row.original.warehouse_bin_name || "-"}
            </span>
          </div>
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
            className="p-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          >
            <FaEye size={18} />
          </button>
        ),
      },
    );

    return columns;
  };

  
  return (
    <div className="flex flex-col gap-4">
      <TabsSection
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          {
            label: "Good Stock",
            content: (
              <div className="w-full overflow-x-auto mb-5">
                <TableComponent
                  data={goodStockData}
                  columns={createColumns("good")}
                  globalFilter={globalFilter}
                  setGlobalFilter={setGlobalFilter}
                  pageSize={pageSize}
                  pageIndex={pageIndex}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  onSelectionChange={() => {}}
                />
              </div>
            ),
          },
          {
            label: "Bad Stock",
            content: (
              <div className="w-full overflow-x-auto mb-5">
                <TableComponent
                  data={badStockData}
                  columns={createColumns("bad")}
                  globalFilter={globalFilter}
                  setGlobalFilter={setGlobalFilter}
                  pageSize={pageSize}
                  pageIndex={pageIndex}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  onSelectionChange={() => {}}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default AdjustTable;
