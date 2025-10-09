import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../../components/form/input/InputField";
import DateInputField from "../../../../components/form/input/DateInputField";
import AdjustTable from "./AdjustTable";
import Label from "../../../../components/form/Label";
import Select from "../../../../components/form/Select";
import Button from "../../../../components/ui/button/Button";
import { FaPlus, FaUndo } from "react-icons/fa";
// import DatePicker from "../../../../components/form/date-picker";
// import Spinner from "../../../../components/ui/spinner";
// import { usePagePermissions } from "../../../../utils/UserPermission/UserPagePermissions";
// import { showErrorToast } from "../../../../components/toast";
import { useDebounce } from "../../../../helper/useDebounce";
import { useStoreMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";

const MainTable = () => {
  const navigate = useNavigate();

  const { list: memoData, fetchAll, fetchUsingParam } = useStoreMemo();

  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);

  //   const [startDate, setStartDate] = useState<Date | null>(null);

  const options = [
    { value: "CREATED", label: "CREATED" },
    { value: "PENDING", label: "PENDING" },
  ];

  const [date, setDate] = useState<Date | null>(null);

  const handleResetFilters = () => {
    console.log("Resetting filters");
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleFetchParams = (status: string) => {
    fetchUsingParam({
      page: 1,
      status: status,
      limit: "",
      createdBy: "",
    });
  };

  const handleDetail = (id: any) => {
    console.log(`Navigating to detail page for ID: ${id}`);
  };

  const handleCreate = () => {
    navigate("/memo/create_memo", {
      state: { data: [], mode: "create", title: "Create MEMO" },
    });
  };

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="flex justify-between items-center">
          <div className="space-x-4">
            <Label htmlFor="search">MEMO List</Label>
            <Input
              onChange={(e) => setGlobalFilter(e.target.value)}
              type="text"
              id="search"
              placeholder="Search here..."
            />
          </div>

          <div className="space-x-4">
            <Button
              size="sm"
              variant="primary"
              startIcon={<FaPlus className="size-5" />}
              onClick={() => handleCreate()}
            >
              Create Memo
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mt-5">
          <div className="space-x-4">
            <Label htmlFor="jenis-kunjungan-select">Delivery Date</Label>
            <DateInputField
              label="Start Date"
              value={date}
              onChange={(val) => setDate(val)}
            />
          </div>
          <div className="space-x-4">
            <Label htmlFor="jenis-kunjungan-select">Created Date</Label>
            <DateInputField
              label="Start Date"
              value={date}
              onChange={(val) => setDate(val)}
            />
          </div>
          <div className="space-x-4">
            <Label htmlFor="jenis-kunjungan-select">Destination</Label>
            <Select
              options={options}
              placeholder="Pilih"
              onChange={(value) => handleFetchParams(value)}
            />
          </div>
          <div className="space-x-4">
            <Label htmlFor="jenis-kunjungan-select">Status</Label>
            <Select
              options={options}
              placeholder="Pilih"
              onChange={(value) => handleFetchParams(value)}
            />
          </div>

          <div className="flex justify-center items-center mt-5">
            <Button size="sm" variant="primary" onClick={handleResetFilters}>
              <FaUndo />
            </Button>
          </div>
        </div>
      </div>
      <AdjustTable
        data={memoData}
        globalFilter={debouncedFilter}
        setGlobalFilter={setGlobalFilter}
        onDetail={handleDetail}
        onRefresh={fetchAll}
      />
    </>
  );
};

export default MainTable;
