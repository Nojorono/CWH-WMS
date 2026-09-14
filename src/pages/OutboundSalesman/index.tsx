import React, { lazy, Suspense, useCallback, useState } from "react";
import SPBview from "./Component/SPB/SPBView";
import { Callplan } from "./types/CallplanTypes";
import { OutboundSalesmanStep } from "./types/flow";
import { showErrorToast } from "../../components/toast";
import DeferredMount from "../../components/common/DeferredMount";

/** Lazy: jangan parse Calculation/GoodPrep saat buka SPB Overview saja */
const CalculationView = lazy(
  () => import("./Component/Calculation/CalculationView"),
);
const GoodPrepView = lazy(
  () => import("./Component/GoodPreparation/GoodPrepView"),
);

const StepFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
  </div>
);

/**
 * Outbound Salesman – clean step flow
 * - SUBMITTED → Calculation (SOH + rumus)
 * - FINAL     → Goods Preparation langsung (Print + BTB)
 */
function Index() {
  const [currentStep, setCurrentStep] =
    useState<OutboundSalesmanStep>("SUBMITTED");
  const [callplansForCalc, setCallplansForCalc] = useState<Callplan[]>([]);
  const [callplansForPrep, setCallplansForPrep] = useState<Callplan[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState("");

  const handleProceedToCalculation = useCallback(
    async (callplans: Callplan[]) => {
      const submitted = callplans.filter(
        (cp) => String(cp.status || "").toUpperCase() === "SUBMITTED",
      );

      if (submitted.length === 0) {
        showErrorToast(
          "Tidak ada SPB berstatus SUBMITTED yang siap untuk dikalkulasi.",
        );
        return;
      }

      setCallplansForCalc(submitted);
      setCurrentStep("CALCULATION");
    },
    [],
  );

  const handleProceedToPreparation = useCallback(
    async (callplans?: Callplan[]) => {
      const source = callplans ?? callplansForCalc;
      const finalList = source.filter(
        (cp) => String(cp.status || "").toUpperCase() === "FINAL",
      );

      // Dari Calculation: data mungkin masih SUBMITTED sebelum submit;
      // dari SPB FINAL filter: wajib ada FINAL.
      const prepList =
        finalList.length > 0 ? finalList : source.length > 0 ? source : [];

      if (prepList.length === 0) {
        showErrorToast(
          "Tidak ada SPB FINAL yang siap untuk Print / perhitungan BTB.",
        );
        return;
      }

      setTransitionLabel(
        `Menyiapkan Goods Preparation (Print & BTB)... (${prepList.length} SPB)`,
      );
      setIsTransitioning(true);
      setCallplansForPrep(prepList);

      try {
        // TODO: ganti dengan fetch BTB + prepare print data
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCurrentStep("PREPARATION");
      } catch (error) {
        console.error("Gagal menuju Goods Preparation:", error);
        showErrorToast("Gagal menyiapkan halaman Goods Preparation.");
      } finally {
        setIsTransitioning(false);
        setTransitionLabel("");
      }
    },
    [callplansForCalc],
  );

  const handleBackToSubmitted = useCallback(() => {
    setCurrentStep("SUBMITTED");
  }, []);

  return (
    <DeferredMount delayMs={180}>
      <div className="relative min-h-screen bg-gray-50">
        {isTransitioning && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="px-6 text-center font-semibold text-slate-700">
              {transitionLabel || "Memproses..."}
            </p>
          </div>
        )}

        {currentStep === "SUBMITTED" && (
          <SPBview
            onProceedToCalculation={handleProceedToCalculation}
            onProceedToPreparation={handleProceedToPreparation}
          />
        )}

        {currentStep === "CALCULATION" && (
          <Suspense fallback={<StepFallback />}>
            <CalculationView
              callplans={callplansForCalc}
              onBack={handleBackToSubmitted}
              onProceedToPreparation={(calculated) =>
                handleProceedToPreparation(calculated)
              }
            />
          </Suspense>
        )}

        {currentStep === "PREPARATION" && (
          <Suspense fallback={<StepFallback />}>
            <GoodPrepView
              callplans={callplansForPrep}
              onBack={handleBackToSubmitted}
              onCallplansUpdated={setCallplansForPrep}
            />
          </Suspense>
        )}
      </div>
    </DeferredMount>
  );
}

export default Index;
