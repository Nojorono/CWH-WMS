import { useEffect, useState } from "react";
import Input from "../../../components/form/input/InputField";
import AdjustTable from "./AdjustTable";
import Label from "../../../components/form/Label";
import { useDebounce } from "../../../helper/useDebounce";

import {
  useStoreSubWarehouse,
  useStoreBinByZone,
  useStoreItem,
} from "../../../DynamicAPI/stores/Store/MasterStore";
import Select from "../../../components/form/Select";


const MainTable = () => {
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);
  const [selectedStatus, setSelectedStatus] = useState<any>("");
  const [selectedZone, setSelectedZone] = useState<any>("");
  const [selectedBin, setSelectedBin] = useState<any>("");
  const [selectedItem, setSelectedItem] = useState<any>("");

  const { fetchAll, list: listZone } = useStoreSubWarehouse();
  const { fetchAll: fetchAllItem, list: listItems } = useStoreItem();
  const { fetchById: fetchBinById, detail: listBins } = useStoreBinByZone();

  useEffect(() => {
    fetchAll();
    fetchAllItem();
  }, []);

  useEffect(() => {
    if (selectedZone !== "") {
      fetchBinById(selectedZone);
    }
  }, [fetchBinById, selectedZone]);

  const optStatus = [
    { value: "", label: "All Status" },
    { value: "INSPECTION_COMPLETED", label: "INSPECTION_COMPLETED" },
    { value: "IN_INVENTORY", label: "IN_INVENTORY" },
  ];

  const optZone = [
    { value: "", label: "All Zone" },
    ...listZone.map((zone) => ({
      value: zone.id,
      label: zone.code,
    })),
  ];

  const itemsOnly = listItems.map(({ id, sku }) => ({ id: String(id), sku }));
  const optItems = [
    { value: "", label: "All Item" },
    ...itemsOnly.map((item) => ({ value: item.id, label: item.sku })),
  ];

  const safeBins = Array.isArray(listBins) ? listBins : [];
  const optBin = [
    { value: "", label: "All Bin" },
    ...safeBins.map((bin) => ({ value: bin.id, label: bin.code })),
  ];

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="flex justify-between items-center">
          <div className="mb-4">
            <Label htmlFor="search">Search</Label>
            <Input
              onChange={(e) => setGlobalFilter(e.target.value)}
              type="text"
              id="search"
              placeholder="🔍 Masukan data.."
              value={globalFilter}
              width={"100px"}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="space-x-3">
            <Label htmlFor="status">Status</Label>
            <Select
              options={optStatus}
              placeholder="Select Status"
              onChange={(value) => setSelectedStatus(value)}
              value={selectedStatus}
              width={"200px"}
            />
          </div>

          <div className="space-x-3">
            <Label htmlFor="status">Zone</Label>
            <Select
              options={optZone}
              placeholder="Pilih Zone"
              onChange={(value) => setSelectedZone(value)}
              value={selectedZone}
              width={"200px"}
            />
          </div>

          <div className="space-x-3">
            <Label htmlFor="status">BIN</Label>
            <Select
              options={optBin}
              placeholder="Pilih Bin"
              onChange={(value) => setSelectedBin(value)}
              value={selectedBin}
              width={"200px"}
            />
          </div>

          <div className="space-x-3">
            <Label htmlFor="status">Item</Label>
            <Select
              options={optItems}
              placeholder="Pilih Item"
              onChange={(value) => setSelectedItem(value)}
              value={selectedItem}
              width={"200px"}
            />
          </div>
        </div>
      </div>

      <AdjustTable
        globalFilter={debouncedFilter}
        setGlobalFilter={setGlobalFilter}
        filteredStatus={selectedStatus}
        filteredZone={selectedZone}
        filteredBin={selectedBin}
        filteredItem={selectedItem}
      />
    </>
  );
};

export default MainTable;
