import React, { useCallback, useState } from "react";
import SPBview from "./Component/SPB/SPBView";
import CalculationView from "./Component/Calculation/CalculationView";
import GoodPrepView from "./Component/GoodPreparation/GoodPrepView";
import { Callplan } from "./Services/types";
import { OutboundSalesmanStep } from "./types/flow";

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
        alert("Tidak ada SPB berstatus SUBMITTED yang siap untuk dikalkulasi.");
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
        alert("Tidak ada SPB FINAL yang siap untuk Print / perhitungan BTB.");
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
        alert("Gagal menyiapkan halaman Goods Preparation.");
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
    <div className="relative min-h-screen bg-gray-50">
      {isTransitioning && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="font-semibold text-slate-700 text-center px-6">
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
        <CalculationView
          callplans={callplansForCalc}
          onBack={handleBackToSubmitted}
          onProceedToPreparation={(calculated) =>
            handleProceedToPreparation(calculated)
          }
        />
      )}

      {currentStep === "PREPARATION" && (
        <GoodPrepView
          callplans={callplansForPrep}
          onBack={handleBackToSubmitted}
        />
      )}
    </div>
  );
}

export default Index;
