import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStoreInventoryTracking } from "../../../DynamicAPI/stores/Store/MasterStore";
import WarehouseMapView from "./LayoutWH";

type MenuTableProps = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  filteredStatus?: any;
  filteredZone?: any;
  filteredBin?: any;
  filteredItem?: any;
};

const MainView = ({}: MenuTableProps) => {
  const { fetchUsingPagination, list } =
    useStoreInventoryTracking();

  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: 1,
      sortOrder: "DESC",
      sortBy: "progression_status",
    });
  }, [fetchUsingPagination]);

  const mappedList = useMemo(() => {
    return (list || []).map((item: any, index: number) => ({
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
  }, [list]);

  return (
    <div className="flex flex-col gap-4">
      <WarehouseMapView data={mappedList} />
    </div>
  );
};

export default MainView;
