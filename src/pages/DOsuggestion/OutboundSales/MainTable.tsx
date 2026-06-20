// MainTable.tsx

import { useState, useEffect } from "react";
import { FaArrowLeft, FaSync } from "react-icons/fa";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import { useGetLocalDoSuggestion } from "../Suggestion/hook/useGetLocalDoSuggestion";
import { usePersistAuthStore } from "../../../API/store/AuthStore/PersistAuthStore";

// Import kedua halaman
import { SPBSubmittedPage } from "./pages/SPBSubmittedPage";
import { CalculationPage } from "./pages/CalculationPage";
import { GoodsPreparationPage } from "./pages/GoodsPreparationPage";

// Definisikan tipe untuk langkah aplikasi
type Step = "SUBMITTED" | "CALCULATION" | "PREPARATION";

const MainTable = () => {
  const state = usePersistAuthStore.getState();
  const user = state.user;
  const organization_name = user?.userDetail?.organization?.organization_name;

  const { submittedList, isLoading, fetchSubmittedList } =
    useGetLocalDoSuggestion();

  // State untuk mengontrol komponen mana yang dirender
  const [currentStep, setCurrentStep] = useState<Step>("SUBMITTED");

  useEffect(() => {
    if (organization_name) {
      fetchSubmittedList(organization_name);
    }
  }, [fetchSubmittedList, organization_name]);

  // Handler untuk kembali ke halaman sebelumnya (Opsional jika ingin dibuatkan tombol Back)
  const handleBack = () => {
    if (currentStep === "CALCULATION") setCurrentStep("SUBMITTED");
    if (currentStep === "PREPARATION") setCurrentStep("CALCULATION");
  };

  console.log("currentStep", currentStep);

  return (
    <div className="w-full space-y-4 p-4 bg-[#F8FAFC] min-h-screen">
      {/* Update Breadcrumb sesuai halaman aktif */}
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Outbound Sales" },
          ...(currentStep === "CALCULATION"
            ? [{ title: "Allocation & Calculation" }]
            : []),
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            {currentStep === "SUBMITTED" && "SPB Submitted"}
            {currentStep === "CALCULATION" && "Allocation & Calculation"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Back dinamis */}
          {currentStep !== "SUBMITTED" && (
            <Button variant="outline" size="sm" onClick={handleBack} startIcon={<FaArrowLeft/>}>
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
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-500 flex-col gap-3">
            <FaSync className="animate-spin text-orange-500" size={24} />
            <span className="text-sm font-medium">Memuat data...</span>
          </div>
        ) : (
          <>
            {/* Conditional Rendering berdasarkan currentStep */}
            {currentStep === "SUBMITTED" && (
              <SPBSubmittedPage
                data={submittedList || []}
                onProceed={() => setCurrentStep("CALCULATION")}
              />
            )}

            {currentStep === "CALCULATION" && (
              <CalculationPage
                data={submittedList || []}
                onProceed={() => setCurrentStep("PREPARATION")}
              />
            )}

            {currentStep === "PREPARATION" && (
              <GoodsPreparationPage data={submittedList || []} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MainTable;
