// File: src/pages/DOsuggestion/OutboundSales/MainTable.tsx

import { useState, useEffect, useMemo } from "react";
import { FaArrowLeft, FaSync } from "react-icons/fa";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import { useGetLocalDoSuggestion } from "../Suggestion/hook/useGetLocalDoSuggestion";
import { usePersistAuthStore } from "../../../API/store/AuthStore/PersistAuthStore";

import { SPBSubmittedPage } from "./pages/SPBSubmittedPage";
import { CalculationPage } from "./pages/CalculationPage";
import { GoodsPreparationPage } from "./pages/GoodsPreparationPage";
import { useGetBTB } from "./hook/useGetBTB";
import { DOSuggestionData } from "../../../API/types/draftDOsuggestion";
import dayjs from "dayjs";

// --- DEKLARASI INTERFACE BARU DI SINI ---
// Export interface ini agar SPBSubmittedPage bisa meng-import-nya
export interface GroupedSPBData {
  sales_spv_nik: string;
  sales_spv_name: string;
  salesmenDO: DOSuggestionData[];
}
// -----------------------------------------

type Step = "SUBMITTED" | "CALCULATION" | "PREPARATION";

const MainTable = () => {
  const state = usePersistAuthStore.getState();
  const user = state.user;
  const organization_name = user?.userDetail?.organization?.organization_name;
  const userNIK = user?.userDetail?.employee_id;
  const DateNow = dayjs().format("YYYY-MM-DD");
  const [calculatedResults, setCalculatedResults] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>("SUBMITTED");

  const {
    submittedList,
    isLoading: isLocalLoading,
    fetchSubmittedList,
  } = useGetLocalDoSuggestion();

  const isParamsReady = !!(organization_name && userNIK);

  const paramGetBTB = {
    CABANG: String(organization_name),
    CALL_PLAN_START_DATE: "2026-06-02",
  };

  const { data: BTBdata, isLoading: isBTBLoading } = useGetBTB(paramGetBTB, {
    enabled: isParamsReady,
  });

  useEffect(() => {
    if (organization_name) {
      fetchSubmittedList(organization_name);
    }
  }, [fetchSubmittedList, organization_name]);

  const handleBack = () => {
    if (currentStep === "CALCULATION") setCurrentStep("SUBMITTED");
    if (currentStep === "PREPARATION") setCurrentStep("CALCULATION");
  };

  // --- LOGIKA MAPPING & GROUPING ---
  const groupedAndMappedData = useMemo<GroupedSPBData[]>(() => {
    if (!submittedList || submittedList.length === 0) return [];

    const enrichedDOs = submittedList.map((doDocument) => {
      let salesmanBTB = null;

      if (BTBdata && BTBdata.length > 0) {
        salesmanBTB = BTBdata.find(
          (btbGroup) => btbGroup.SALES_NIK === doDocument.sales_nik,
        );
      }

      const updatedDetails = doDocument.details.map((doDetail: any) => {
        const skuMatch = salesmanBTB?.details.find(
          (btbLine) => btbLine.PRODUCT_SKU === doDetail.item_code,
        );

        return {
          ...doDetail,
          qty_btb: skuMatch ? skuMatch.QTY_BTB : "-",
          no_found_in_btb: !skuMatch,
        };
      });

      return {
        ...doDocument,
        details: updatedDetails,
      };
    });

    const groupedBySpv = enrichedDOs.reduce(
      (acc: Record<string, GroupedSPBData>, currentDO) => {
        const spvNik = currentDO.sales_spv_nik || "UNKNOWN";
        const spvName = currentDO.sales_spv || "Unknown Supervisor";

        if (!acc[spvNik]) {
          acc[spvNik] = {
            sales_spv_nik: spvNik,
            sales_spv_name: spvName,
            salesmenDO: [],
          };
        }

        acc[spvNik].salesmenDO.push(currentDO);
        return acc;
      },
      {},
    );

    return Object.values(groupedBySpv) as GroupedSPBData[];
  }, [submittedList, BTBdata]);

  const isLoadingAll = isLocalLoading || isBTBLoading;

  const STEP_CONFIG = {
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

  const config = STEP_CONFIG[currentStep];

  return (
    <div className="w-full space-y-4 p-4 bg-[#F8FAFC] min-h-screen">
      <PageBreadcrumb breadcrumbs={config.breadcrumbs} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            {currentStep === "SUBMITTED" && "SPB Submitted"}
            {currentStep === "CALCULATION" && "Stock on Hand & Calculation"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {currentStep !== "SUBMITTED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              startIcon={<FaArrowLeft />}
            >
              Back
            </Button>
          )}

          {currentStep === "SUBMITTED" && (
            <Button
              variant="primary"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              <FaSync className="mr-2 size-3" /> Refresh
            </Button>
          )}
        </div>
      </div>

      <div>
        {isLoadingAll ? (
          <div className="flex items-center justify-center h-64 text-slate-500 flex-col gap-3">
            <FaSync className="animate-spin text-orange-500" size={24} />
            <span className="text-sm font-medium">
              Memuat dan menyinkronkan data...
            </span>
          </div>
        ) : (
          <>
            {currentStep === "SUBMITTED" && (
              <SPBSubmittedPage
                data={groupedAndMappedData}
                onProceed={() => setCurrentStep("CALCULATION")}
              />
            )}

            {currentStep === "CALCULATION" && (
              <CalculationPage
                data={groupedAndMappedData as any}
                params={paramGetBTB}
                onProceed={(results) => {
                  setCalculatedResults(results); // Simpan hasil kalkulasi
                  setCurrentStep("PREPARATION");
                }}
              />
            )}

            {currentStep === "PREPARATION" && (
              <GoodsPreparationPage data={calculatedResults} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MainTable;
