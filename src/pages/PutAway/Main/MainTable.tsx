import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../components/form/input/InputField";
import AdjustTable from "./AdjustTable";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import { FaPlus } from "react-icons/fa";
import { useDebounce } from "../../../helper/useDebounce";
import Select from "../../../components/form/Select";

const MainTable = () => {
  const navigate = useNavigate();

  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);

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

  const options = [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "PENDING" },
    { value: "IN_PROGRESS", label: "IN_PROGRESS" },
    { value: "COMPLETED", label: "COMPLETED" },
    { value: "FAILED", label: "FAILED" },
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
              onClick={() => handleCreate()}
            >
              Add Inbound Planning
            </Button>
          </div>
        </div>
      </div>

      <AdjustTable
        globalFilter={debouncedFilter}
        setGlobalFilter={setGlobalFilter}
        onDetail={handleDetail}
        filteredStatus={selectedStatus}
      />
    </>
  );
};

export default MainTable;
