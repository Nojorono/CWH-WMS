import { useState, useMemo } from "react";
import { FaSync, FaSearch, FaRecycle } from "react-icons/fa";
import { useCallPlan } from "../hook/useCallPlan";
import AdjustTable from "../component/AdjustTable";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import Select from "../../../../components/form/Select";
import Button from "../../../../components/ui/button/Button";

const MainTable = () => {
  const [selectedIO, setSelectedIO] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  
  const params = {
    CABANG: "KDI",
    SALES_SUPERVISOR_NIK: "160210.00205T0",
    CALL_PLAN_START_DATE: "2026-06-02",
  };

  const { data, isLoading, error } = useCallPlan(params);

  // Flatten data dari struktur DETAIL per supervisor menjadi satu list sales
  const flattenedSales = useMemo(() => {
    if (!data) return [];
    return data.flatMap((group) => group.DETAIL || []);
  }, [data]);

  if (isLoading) return <div className="p-10 text-center">Loading Data...</div>;
  if (error) return <div className="p-10 text-red-500 text-center">{error}</div>;

  return (
    <div className="w-full space-y-4 p-4 bg-[#F8FAFC] min-h-screen">
      <PageBreadcrumb breadcrumbs={[{ title: "DO Suggestion" }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <FaSearch className="size-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search sales name..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" className="bg-blue-600" onClick={() => window.location.reload()}>
            <FaSync className="mr-2 size-3" /> Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <AdjustTable
          data={flattenedSales} 
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
      </div>
    </div>
  );
};

export default MainTable;