import { useState, useEffect } from "react";
import { FaSync, FaSearch } from "react-icons/fa";
import { useCallPlan } from "../hook/useCallPlan";
import AdjustTable from "../component/AdjustTable";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import Button from "../../../../components/ui/button/Button";
import { processCallPlanData } from "../helper/callPlanMapper";
import { CallPlanDetail } from "../../../../API/types/callPlan";
import ActIndicator from "../../../../components/ui/activityIndicator";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import dummyCallplan from "../helper/dummyCallplan";
import dayjs from "dayjs";

const MainTable = () => {
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [mergedData, setMergedData] = useState<CallPlanDetail[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const state = usePersistAuthStore.getState();
  const user = state.user;
  const organization_name = user?.userDetail?.organization?.organization_name;
  const userNIK = user?.userDetail?.employee_id;
  const DateNow = dayjs().format("YYYY-MM-DD");

  console.log("dateNow", dayjs().format("YYYY-MM-DD"));

  const params = {
    CABANG: String(organization_name),
    SALES_SUPERVISOR_NIK: String(userNIK),
    // CALL_PLAN_START_DATE: DateNow,
    CALL_PLAN_START_DATE: "2026-06-02",
  };

  const {
    data: callPlanList,
    isLoading: isCallPlanLoading,
    error,
    refetch,
  } = useCallPlan(params);

  useEffect(() => {
    const callplanChecked = async () => {
      const result = await processCallPlanData(callPlanList || []);
      setMergedData(result);
      setIsProcessing(false);
    };

    callplanChecked();
  }, [callPlanList]);

  if (error)
    return <div className="p-10 text-red-500 text-center">{error}</div>;

  const isLoading = isCallPlanLoading || isProcessing;

  // const [dataWithStatus, setDataWithStatus] = useState<any[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
  // useEffect(() => {
  //   const processData = async () => {
  //     setIsLoading(true);

  //     // Lakukan pengecekan status untuk setiap item di dummyCallplan secara paralel
  //     const processed = await Promise.all(
  //       dummyCallplan.map(async (item) => {
  //         let isGenerated = false;

  //         if (item.CALL_PLAN_NUMBER && item.CALL_PLAN_NUMBER !== "-") {
  //           try {
  //             // Cek ke DB asli
  //             const existingData = await checkIsGenerated(
  //               item.CALL_PLAN_NUMBER,
  //             );
  //             isGenerated = !!existingData;
  //           } catch (err) {
  //             console.warn(
  //               `Gagal cek ${item.CALL_PLAN_NUMBER}, status default false`,
  //             );
  //           }
  //         }

  //         // Gabungkan data asli dengan status generated
  //         return { ...item, is_generated: isGenerated };
  //       }),
  //     );

  //     setDataWithStatus(processed);
  //     setIsLoading(false);
  //   };

  //   processData();
  // }, []);

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
          onClick={() => refetch()}
        >
          <FaSync className="mr-2 size-3" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <ActIndicator />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <AdjustTable
            // data={dataWithStatus}
            data={mergedData}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
          />
        </div>
      )}
    </div>
  );
};

export default MainTable;
