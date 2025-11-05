import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../../components/form/input/InputField";
import AdjustTable from "./AdjustMainTable";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { FaPlus, FaUndo } from "react-icons/fa";
import { useDebounce } from "../../../../helper/useDebounce";
import { useStoreOutboundDelivery } from "../../../../DynamicAPI/stores/Store/MasterStore";

const MainTable = () => {
  const navigate = useNavigate();
  const { fetchAll, list } = useStoreOutboundDelivery();

  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleResetFilters = () => {
    setGlobalFilter("");
  };

  const handleCreate = () => {
    navigate("/outbound_do/process", {
      state: { data: [], mode: "create", title: "Create DO" },
    });
  };

  // Mapping API data to table data
  const mappedList = (list || []).map((item: any, index: number) => ({
    no: index + 1,
    id: item.id,
    outboundDoNumber: item.outbound_do_number || "",
    expedition: item.expedition || "",
    origin: item.origin || "-",
    licensePlate: item.license_plate || "-",
    driverName: item.driver_name || "-",
    driverPhone: item.driver_phone || "-",
    status: item.status || "PENDING",
    outboundType: item.outbound_type || "",
    deliveryDate: new Date(item.delivery_date).toLocaleDateString("en-GB"),
    memoId: item.memo_id || [],
    outboundMemos: (item.outbound_memos || []).map(
      (memo: {
        id: any;
        requestor: any;
        origin: any;
        ship_to: any;
        destination: any;
        delivery_date: string | number | Date;
        status: any;
        notes: any;
      }) => ({
        id: memo.id,
        requestor: memo.requestor || "-",
        origin: memo.origin || "-",
        shipTo: memo.ship_to || "-",
        destination: memo.destination || "-",
        deliveryDate: new Date(memo.delivery_date).toLocaleDateString("en-GB"),
        status: memo.status || "PENDING",
        notes: memo.notes || "",
      })
    ),
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
    deletedAt: item.deletedAt || null,
  }));

  const handleFetchParams = (): void => {
    throw new Error("Function not implemented.");
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
              value={globalFilter}
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

        <div className="flex justify-between items-center mt-5">
          <div className="space-x-4">
            {/* <Label htmlFor="memo-no">Search</Label>
            <Input type="text" id="memo-no" placeholder="Search.." /> */}
          </div>

          <div className="flex justify-center items-center mt-5">
            <Button variant="rounded" size="sm" onClick={handleResetFilters}>
              <FaUndo />
            </Button>
          </div>
        </div>
      </div>

      <AdjustTable
        data={mappedList}
        globalFilter={debouncedFilter}
        setGlobalFilter={setGlobalFilter}
        onRefresh={handleFetchParams}
      />
    </>
  );
};

export default MainTable;
