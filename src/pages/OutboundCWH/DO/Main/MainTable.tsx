import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdjustTable from "./AdjustMainTable";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import Input from "../../../../components/form/input/InputField";
import { FaPlus, FaSync, FaUndo } from "react-icons/fa";
import { useDebounce } from "../../../../helper/useDebounce";
import Select from "../../../../components/form/Select";
import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";

const MainTable = () => {
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedFilter = useDebounce(globalFilter, 500);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTypeOutbound, setSelectedTypeOutbound] = useState("");
  const [selectedDoNumber, setSelectedDoNumber] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");

  const { fetchUsingPagination, list: DOlist } =
    useStoreOutboundDeliveryOrder();

  const user = usePersistAuthStore((state) => state.user);
  const roleName = user?.role?.name;
  const canCreateDO =
    roleName === "TRANSPORT_SUPERVISOR" || roleName === "superadmin";

  const statusOptions = useMemo(() => {
    const fromList = Array.from(
      new Set((DOlist || []).map((d: any) => d.status).filter(Boolean)),
    ) as string[];

    const defaults = [
      "PENDING",
      "IN_PROGRESS",
      "APPROVED",
      "APPROVED_LOAD",
      "CANCELLED",
    ];

    const merged = Array.from(new Set([...defaults, ...fromList]));

    return [
      { value: "", label: "All Status" },
      ...merged.map((status) => ({ value: status, label: status })),
    ];
  }, [DOlist]);

  const typeOptions = useMemo(() => {
    const fromList = Array.from(
      new Set((DOlist || []).map((d: any) => d.outbound_type).filter(Boolean)),
    ) as string[];

    const defaults = ["AMO", "SUBDIST"];
    const merged = Array.from(new Set([...defaults, ...fromList]));

    return [
      { value: "", label: "All Type" },
      ...merged.map((type) => ({ value: type, label: type })),
    ];
  }, [DOlist]);


  const doNumberOptions = useMemo(() => {
    const fromList = Array.from(
      new Set(
        (DOlist || [])
          .map((d: any) => d.outbound_do_number)
          .filter(Boolean),
      ),
    ) as string[];

    return [
      { value: "", label: "All DO Number" },
      ...fromList.map((doNumber) => ({ value: doNumber, label: doNumber })),
    ];
  }, [DOlist]);

  const hasActiveFilters = Boolean(
    globalFilter ||
      selectedStatus ||
      selectedTypeOutbound ||
      selectedDoNumber ||
      selectedDestination,
  );

  const handleCreate = () => {
    navigate("/outbound_do/process", {
      state: { data: [], mode: "create", title: "Create DO" },
    });
  };

  const handleResetFilters = () => {
    setGlobalFilter("");
    setSelectedStatus("");
    setSelectedTypeOutbound("");
    setSelectedDoNumber("");
    setSelectedDestination("");
  };

  const handleRefresh = () => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: 1,
      limit: 30,
      status: selectedStatus || "",
      outbound_type: selectedTypeOutbound || "",
    });
  };

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="w-full md:w-1/3">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="🔍 DO Number / Memo / Helper..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              startIcon={<FaUndo />}
            >
              Reset Filter
            </Button>
            <Button
              variant="action"
              size="sm"
              onClick={handleRefresh}
              startIcon={<FaSync />}
            >
              Refresh
            </Button>
            {canCreateDO && (
              <Button
                size="sm"
                variant="primary"
                startIcon={<FaPlus />}
                onClick={handleCreate}
              >
                Create DO
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="doNumber">DO Number</Label>
            <Select
              options={doNumberOptions}
              placeholder="Pilih DO Number"
              onChange={(value) => setSelectedDoNumber(value)}
              value={selectedDoNumber}
              width="100%"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              options={statusOptions}
              placeholder="Select Status"
              onChange={(value) => setSelectedStatus(value)}
              value={selectedStatus}
              width="100%"
            />
          </div>

          <div>
            <Label htmlFor="typeOutbound">Type Outbound</Label>
            <Select
              options={typeOptions}
              placeholder="Pilih Type"
              onChange={(value) => setSelectedTypeOutbound(value)}
              value={selectedTypeOutbound}
              width="100%"
            />
          </div>
        </div>
      </div>

      <AdjustTable
        globalFilter={debouncedFilter}
        setGlobalFilter={setGlobalFilter}
        filteredStatus={selectedStatus}
        filteredTypeOutbound={selectedTypeOutbound}
        filteredDoNumber={selectedDoNumber}
        filteredDestination={selectedDestination}
      />
    </>
  );
};

export default MainTable;
