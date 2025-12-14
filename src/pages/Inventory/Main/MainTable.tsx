import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../components/form/input/InputField";
import AdjustTable from "./AdjustTable";
import Label from "../../../components/form/Label";
import { useDebounce } from "../../../helper/useDebounce";
import Select from "../../../components/form/Select";
import {
  useStoreSubWarehouse,
  useStoreBinByZone,
} from "../../../DynamicAPI/stores/Store/MasterStore";
import Button from "../../../components/ui/button/Button";
import { FaPlus } from "react-icons/fa";

const MainTable = () => {
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);
  const [selectedStatus, setSelectedStatus] = useState<any>("");
  const [selectedZone, setSelectedZone] = useState<any>("");
  const [selectedBin, setSelectedBin] = useState<any>("");

  const { fetchAll, list: listZone } = useStoreSubWarehouse();
  const { fetchById: fetchBinById, detail: listBins } = useStoreBinByZone();

  useEffect(() => {
    fetchAll();
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

  const safeBins = Array.isArray(listBins) ? listBins : [];
  const optBin = [
    { value: "", label: "All Bin" },
    ...safeBins.map((bin) => ({ value: bin.id, label: bin.code })),
  ];

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="flex justify-between items-center">
          <div className="space-x-3">
            <Label htmlFor="search">Search</Label>
            <Input
              onChange={(e) => setGlobalFilter(e.target.value)}
              type="text"
              id="search"
              placeholder="🔍 Masukan data.."
              value={globalFilter}
              width={"300px"}
            />
          </div>

          <div className="space-x-3">
            <Label htmlFor="status">Status</Label>
            <Select
              options={optStatus}
              placeholder="Pilih Status"
              onChange={(value) => setSelectedStatus(value)}
              value={selectedStatus}
              width={"300px"}
            />
          </div>

          <div className="space-x-3">
            <Label htmlFor="status">Zone</Label>
            <Select
              options={optZone}
              placeholder="Pilih Zone"
              onChange={(value) => setSelectedZone(value)}
              value={selectedZone}
              width={"300px"}
            />
          </div>

          <div className="space-x-3">
            <Label htmlFor="status">BIN</Label>
            <Select
              options={optBin}
              placeholder="Pilih Bin"
              onChange={(value) => setSelectedBin(value)}
              value={selectedBin}
              width={"300px"}
            />
          </div>

          <div className="space-x-3 mt-4">
            <Button
              variant="primary"
              size="sm"
              // onClick={() => setCreateModalOpen(true)}
              disabled={!selectedZone || selectedStatus !== "IN_INVENTORY"}
            >
              <FaPlus className="mr-2" /> Movement Inventory
            </Button>
          </div>
        </div>
      </div>

      <AdjustTable
        globalFilter={debouncedFilter}
        setGlobalFilter={setGlobalFilter}
        filteredStatus={selectedStatus}
        filteredZone={selectedZone}
        filteredBin={selectedBin}
      />
    </>
  );
};

export default MainTable;
