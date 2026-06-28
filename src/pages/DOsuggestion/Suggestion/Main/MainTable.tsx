import { useState, useEffect, useMemo } from "react";
import { FaSync, FaSearch } from "react-icons/fa";
import { useCallPlan } from "../hook/useCallPlan";
import AdjustTable from "../component/AdjustTable";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import Button from "../../../../components/ui/button/Button";
import { processCallPlanData } from "../helper/callPlanMapper";
import { CallPlanDetail } from "../../../../API/types/callPlan";
import ActIndicator from "../../../../components/ui/activityIndicator";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import Select from "../../../../components/form/Select";
import { useStoreUser } from "../../../../DynamicAPI/stores/Store/MasterStore";
import dayjs from "dayjs";


const MainTable = () => {
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [mergedData, setMergedData] = useState<CallPlanDetail[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // State untuk menyimpan NIK Supervisor yang dipilih oleh AHOM
  const [selectedSpvNik, setSelectedSpvNik] = useState<string | null>(null);

  const state = usePersistAuthStore.getState();
  const user = state.user;
  const organization_name = user?.userDetail?.organization?.organization_name;
  const userNIK = user?.userDetail?.employee_id;
  const role_name = user?.role?.name;
  const isAhom = role_name === "AHOM";
  const activeSpvNik = isAhom ? selectedSpvNik : userNIK;
  const shouldFetchCallPlan = !!activeSpvNik;
  const DateNow = dayjs().format("YYYY-MM-DD");

  const { list: userData, fetchAll: fetchAllUsers } = useStoreUser();

  useEffect(() => {
    if (isAhom) {
      fetchAllUsers();
    }
  }, [isAhom, fetchAllUsers]);

  const spvOptions = useMemo(() => {
    if (!userData) return [];
    const spvList = Array.isArray(userData)
      ? userData
      : (userData as any).data || [];

    return spvList
      .filter((u: any) => u.role?.name === "SALES_SUPERVISOR")
      .map((spv: any) => ({
        label: `${spv.userDetail?.firstName} ${spv.userDetail?.lastName} - ${spv.userDetail?.employee_id}`,
        value: spv.userDetail?.employee_id,
      }));
  }, [userData]);

  const paramGetCallplan = {
    CABANG: String(organization_name),
    SALES_SUPERVISOR_NIK: String(activeSpvNik),
    CALL_PLAN_START_DATE: "2026-06-02", // atau DateNow
    // CALL_PLAN_START_DATE: DateNow
  };

  const {
    data: callPlanList,
    isLoading: isCallPlanLoading,
    error,
    refetch,
  } = useCallPlan(paramGetCallplan, { enabled: shouldFetchCallPlan });

  useEffect(() => {
    if (!callPlanList || callPlanList.length === 0) {
      setMergedData([]);
      return;
    }

    const callplanChecked = async () => {
      setIsProcessing(true);
      const result = await processCallPlanData(callPlanList);
      setMergedData(result);
      setIsProcessing(false);
    };

    callplanChecked();
  }, [callPlanList]);

  const isLoading = (isCallPlanLoading && shouldFetchCallPlan) || isProcessing;

  return (
    <div className="w-full space-y-4 p-4 bg-[#F8FAFC] min-h-screen">
      <PageBreadcrumb breadcrumbs={[{ title: "List Salesman Callplan" }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Render Dropdown SPV hanya jika user adalah AHOM */}
        {isAhom && (
          <div className="w-full md:w-64">
            <Select
              options={spvOptions}
              value={selectedSpvNik || ""}
              onChange={(value) => setSelectedSpvNik(value)}
              placeholder="Pilih Supervisor..."
              className="w-full"
            />
          </div>
        )}

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
              disabled={!activeSpvNik}
            />
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="bg-blue-600"
          onClick={() => refetch()}
          disabled={!activeSpvNik}
        >
          <FaSync className="mr-2 size-3" /> Refresh
        </Button>
      </div>

      {/* Tampilan berdasarkan state */}
      {!activeSpvNik ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center text-slate-500">
          <p className="font-medium text-lg mb-2">Pilih Supervisor</p>
          <p className="text-sm">
            Silakan pilih Sales Supervisor pada opsi di atas untuk menampilkan
            data.
          </p>
        </div>
      ) : isLoading ? (
        <ActIndicator />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <AdjustTable
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
