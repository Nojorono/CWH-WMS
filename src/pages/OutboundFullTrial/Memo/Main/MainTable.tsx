import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdjustTable from "./AdjustTable";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { FaPlus, FaSync } from "react-icons/fa";
import { useDebounce } from "../../../../helper/useDebounce";
import Select from "../../../../components/form/Select";
import { useStoreOutboundMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";

const MainTable = () => {
  const navigate = useNavigate();
  const { fetchUsingPagination } = useStoreOutboundMemo();

  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [selectedTypeOutbound, setSelectedTypeOutbound] = useState<any>(null);
  const [selectedHasDO, setSelectedHasDO] = useState<any>(null);

  const handleCreate = () => {
    navigate("/memo/process", {
      state: { data: [], mode: "create", title: "Create Memo Form" },
    });
  };

  const handleFetchParams = (): void => {
    throw new Error("Function not implemented.");
  };

  const statusOpt = [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "PENDING" },
    { value: "APPROVED", label: "APPROVED" },
    { value: "REJECTED", label: "REJECTED" },
    { value: "CANCELLED", label: "CANCELLED" },
  ];

  const typeOutbound = [
    { value: "", label: "All Type" },
    { value: "AMO", label: "AMO" },
    { value: "SUBDIST", label: "SUBDIST" },
  ];

  const hasDOflag = [
    { value: "", label: "All Flag" },
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
  ];

  const user = usePersistAuthStore((state) => state.user);
  const roleName = user?.role?.name;
  const NIK = user?.userDetail?.employee_id

  const handleRefresh = () => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: 1,
      limit: 30,
    });
  };

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="flex justify-between items-center">
          <div className="space-x-4">
            <Label htmlFor="status">Status</Label>
            <Select
              options={statusOpt}
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
            <Label htmlFor="memoType">Has DO</Label>
            <Select
              options={hasDOflag}
              placeholder="Pilih Has DO"
              onChange={(value) => setSelectedHasDO(value)}
              value={selectedHasDO}
            />
          </div>

          {roleName === "TRANSPORT_STAFF" && (
            <div
              className="mt-3"
              title={
                NIK && NIK.includes("NON")
                  ? "User dengan NIK NON Employee tidak bisa create Memo"
                  : ""
              }
            >
              <Button
                size="sm"
                variant="primary"
                startIcon={<FaPlus className="size-5" />}
                onClick={handleCreate}
                disabled={!!(NIK && NIK.includes("NON"))}
              >
                Create Memo
              </Button>
            </div>
          )}

          <div className="mt-3">
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
        onRefresh={handleFetchParams}
        filteredStatus={selectedStatus}
        filteredTypeOutbound={selectedTypeOutbound}
        filteredHasDO={selectedHasDO}
      />
    </>
  );
};

export default MainTable;
