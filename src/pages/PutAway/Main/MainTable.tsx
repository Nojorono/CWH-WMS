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
    const destinationBin = item.destinationBin || {};
    const warehouseSub = inventory.warehouseSub || {};

    const totalSku = (item.palletItems || []).length;
    const totalQty = (item.palletItems || []).reduce(
      (sum: number, pi: any) => sum + (Number(pi.current_quantity) || 0),
      0
    );

    return {
      // raw ids / timestamps
      id: item.id,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,

      // inbound / inventory tracking
      inventory_tracking_id: item.inventory_tracking_id,
      inboundId: item.inventory_tracking_id || "-",
      inventoryDate: inventory.inventory_date || null,
      inventoryStatus: inventory.inventory_status || "-",
      progressionStatus: inventory.progression_status || "-",

      // pallet info
      palletId: pallet.id || inventory.pallet_id || "-",
      palletCode: pallet.pallet_code || "-",
      palletCurrentQuantity: pallet.currentQuantity ?? 0,
      palletUom: pallet.uom || "-",

      // warehouse / bin
      warehouseSubId: inventory.warehouse_sub_id || "-",
      warehouseSubName: warehouseSub.name || "-",
      warehouse_bin_id: inventory.warehouse_bin_id || item.destination_bin_id || "-",
      destination_bin_id: item.destination_bin_id,
      suggestZone: destinationBin.name || "-",
      suggestBin: destinationBin.code || "-",

      // driver / forklift
      forklift_driver_id: item.forklift_driver_id || "-",
      driver_name: item.driver_name || "-",
      driver_phone: item.driver_phone || "-",
      forkliftDriver: item.driver_name || "-",

      // status / notes
      status: item.status || "-",
      notes: item.notes || "-",

      // pallet items summary (for table columns)
      palletItems: item.palletItems || [],
      totalSku,
      totalQty,
    };
  });

  console.log("Mapped PutAway list data:", mappedList);
  

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
