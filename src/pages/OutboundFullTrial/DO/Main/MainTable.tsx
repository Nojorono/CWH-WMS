import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdjustTable from "./AdjustMainTable";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { FaPlus, FaUndo } from "react-icons/fa";
import { useDebounce } from "../../../../helper/useDebounce";
import Select from "../../../../components/form/Select";

const MainTable = () => {
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [selectedTypeOutbound, setSelectedTypeOutbound] = useState<any>(null);

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
    { value: "APPROVED", label: "APPROVED" },
    { value: "APPROVED_LOAD", label: "APPROVED_LOAD" },
    { value: "COMPLETED", label: "COMPLETED" },
    { value: "CANCELLED", label: "CANCELLED" },
  ];

  const typeOutbound = [
    { value: "", label: "All Type" },
    { value: "AMO", label: "AMO" },
    { value: "SUBDIST", label: "SUBDIST" },
  ];

  const roleName = localStorage.getItem("role_name");
  const canCreateDO =
    roleName === "TRANSPORT_SUPERVISOR" ||
    roleName === "superadmin";

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="flex justify-between items-center">
          <div className="space-x-4">
            <Label htmlFor="status">Status</Label>
            <Select
              options={options}
              placeholder="Select Status"
              onChange={(value) => setSelectedStatus(value)}
              value={selectedStatus}
            />
          </div>

          <div className="space-x-4">
            <Label htmlFor="memoType">Type Outbound</Label>
            <Select
              options={typeOutbound}
              placeholder="Pilih Type"
              onChange={(value) => setSelectedTypeOutbound(value)}
              value={selectedTypeOutbound}
            />
          </div>

          <div className="space-x-4">
            {canCreateDO && (
              <Button
                size="sm"
                variant="primary"
                startIcon={<FaPlus className="size-5" />}
                onClick={handleCreate}
              >
                Create DO
              </Button>
            )}
          </div>
        </div>
      </div>

      <AdjustTable
        globalFilter={debouncedFilter}
        setGlobalFilter={setGlobalFilter}
        onRefresh={handleFetchParams}
        filteredStatus={selectedStatus}
        filteredTypeOutbound={selectedTypeOutbound}
      />
    </>
  );
};

export default MainTable;
