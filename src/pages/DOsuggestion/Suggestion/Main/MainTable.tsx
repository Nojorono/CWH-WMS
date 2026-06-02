import { useState, useMemo } from "react";
import Input from "../../../../components/form/input/InputField";
import AdjustTable from "../component/AdjustTable";
import { useDebounce } from "../../../../helper/useDebounce";
import Select from "../../../../components/form/Select";
import Button from "../../../../components/ui/button/Button";
import {
  FaSync,
  FaFilter,
  FaSearch,
  FaResearchgate,
  FaRecycle,
} from "react-icons/fa";
import { useStoreShipConfirm } from "../../../../DynamicAPI/stores/Store/MasterStore";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";

const MainTable = () => {
  const [selectedIO, setSelectedIO] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);
  const { fetchAll } = useStoreShipConfirm();

  // Memasukkan logic IO options tetap sama
  const ioOptions = useMemo(() => {
    const listIO = localStorage.getItem("io_list");
    if (!listIO) return [{ value: "", label: "All Organization" }];
    try {
      const parsedIO = JSON.parse(listIO);
      return [
        { value: "", label: "All Organization" },
        ...parsedIO.map((item: any) => ({
          value: item.id,
          label: `${item.organization_name} - ${item.organization_code}`,
        })),
      ];
    } catch {
      return [{ value: "", label: "Error Loading" }];
    }
  }, []);

  return (
    <div className="w-full space-y-4 p-4 bg-[#F8FAFC] min-h-screen">
      <PageBreadcrumb breadcrumbs={[{ title: "DO Suggestion" }]} />

      {/* Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <FaSearch className="size-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search data..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>

          <div className="w-64">
            <Select
              options={ioOptions}
              placeholder="Filter Organization"
              onChange={(value) => setSelectedIO(value)}
              value={selectedIO}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-slate-600 border-slate-200"
            onClick={() => {
              setGlobalFilter("");
              setSelectedIO(null);
            }}
          >
            <FaRecycle className="size-3" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Reset
            </span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
            onClick={fetchAll}
          >
            <FaSync className="mr-2 size-3" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Refresh
            </span>
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <AdjustTable
          globalFilter={debouncedFilter}
          setGlobalFilter={setGlobalFilter}
          filteredIO={selectedIO}
        />
      </div>
    </div>
  );
};

export default MainTable;
