import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../../components/form/input/InputField";
import AdjustTable from "./AdjustTable";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { FaPlus, FaFileImport, FaFileDownload, FaUndo } from "react-icons/fa";
import { useDebounce } from "../../../../helper/useDebounce";
import Select from "../../../../components/form/Select";
import DatePicker from "../../../../components/form/date-picker";
import Spinner from "../../../../components/ui/spinner";
import { usePagePermissions } from "../../../../utils/UserPermission/UserPagePermissions";
import { showErrorToast } from "../../../../components/toast";
import { useStoreOutboundMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";

const MainTable = () => {
  const navigate = useNavigate();
  const { fetchAll, list } = useStoreOutboundMemo();

  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleResetFilters = () => {
    setGlobalFilter("");
    // Reset filter lain jika ada
  };

  const handleCreate = () => {
    navigate("/memo/process", {
      state: { data: [], mode: "create", title: "Create Memo" },
    });
  };

  // Mapping API data to table data
  const mappedList = (list || []).map((item: any, index: number) => ({
    no: index + 1,
    id: item.id,
    memoId: `M${(index + 1).toString().padStart(3, "0")}`,
    deliveryDate: new Date(item.delivery_date).toLocaleDateString("en-GB"),
    origin: item.origin || "-",
    destination: item.destination || "-",
    shipTo: item.ship_to || "-",
    requestor: item.requestor || "-",
    status: item.status || "PENDING",
    createdDate: new Date(item.createdAt).toLocaleDateString("en-GB"),
    // Add required AdjustData properties below, fallback to null/empty if not present
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
    deletedAt: item.deletedAt || null,
    inventory_tracking_id: item.inventory_tracking_id || "",
    outbound_memo_id: item.outbound_memo_id || "",
    outbound_memo_detail_id: item.outbound_memo_detail_id || "",
    product_id: item.product_id || "",
    product_name: item.product_name || "",
    qty: item.qty || 0,
    uom: item.uom || "",
    warehouse_id: item.warehouse_id || "",
    // Add any other required fields from AdjustData here
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
              Create Memo
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mt-5">
          <div className="space-x-4">
            <Label htmlFor="inbound-no">Inbound No</Label>
            <Input type="text" id="inbound-no" placeholder="Inbound no.." />
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
