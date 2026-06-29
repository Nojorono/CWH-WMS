import { useState, useEffect, useMemo } from "react";
import { FaArrowLeft, FaInfoCircle, FaSync } from "react-icons/fa";
import dayjs from "dayjs";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import { SPBSubmittedPage } from "./pages/SPBSubmittedPage";
import { CalculationPage } from "./pages/CalculationPage";
import { GoodsPreparationPage } from "./pages/GoodsPreparationPage";
import { useGetLocalDoSuggestion } from "../Suggestion/hook/useGetLocalDoSuggestion";
import { useGetBTB } from "./hook/useGetBTB";
import { usePersistAuthStore } from "../../../API/store/AuthStore/PersistAuthStore";
import { DOSuggestionData } from "../../../API/types/draftDOsuggestion";
import { showErrorToast } from "../../../components/toast";
import Swal from "sweetalert2";
import {
  getCalculationErrorMessage,
  isCalculationTimeAllowed,
} from "../Suggestion/global/allowedDate";

// --- INTERFACES ---
export interface GroupedSPBData {
  sales_spv_nik: string;
  sales_spv_name: string;
  salesmenDO: DOSuggestionData[];
}

type Step = "SUBMITTED" | "CALCULATION" | "PREPARATION";
type StatusFilter = "SUBMITTED" | "FINAL";

// --- CONSTANTS ---
const STEP_CONFIG: Record<
  Step,
  { title: string; breadcrumbs: { title: string }[] }
> = {
  SUBMITTED: {
    title: "SPB Submitted",
    breadcrumbs: [{ title: "SPB Submitted" }],
  },

  CALCULATION: {
    title: "Stock on Hand & Calculation",
    breadcrumbs: [{ title: "Stock on Hand & Calculation" }],
  },

  PREPARATION: {
    title: "Goods Preparation",
    breadcrumbs: [{ title: "Goods Preparation" }],
  },
};

const MainTable = () => {
  // 1. STATE & AUTH
  const { user } = usePersistAuthStore.getState();
  const organization_name = user?.userDetail?.organization?.organization_name;
  const organization_id = user?.userDetail?.organizationId;
  const userNIK = user?.userDetail?.employee_id;
  const TARGET_DATE = useMemo(() => dayjs().add(2, "day").format("YYYY-MM-DD"), []);
  
  const [currentStep, setCurrentStep] = useState<Step>("SUBMITTED");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("SUBMITTED");
  const [calculatedResults, setCalculatedResults] = useState<any[]>([]);

  // 2. FETCHING DATA
  const {
    submittedList,
    isLoading: isLocalLoading,
    fetchSubmittedList,
  } = useGetLocalDoSuggestion();

  const isParamsReady = !!(organization_name && userNIK);

  const paramGetBTB = useMemo(
    () => ({
      CABANG: String(organization_name),
      CALL_PLAN_START_DATE: TARGET_DATE,
    }),
    [organization_name],
  );

  const { data: BTBdata, isLoading: isBTBLoading } = useGetBTB(paramGetBTB, {
    enabled: isParamsReady,
  });

  useEffect(() => {
    if (organization_id) {
      fetchSubmittedList(TARGET_DATE, organization_id, statusFilter);
    }
  }, [organization_id, statusFilter, fetchSubmittedList]);

  // 3. DATA TRANSFORMATION (BUSINESS LOGIC)
  const groupedAndMappedData = useMemo<GroupedSPBData[]>(() => {
    if (!submittedList?.length) return [];

    // Helper untuk mapping data BTB ke DO Details
    const enrichDetails = (details: any[], salesmanBTB: any) => {
      return details.map((doDetail) => {
        const skuMatch = salesmanBTB?.details.find(
          (btbLine: any) => btbLine.PRODUCT_SKU === doDetail.item_code,
        );
        return {
          ...doDetail,
          qty_btb: skuMatch ? skuMatch.QTY_BTB : "-",
          no_found_in_btb: !skuMatch,
        };
      });
    };

    const groupedBySpv = submittedList.reduce(
      (acc: Record<string, GroupedSPBData>, currentDO) => {
        // 1. Destructure data agar lebih rapi
        const { sales_spv_nik, sales_spv } = currentDO;

        // 2. GUARD CLAUSE (Validasi Mandatory)
        // Jika tidak ada NIK atau Nama SPV, hentikan proses untuk item ini dan kembalikan accumulator (skip item).
        if (!sales_spv_nik || !sales_spv) {
          showErrorToast("Tidak ada data SPV Sales!");
          return acc;
        }

        // 3. Proses mapping BTB berjalan seperti biasa jika lolos validasi
        const salesmanBTB = BTBdata?.find(
          (btb) => btb.SALES_NIK === currentDO.sales_nik,
        );

        const enrichedDO = {
          ...currentDO,
          details: enrichDetails(currentDO.details, salesmanBTB),
        };

        // 4. Grouping dengan data yang sudah dijamin pasti ada (mandatory)
        if (!acc[sales_spv_nik]) {
          acc[sales_spv_nik] = {
            sales_spv_nik: sales_spv_nik,
            sales_spv_name: sales_spv,
            salesmenDO: [],
          };
        }

        acc[sales_spv_nik].salesmenDO.push(enrichedDO);
        return acc;
      },
      {},
    );

    return Object.values(groupedBySpv);
  }, [submittedList, BTBdata]);

  const dataForCalculation = useMemo(() => {
    if (!groupedAndMappedData.length) return [];
    return groupedAndMappedData
      .map((spvGroup) => ({
        ...spvGroup,
        salesmenDO: spvGroup.salesmenDO.filter(
          (doDoc) => doDoc.status === "SUBMITTED",
        ),
      }))
      .filter((spvGroup) => spvGroup.salesmenDO.length > 0);
  }, [groupedAndMappedData]);

  // 4. HANDLERS
  const handleBack = () => setCurrentStep("SUBMITTED");
  const handleRefresh = () => window.location.reload();

  // 5. RENDER HELPERS
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-600 font-medium">Processing data...</p>
    </div>
  );

  const renderEmptyCalculation = () => (
    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-200 shadow-sm gap-4">
      <div className="p-4 bg-orange-50 rounded-full text-orange-500">
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-800">
          Tidak ada data untuk dikalkulasi
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          SPB harus dengan status SUBMITTED.
        </p>
      </div>
      <Button
        onClick={handleBack}
        variant="outline"
        startIcon={<FaArrowLeft />}
      >
        Kembali ke Daftar SPB
      </Button>
    </div>
  );

  const renderActiveStep = () => {
    switch (currentStep) {
      case "SUBMITTED": 
        return (
          <SPBSubmittedPage
            data={groupedAndMappedData}
            onProceed={() => {
              // Gunakan The Master Validator
              if (isCalculationTimeAllowed(TARGET_DATE)) {
                setCurrentStep("CALCULATION");
              } else {
                Swal.fire({
                  icon: "warning", // Gunakan warning karena ini penjagaan SOP, bukan system error
                  title: "Jadwal Terkunci",
                  text: getCalculationErrorMessage(TARGET_DATE),
                  confirmButtonColor: "#ea580c",
                });
              }
            }}
            onGoToPreparation={() => setCurrentStep("PREPARATION")}
            setCalculatedResults={setCalculatedResults}
          />
        );

      case "CALCULATION":
        return dataForCalculation.length > 0 ? (
          <CalculationPage
            data={dataForCalculation as any}
            params={paramGetBTB}
            onProceed={async (results) => {
              setCalculatedResults(results);
              setCurrentStep("PREPARATION");
              setStatusFilter("FINAL");
            }}
          />
        ) : (
          renderEmptyCalculation()
        );

      case "PREPARATION":
        return <GoodsPreparationPage targetDate={TARGET_DATE} />;

      default:
        return null;
    }
  };

  const isLoadingAll = isLocalLoading || isBTBLoading;
  const config = STEP_CONFIG[currentStep];

  // 6. MAIN RENDER
  return (
    <div className="w-full space-y-4 p-4 bg-[#F8FAFC] min-h-screen">
      <PageBreadcrumb breadcrumbs={config.breadcrumbs} />

      {currentStep === "SUBMITTED" && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
          <FaInfoCircle className="text-blue-500 mt-0.5 size-5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-blue-900">
              Informasi SOP Kalkulasi Stock On Hand (SOH)
            </h4>
            <p className="text-sm text-blue-800 mt-1">
              Tombol "Proceed to Calculation" hanya aktif pada{" "}
              <strong>H-1</strong> (untuk SPB besok: {TARGET_DATE}) antara pukul{" "}
              <strong>09:00 - 10:00</strong>. Jika melewati pukul 10:00, SOH
              akan ditarik otomatis oleh Scheduler.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            {config.title}
          </h2>

          {currentStep === "SUBMITTED" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all cursor-pointer focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="FINAL">FINAL</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentStep !== "SUBMITTED" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              startIcon={<FaArrowLeft />}
            >
              Back
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 transition-colors"
              onClick={handleRefresh}
            >
              <FaSync className="mr-2 size-3" /> Refresh
            </Button>
          )}
        </div>
      </div>

      <div>{isLoadingAll ? renderLoading() : renderActiveStep()}</div>
    </div>
  );
};

export default MainTable;
