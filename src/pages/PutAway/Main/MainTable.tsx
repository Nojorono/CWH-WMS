import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../components/form/input/InputField";
import AdjustTable from "./AdjustTable";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import { FaPlus } from "react-icons/fa";
import { useDebounce } from "../../../helper/useDebounce";
import { useStorePutAway } from "../../../DynamicAPI/stores/Store/MasterStore";

const MainTable = () => {
  const navigate = useNavigate();
  const { fetchAll, list } = useStorePutAway();

  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);

  // Mapping API data to table-friendly shape
  const mappedList = (list || []).map((item: any) => {
    const inventory = item.inventoryTracking || {};
    const pallet = inventory.pallet || {};
    const sourceSub = inventory.warehouseSub || {};
    const destinationBin = item.destinationBin || {};
    const destinationSub = destinationBin.warehouseSub || {};

    // Map palletItems for detail display
    const palletItems = (item.palletItems || []).map((pi: any) => ({
      itemId: pi.item_id || pi.id || "-",
      itemName: pi.item_name || pi.name || "-",
      currentQuantity: Number(pi.current_quantity) || 0,
      uom: pi.uom || "-",
      lastUpdated: pi.last_updated || null,
      productionDate: pi.production_date || null,
      weekNumber: pi.week_number ?? null,
    }));

    const totalSku = palletItems.length;
    const totalQty = palletItems.reduce(
      (sum: number, pi: any) => sum + (Number(pi.currentQuantity) || 0),
      0
    );

    return {
      // --- Metadata ---
      id: item.id,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,

      // --- Source (Inventory Tracking) ---
      inventoryTrackingId: inventory.id || item.inventory_tracking_id || "-",
      inventoryDate: inventory.inventory_date || null,
      inventoryStatus: inventory.inventory_status || "-",
      progressionStatus: inventory.progression_status || "-",
      inventoryNote: inventory.inventory_note || "-",

      // --- Source Warehouse Info ---
      sourceWarehouseId: inventory.warehouse_id || "-",
      sourceWarehouseSubId: inventory.warehouse_sub_id || "-",
      sourceWarehouseSubName: sourceSub.name || "-",
      sourceWarehouseSubCode: sourceSub.code || "-",
      sourceWarehouseSubDesc: sourceSub.description || "-",
      sourceWarehouseSubIsStaging: sourceSub.is_staging || "-",
      sourceBinCode: inventory.bin_code || "-",

      // --- Source Pallet Info ---
      palletId: pallet.id || inventory.pallet_id || "-",
      palletCode: pallet.pallet_code || "-",
      palletCapacity: pallet.capacity ?? 0,
      palletCurrentQuantity: Number(pallet.currentQuantity) || 0,
      palletUom: pallet.uom || "-",
      palletIsFull: pallet.isFull ?? false,
      palletQrUrl: pallet.qr_image_url || null,

      // --- Destination Info ---
      destinationBinId: item.destination_bin_id || "-",
      destinationBinCode: destinationBin.code || "-",
      destinationBinName: destinationBin.name || "-",
      destinationBinDesc: destinationBin.description || "-",
      destinationBinCapacity: destinationBin.capacity_pallet ?? 0,
      destinationBinQrUrl: destinationBin.barcode_image_url || null,

      destinationWarehouseSubId: destinationSub.id || "-",
      destinationWarehouseSubName: destinationSub.name || "-",
      destinationWarehouseSubCode: destinationSub.code || "-",
      destinationWarehouseSubDesc: destinationSub.description || "-",

      // --- Driver / Forklift ---
      forkliftDriverId: item.forklift_driver_id || "-",
      driverName: item.driver_name || "-",
      driverPhone: item.driver_phone || "-",

      // --- Status / Notes ---
      status: item.status || "-",
      notes: item.notes || "-",

      // --- Summary Info ---
      totalSku,
      totalQty,
      palletItemUom: palletItems.length > 0 ? palletItems[0].uom : "-",

      // --- Detail Items ---
      palletItems,
    };
  });

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleResetFilters = () => {
    setGlobalFilter("");
    // Reset filter lain jika ada
  };

  const handleDetail = (id: any) => {
    navigate(`/putaway/detail/${id}`);
  };

  const handleCreate = () => {
    navigate("/putaway/process", {
      state: { data: [], mode: "create", title: "Create Inbound Planning" },
    });
  };

  const handleFetchParams = () => {
    // Implementasi fetch dengan parameter filter jika diperlukan
  };  

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="flex justify-between items-center">
          <div className="space-x-4">
            <Label htmlFor="search">Search</Label>
            <Input
              onChange={(e) => setGlobalFilter(e.target.value)}
              type="text"
              id="search"
              placeholder="🔍 Masukan data.."
              value={globalFilter}
            />
          </div>

          <div className="space-x-4">
            <Button
              size="sm"
              variant="primary"
              startIcon={<FaPlus className="size-5" />}
              onClick={handleCreate}
            >
              Create Put Away
            </Button>
          </div>
        </div>
      </div>

      <AdjustTable
        data={mappedList}
        globalFilter={debouncedFilter}
        setGlobalFilter={setGlobalFilter}
        onDetail={handleDetail}
        onRefresh={handleFetchParams}
      />
    </>
  );
};

export default MainTable;
