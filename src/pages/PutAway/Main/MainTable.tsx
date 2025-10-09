import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../components/form/input/InputField";
import AdjustTable from "./AdjustTable";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import { FaPlus, FaFileImport, FaFileDownload, FaUndo } from "react-icons/fa";
import { useDebounce } from "../../../helper/useDebounce";
import Select from "../../../components/form/Select";
import DatePicker from "../../../components/form/date-picker";
import Spinner from "../../../components/ui/spinner";
import { usePagePermissions } from "../../../utils/UserPermission/UserPagePermissions";
import { showErrorToast } from "../../../components/toast";
import { useStorePutAway } from "../../../DynamicAPI/stores/Store/MasterStore";

type PutAway = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  inventory_tracking_id: string;
  inventoryTracking: {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    pallet_id: string;
    warehouse_id: string;
    warehouse_sub_id: string;
    warehouse_bin_id: string | null;
    inventory_date: string;
    inventory_status: string;
    inventory_note: string;
  };
  destination_bin_id: string;
  destinationBin: {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    organization_id: number;
    warehouse_sub_id: string;
    name: string;
    code: string;
    description: string;
    capacity_pallet: number;
    barcode_image_url: string;
    current_pallet: string | null;
  };
  forklift_driver_id: string;
  driver_name: string;
  driver_phone: string;
  status: string;
  notes: string;
};

const MainTable = () => {
  const navigate = useNavigate();
  const { fetchAll, list } = useStorePutAway();

  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);

  // Mapping API data to table data
  const mappedList = (list || []).map((item: any) => ({
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    inventory_tracking_id: item.inventory_tracking_id,
    inventoryTracking: item.inventoryTracking,
    destination_bin_id: item.destination_bin_id,
    destinationBin: item.destinationBin,
    forklift_driver_id: item.forklift_driver_id,
    driver_name: item.driver_name,
    driver_phone: item.driver_phone,
    status: item.status,
    notes: item.notes,
    palletId: item.inventoryTracking?.pallet_id || "-",
    inboundId: item.inventory_tracking_id || "-",
    totalSku: 0, // Data tidak tersedia di API, isi default
    totalQty: 0, // Data tidak tersedia di API, isi default
    suggestZone: item.destinationBin?.name || "-",
    suggestBin: item.destinationBin?.code || "-",
    forkliftDriver: item.driver_name || "-",
  }));

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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

  const handleFetchParams = () => {
    // Implementasi fetch dengan parameter filter jika diperlukan
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
              Create Put Away
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
        onDetail={handleDetail}
        onRefresh={handleFetchParams}
      />
    </>
  );
};

export default MainTable;
