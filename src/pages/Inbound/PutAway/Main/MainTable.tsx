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
import { useStoreInboundGoodStock } from "../../../../DynamicAPI/stores/Store/MasterStore";

type PutAway = {
  palletId: string;
  inboundId: string;
  totalSku: number;
  totalQty: number;
  suggestZone: string;
  suggestBin: string;
  forkliftDriver: string;
};

const sampleData: PutAway[] = [
  {
    palletId: "P1",
    inboundId: "CWH01-001-002",
    totalSku: 3,
    totalQty: 120,
    suggestZone: "JT1",
    suggestBin: "A",
    forkliftDriver: "Not Yet Assigned",
  },
  {
    palletId: "P2",
    inboundId: "CWH01-001-002",
    totalSku: 3,
    totalQty: 120,
    suggestZone: "JT2",
    suggestBin: "A",
    forkliftDriver: "Not Yet Assigned",
  },
];

const MainTable = () => {
  const navigate = useNavigate();

  //   const {
  //     list: inboundPrincipalData,
  //     fetchAll,
  //     fetchUsingParam,
  //   } = useStoreInboundGoodStock();

  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);

  //   const [startDate, setStartDate] = useState<Date | null>(null);

  //   const options = [
  //     { value: "CREATED", label: "CREATED" },
  //     { value: "PENDING", label: "PENDING" },
  //   ];

  const handleResetFilters = () => {
    console.log("Resetting filters");
  };

  //   useEffect(() => {
  //     fetchAll();
  //   }, []);

  //   const handleFetchParams = (status: string) => {
  //     fetchUsingParam({
  //       page: 1,
  //       status: status,
  //       limit: "",
  //       createdBy: "",
  //     });
  //   };

  const handleDetail = (id: any) => {
    console.log(`Navigating to detail page for ID: ${id}`);
  };

  const handleCreate = () => {
    navigate("/putaway/process", {
      state: { data: [], mode: "create", title: "Create Inbound Planning" },
    });
  };

  const handleFetchParams = () => {
    console.log("Fetching with params");
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
            <Button
              size="sm"
              variant="primary"
              startIcon={<FaPlus className="size-5" />}
              onClick={() => handleCreate()}
            >
              Create Put Away
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mt-5">
          <div className="space-x-4">
            <Label htmlFor="search">Inbound No</Label>
            <Input type="text" id="search" placeholder="Inbound no.." />
          </div>

          {/* <div className="space-x-4">
            <Label htmlFor="jenis-kunjungan-select">Status</Label>
            <Select
              options={options}
              placeholder="Pilih"
              onChange={(value) => handleFetchParams(value)}
            />
          </div> */}

          <div className="flex justify-center items-center mt-5">
            <Button variant="rounded" size="sm" onClick={handleResetFilters}>
              <FaUndo />
            </Button>
          </div>
        </div>
      </div>

      <AdjustTable
        data={sampleData}
        globalFilter={debouncedFilter}
        setGlobalFilter={setGlobalFilter}
        onDetail={handleDetail}
        onRefresh={handleFetchParams}
      />
    </>
  );
};

export default MainTable;
