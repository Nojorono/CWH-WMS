import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../../components/form/input/InputField";
import AdjustTable from "./AdjustMainTable";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { FaPlus, FaUndo } from "react-icons/fa";
import { useDebounce } from "../../../../helper/useDebounce";
import { useStoreOutboundDelivery } from "../../../../DynamicAPI/stores/Store/MasterStore";
import Select from "../../../../components/form/Select";

const MainTable = () => {
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);

  const handleResetFilters = () => {
    setGlobalFilter("");
    setSelectedStatus(null);
  };

  const handleCreate = () => {
    navigate("/outbound_do/process", {
      state: { data: [], mode: "create", title: "Create DO" },
    });
  };

  const handleFetchParams = (): void => {
    throw new Error("Function not implemented.");
  };

  const options = [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "PENDING" },
    { value: "IN_PROGRESS", label: "IN_PROGRESS" },
    { value: "COMPLETED", label: "COMPLETED" },
    { value: "CANCELLED", label: "CANCELLED" },
  ];

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
            <Select
              options={options}
              placeholder="Pilih"
              onChange={(value) => setSelectedStatus(value)}
              value={selectedStatus}
            />
          </div>

          <div className="space-x-4">
            <Button
              size="sm"
              variant="primary"
              startIcon={<FaPlus className="size-5" />}
              onClick={handleCreate}
            >
              Create DO
            </Button>
          </div>
        </div>
      </div>

      <AdjustTable
        globalFilter={debouncedFilter}
        setGlobalFilter={setGlobalFilter}
        onRefresh={handleFetchParams}
        filteredStatus={selectedStatus}
      />
    </>
  );
};

export default MainTable;
