import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../../components/form/input/InputField";
import AdjustTable from "./AdjustTable";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import { FaPlus } from "react-icons/fa";
import { useDebounce } from "../../../../helper/useDebounce";
import { useStoreInboundGoodStock } from "../../../../DynamicAPI/stores/Store/MasterStore";

const MainTable = () => {
  const navigate = useNavigate();

  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);

  const handleDetail = (id: any) => {
    console.log(`Navigating to detail page for ID: ${id}`);
  };

  const handleCreate = () => {
    navigate("/inbound_planning/process", {
      state: { data: [], mode: "create", title: "Create Inbound Planning" },
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
            <Button
              size="sm"
              variant="primary"
              startIcon={<FaPlus className="size-5" />}
              onClick={() => handleCreate()}
            >
              Add Inbound Planning
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mt-5">
          {/* <div className="space-x-4">
            <Label htmlFor="search">Inbound No</Label>
            <Input type="text" id="search" placeholder="Inbound no.." />
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
            <Button variant="rounded" size="sm" onClick={handleResetFilters}>
              <FaUndo />
            </Button>
          </div> */}
        </div>
      </div>

      <AdjustTable
        globalFilter={debouncedFilter}
        setGlobalFilter={setGlobalFilter}
        onDetail={handleDetail}
      />
    </>
  );
};

export default MainTable;
