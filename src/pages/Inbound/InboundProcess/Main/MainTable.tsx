import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../../components/form/input/InputField";
import AdjustTable from "./AdjustTable";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { FaPlus, FaSync } from "react-icons/fa";
import { useDebounce } from "../../../../helper/useDebounce";
import Select from "../../../../components/form/Select";
import { usePagePermissions } from "../../../../utils/UserPermission/UserPagePermissions";
import { useStoreInboundGoodStock } from "../../../../DynamicAPI/stores/Store/MasterStore";

const MainTable = () => {
  const navigate = useNavigate();
  const { canCreate, canManage } = usePagePermissions();
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);

  const { fetchUsingPagination, isLoading } = useStoreInboundGoodStock();

  const handleDetail = (id: any) => {};

  const handleCreate = () => {
    navigate("/inbound_planning/process", {
      state: { data: [], mode: "create", title: "Create Inbound Planning" },
    });
  };

  const options = [
    { value: "", label: "All Status" },
    { value: "CREATED", label: "CREATED" },
    { value: "UNLOADING", label: "UNLOADING" },
    { value: "INSPECTION", label: "INSPECTION" },
    { value: "READY_INTEGRATION", label: "READY_INTEGRATION" },
    { value: "INTEGRATED", label: "INTEGRATED" },
    { value: "FAILED", label: "FAILED" },
  ];

  const handleRefresh = () => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: 1,
      limit: 25,
    });
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
            />
          </div>

          <div className="space-x-4">
            <Label htmlFor="status">Status</Label>
            <Select
              options={options}
              placeholder="Pilih"
              onChange={(value) => setSelectedStatus(value)}
              value={selectedStatus}
            />
          </div>

          <div className="space-x-4">
            {canCreate && canManage && (
              <Button
                size="sm"
                variant="primary"
                startIcon={<FaPlus className="size-5" />}
                onClick={() => handleCreate()}
              >
                Add Inbound Planning
              </Button>
            )}

            <Button
              variant="action"
              size="sm"
              onClick={handleRefresh}
              startIcon={<FaSync className="size-5" />}
            >
              Refresh
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
