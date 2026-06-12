import { useState, useMemo } from "react";
import { FaSync, FaSearch } from "react-icons/fa";
import { useCallPlan } from "../hook/useCallPlan";
import { useGenerateCallPlan } from "../hook/useGenerateCallPlan";
import AdjustTable from "../component/AdjustTable";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import Button from "../../../../components/ui/button/Button";
import { mergeSalesWithCallPlan } from "../helper/callPlanMapper";
import { CallPlanDetail } from "../../../../API/types/callPlan";

const MainTable = () => {
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const params = {
    CABANG: "TGR",
    SALES_SUPERVISOR_NIK: "240801.00011BC",
    CALL_PLAN_START_DATE: "2026-06-02",
  };

  const { data: callPlanList, isLoading, error } = useCallPlan(params);
  const { data: allSalesData } = useGenerateCallPlan(params);

  const mergedData = useMemo(() => {
    if (!allSalesData || !Array.isArray(allSalesData)) return [];
    const masterData = allSalesData as unknown as CallPlanDetail[];

    return mergeSalesWithCallPlan(callPlanList || [], masterData);
  }, [callPlanList, allSalesData]);

  if (isLoading) return <div className="p-10 text-center">Loading Data...</div>;
  if (error)
    return <div className="p-10 text-red-500 text-center">{error}</div>;

  return (
    <div className="w-full space-y-4 p-4 bg-[#F8FAFC] min-h-screen">
      <PageBreadcrumb breadcrumbs={[{ title: "List Salesman" }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <FaSearch className="size-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search sales name..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="bg-blue-600"
          onClick={() => window.location.reload()}
        >
          <FaSync className="mr-2 size-3" /> Refresh
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <AdjustTable
          data={mergedData} // Mengirim data yang sudah lengkap
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
      </div>
    </div>
  );
};

export default MainTable;
