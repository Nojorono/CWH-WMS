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
import { FaSync, FaUndo } from "react-icons/fa";
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

  const hasActiveFilters = Boolean(
    globalFilter ||
    selectedIO ||
    selectedWH ||
    selectedZone ||
    selectedBin ||
    selectedStatus ||
    selectedItem ||
    selectedPallet,
  );

  const handleResetFilters = () => {
    setGlobalFilter("");
    setSelectedIO("");
    setSelectedWH("");
    setSelectedZone("");
    setSelectedBin("");
    setSelectedStatus("");
    setSelectedItem("");
    setSelectedPallet("");
    setListWarehouse([]);
  };

  // Buat fungsi refresh handler
  const handleRefresh = () => {
    if (!fetchUsingPagination) return;

    fetchUsingPagination({
      page: 1,
      limit: 20,
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
      {/* CONTAINER FILTER UTAMA */}
      <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl mb-6">
        {/* BAGIAN ATAS: SEARCH DAN REFRESH */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <span className="text-sm">🔍</span>
            </div>
            <Input
              onChange={(e) => setGlobalFilter(e.target.value)}
              type="text"
              id="search"
              placeholder="Cari data di sini..."
              value={globalFilter}
              className="pl-9 w-full bg-gray-50/50 border-gray-200 focus:bg-white transition-all rounded-lg text-sm"
            />
          </div>

          <Button
            variant="action"
            size="sm"
            onClick={handleRefresh}
            className="shadow-sm hover:shadow active:scale-98 transition-all flex items-center gap-2 px-4 py-2"
          >
            <FaSync className="text-xs animate-hover-spin" />
            <span className="font-medium">Refresh</span>
          </Button>
        </div>

        {/* PEMISAH DEKORATIF */}
        <hr className="border-gray-100 my-4" />

        {/* BAGIAN BAWAH: PANEL CONTROL FILTER */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 bg-indigo-600 rounded-full"></span>
              <Label className="mb-0 text-xs font-bold uppercase tracking-wider text-gray-500">
                Filter Pencarian
              </Label>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              startIcon={<FaUndo className="text-xs" />}
              className={`text-xs font-medium transition-all rounded-lg ${
                hasActiveFilters
                  ? "text-red-600 border-red-200 bg-red-50/50 hover:bg-red-50"
                  : "text-gray-400 border-gray-100 bg-gray-50"
              }`}
            >
              Reset Filter
            </Button>
          </div>

          {/* INPUT GRID BANYAK KOLOM - LEBIH ADAPTIF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isGlobalUser && (
              <>
                <div className="flex flex-col space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">
                    Organization/IO
                  </Label>
                  <Select
                    options={ioOptions}
                    onChange={setSelectedIO}
                    value={selectedIO}
                    width="100%"
                    className="rounded-lg text-sm border-gray-200"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">
                    Warehouse
                  </Label>
                  <Select
                    options={optWarehouse}
                    onChange={setSelectedWH}
                    value={selectedWH}
                    width="100%"
                    disabled={!selectedIO}
                    className="rounded-lg text-sm border-gray-200 disabled:bg-gray-50"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">
                Status
              </Label>
              <Select
                options={optStatus}
                onChange={setSelectedStatus}
                value={selectedStatus}
                width="100%"
                className="rounded-lg text-sm border-gray-200"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">
                Zone
              </Label>
              <Select
                options={optZone}
                onChange={setSelectedZone}
                value={selectedZone}
                width="100%"
                disabled={isGlobalUser && !selectedWH}
                className="rounded-lg text-sm border-gray-200 disabled:bg-gray-50"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">BIN</Label>
              <Select
                options={optBin}
                onChange={setSelectedBin}
                value={selectedBin}
                width="100%"
                disabled={!selectedZone}
                className="rounded-lg text-sm border-gray-200 disabled:bg-gray-50"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">
                Pallet
              </Label>
              <Select
                options={optPallet}
                onChange={setSelectedPallet}
                value={selectedPallet}
                width="100%"
                className="rounded-lg text-sm border-gray-200"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">
                Item
              </Label>
              <Select
                options={optItems}
                onChange={setSelectedItem}
                value={selectedItem}
                width="100%"
                className="rounded-lg text-sm border-gray-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* AREA HASH / TABEL DATA */}
      {canShowTable ? (
        <div className="transition-all duration-300 ease-in-out animate-fade-in">
          <AdjustTable
            globalFilter={debouncedFilter}
            filteredIO={selectedIO}
            filteredWarehouse={selectedWH}
            filteredStatus={selectedStatus}
            filteredZone={selectedZone}
            filteredBin={selectedBin}
            filteredItem={selectedItem}
            filteredPallet={selectedPallet}
          />
        </div>
      ) : (
        /* EMPTY STATE YANG SENADA DAN BERSIH */
        <div className="p-16 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl text-center transition-all">
          <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 mb-4 border border-gray-100">
            🏢
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Data Belum Siap Ditampilkan
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Silahkan pilih **Organization/IO** terlebih dahulu untuk memuat data
            gudang dan manajemen stok.
          </p>
        </div>
      )}
    </>
  );
};

export default MainTable;
