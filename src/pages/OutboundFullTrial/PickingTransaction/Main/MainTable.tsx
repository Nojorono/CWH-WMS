import { useMemo, useState } from "react";
import AdjustTable from "./AdjustMainTable";
import Label from "../../../../components/form/Label";
import { useDebounce } from "../../../../helper/useDebounce";
import Select from "../../../../components/form/Select";
import Button from "../../../../components/ui/button/Button";
import { FaSync } from "react-icons/fa";
import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";

const MainTable = () => {
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [selectedDoNumber, setSelectedDoNumber] = useState("");

  const { fetchUsingPagination, list: DOlist } =
    useStoreOutboundDeliveryOrder();

  const options = [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "PENDING" },
    { value: "IN_PROGRESS", label: "IN_PROGRESS" },
    { value: "APPROVED", label: "APPROVED" },
    { value: "APPROVED_LOAD", label: "APPROVED_LOAD" },
  ];

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

  const handleRefresh = () => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: 1,
      limit: 30,
      status: selectedStatus || "",
    });
  };

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="flex justify-between items-center gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
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
                options={options}
                placeholder="Select Status"
                onChange={(value) => setSelectedStatus(value)}
                value={selectedStatus}
                width="100%"
              />
            </div>
          </div>
          <div className="shrink-0">
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
        filteredStatus={selectedStatus}
        filteredDoNumber={selectedDoNumber}
      />
    </>
  );
};

export default MainTable;
