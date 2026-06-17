import { useEffect, useMemo, useState } from "react";
import Input from "../../../components/form/input/InputField";
import AdjustTable from "./AdjustTable";
import Label from "../../../components/form/Label";
import { useDebounce } from "../../../helper/useDebounce";
import {
  useStoreBinByZone,
  useStoreItem,
  useStorePallet,
  useStoreZoneByWarehouse,
  useStoreSubWarehouse,
  useStoreInventoryTracking,
} from "../../../DynamicAPI/stores/Store/MasterStore";
import Select from "../../../components/form/Select";
import axiosInstance from "../../../DynamicAPI/AxiosInstance";
import Button from "../../../components/ui/button/Button";
import { FaSync } from "react-icons/fa";
import { usePersistAuthStore } from "../../../API/store/AuthStore/PersistAuthStore";

const MainTable = () => {
  const ioList = usePersistAuthStore((state) => state.ioList);
  const user = usePersistAuthStore((state) => state.user);
  
  const userDetail = user?.userDetail || null;
  const isGlobalUser = !userDetail;

  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);

  // States
  const [selectedIO, setSelectedIO] = useState<any>("");
  const [selectedWH, setSelectedWH] = useState<any>("");
  const [selectedZone, setSelectedZone] = useState<any>("");
  const [selectedBin, setSelectedBin] = useState<any>("");
  const [selectedStatus, setSelectedStatus] = useState<any>("");
  const [selectedItem, setSelectedItem] = useState<any>("");
  const [selectedPallet, setSelectedPallet] = useState<any>("");

  const [listWarehouse, setListWarehouse] = useState<any[]>([]);

  // Stores
  const { fetchAll: fetchAllZone, list: listZone } = useStoreSubWarehouse();
  const { fetchById: fetchZoneByWH, detail: WHdetail } =
    useStoreZoneByWarehouse();
  const { fetchAll: fetchAllItem, list: listItems } = useStoreItem();
  const { fetchById: fetchBinById, detail: listBins } = useStoreBinByZone();
  const { fetchAll: fetchAllPallet, list: listPallets } = useStorePallet();
  const { fetchUsingPagination } = useStoreInventoryTracking();

  useEffect(() => {
    if (!isGlobalUser) {
      fetchAllZone();
    }
    fetchAllItem();
    fetchAllPallet();
  }, [isGlobalUser]);

  // Fetch Warehouse by IO
  useEffect(() => {
    const getWarehouseByIO = async () => {
      if (isGlobalUser && selectedIO !== "") {
        try {
          const response = await axiosInstance.get(
            `/master-warehouse/organization/${selectedIO}`,
          );
          if (response.data.success) {
            setListWarehouse(response.data.data);
          }
        } catch (error) {
          console.error("Error fetching warehouse:", error);
        }
      }
    };
    getWarehouseByIO();
    setSelectedWH("");
    setSelectedZone("");
    setSelectedBin("");
  }, [selectedIO, isGlobalUser]);

  // Fetch Zone by WH
  useEffect(() => {
    if (selectedWH !== "") {
      fetchZoneByWH(selectedWH);
      setSelectedZone("");
      setSelectedBin("");
    }
  }, [selectedWH]);

  // Fetch Bin by Zone
  useEffect(() => {
    if (selectedZone !== "") {
      fetchBinById(selectedZone);
    }
  }, [selectedZone]);

  const ioOptions = useMemo(() => {
    if (!ioList || ioList.length === 0) {
      return [{ value: "", label: "All Organization" }];
    }

    return [
      { value: "", label: "All Organization" },
      ...ioList.map((item: any) => ({
        value: item.id,
        label: `${item.organization_name} - ${item.organization_code}`,
      })),
    ];
  }, [ioList]);

  const optWarehouse = [
    { value: "", label: "Select Warehouse" },
    ...listWarehouse.map((wh) => ({ value: wh.id, label: wh.name })),
  ];

  const zoneDataSource = isGlobalUser
    ? Array.isArray(WHdetail)
      ? WHdetail
      : []
    : listZone;
  const optZone = [
    { value: "", label: "All Zone" },
    ...zoneDataSource.map((zone: any) => ({
      value: zone.id,
      label: zone.code,
    })),
  ];

  const optBin = [
    { value: "", label: "All Bin" },
    ...(Array.isArray(listBins) ? listBins : []).map((bin: any) => ({
      value: bin.id,
      label: bin.code,
    })),
  ];

  const optPallet = [
    { value: "", label: "All Pallet" },
    ...listPallets.map((p) => ({ value: String(p.id), label: p.pallet_code })),
  ];

  const optItems = [
    { value: "", label: "All Item" },
    ...listItems.map((item) => ({ value: String(item.id), label: item.sku })),
  ];

  const optStatus = [
    { value: "", label: "All Status" },
    { value: "INSPECTION_COMPLETED", label: "INSPECTION_COMPLETED" },
    { value: "IN_INVENTORY", label: "IN_INVENTORY" },
  ];

  const canShowTable = !isGlobalUser || (selectedIO && selectedWH);

  // Buat fungsi refresh handler
  const handleRefresh = () => {
    if (!fetchUsingPagination) return;

    // Panggil kembali dengan parameter state saat ini yang ada di komponen induk
    fetchUsingPagination({
      page: 1, // atau sesuaikan dengan state page saat ini
      limit: 20,
      search: globalFilter,
      inventory_status: selectedStatus || "",
      warehouse_id: selectedWH || "",
      warehouse_sub_id: selectedZone || "",
      warehouse_bin_id: selectedBin || "",
      item_id: selectedItem || "",
      sortOrder: "DESC",
      sortBy: "progression_status",
      pallet_id: selectedPallet || "",
    });
  };

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="mb-4 w-full md:w-1/3">
          <div className="flex items-center gap-2">
            {/* <Label htmlFor="search">Search</Label> */}
            <Input
              onChange={(e) => setGlobalFilter(e.target.value)}
              type="text"
              id="search"
              placeholder="🔍 Masukan data.."
              value={globalFilter}
            />

            <Button variant="action" size="sm" onClick={handleRefresh}>
              <FaSync className="mr-2" /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
          {isGlobalUser && (
            <>
              <div className="flex flex-col space-y-1">
                <Label>Organization/IO</Label>
                <Select
                  options={ioOptions}
                  onChange={setSelectedIO}
                  value={selectedIO}
                  width="100%"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <Label>Warehouse</Label>
                <Select
                  options={optWarehouse}
                  onChange={setSelectedWH}
                  value={selectedWH}
                  width="100%"
                  disabled={!selectedIO}
                />
              </div>
            </>
          )}

          <div className="flex flex-col space-y-1">
            <Label>Status</Label>
            <Select
              options={optStatus}
              onChange={setSelectedStatus}
              value={selectedStatus}
              width="100%"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <Label>Zone</Label>
            <Select
              options={optZone}
              onChange={setSelectedZone}
              value={selectedZone}
              width="100%"
              disabled={isGlobalUser && !selectedWH}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <Label>BIN</Label>
            <Select
              options={optBin}
              onChange={setSelectedBin}
              value={selectedBin}
              width="100%"
              disabled={!selectedZone}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <Label>Pallet</Label>
            <Select
              options={optPallet}
              onChange={setSelectedPallet}
              value={selectedPallet}
              width="100%"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <Label>Item</Label>
            <Select
              options={optItems}
              onChange={setSelectedItem}
              value={selectedItem}
              width="100%"
            />
          </div>
        </div>
      </div>

      {/* TAMPILKAN TABEL HANYA JIKA SYARAT TERPENUHI */}
      {canShowTable ? (
        <AdjustTable
          globalFilter={debouncedFilter}
          setGlobalFilter={setGlobalFilter}
          filteredIO={selectedIO}
          filteredWarehouse={selectedWH}
          filteredStatus={selectedStatus}
          filteredZone={selectedZone}
          filteredBin={selectedBin}
          filteredItem={selectedItem}
          filteredPallet={selectedPallet}
        />
      ) : (
        <div className="p-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400">
          <p className="text-lg font-medium">
            Silahkan pilih Organization dahulu.
          </p>
        </div>
      )}
    </>
  );
};

export default MainTable;
