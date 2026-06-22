import React, { useState, useMemo } from "react";
import { BaseTable } from "../component/BaseTable";
import Button from "../../../../components/ui/button/Button";
import { FaArrowRight, FaCalculator } from "react-icons/fa";
import { GroupedSPBData } from "../MainTable";
import { useGetStockOnHand } from "../hook/useGetStockOnHand";
import { FaRecycle } from "react-icons/fa6";
import { useAllocationCalculation } from "../hook/useAllocationCalculation";
import { SKUSummaryPanel } from "../component/SKUSummaryPanel";
import { CalculationSubTable } from "../component/CalculationSubTable";
import { CallPlanBindings } from "../../../../API/types/callPlan";

interface CalculationPageProps {
  data: GroupedSPBData[];
  onProceed: () => void;
  params: CallPlanBindings;
}

export const CalculationPage = ({
  data,
  onProceed,
  params,
}: CalculationPageProps) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);

  const { data: stockList } = useGetStockOnHand({
    org: params.CABANG,
    date: params.CALL_PLAN_START_DATE,
    sub: "KECIL",
  });

  // Panggil hook logika di sini
  const { calculatedData, skuSummary } = useAllocationCalculation(
    data,
    stockList,
  );

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setIsCalculated(true);
    }, 2000);
  };

  return (
    <div className="p-6">
      {!isCalculated && !isCalculating && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-white shadow-sm">
          <FaCalculator className="text-slate-400 mb-4 text-4xl" />
          <h3 className="text-lg font-semibold text-slate-700">
            Ready to Calculate?
          </h3>
          <Button
            onClick={handleCalculate}
            variant="primary"
            endIcon={<FaArrowRight />}
          >
            Calculate Stock Allocation
          </Button>
        </div>
      )}

      {isCalculating && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-600 font-medium">
            Processing allocation logic...
          </p>
        </div>
      )}

      {isCalculated && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <SKUSummaryPanel
            summary={skuSummary}
            onSearchChange={setGlobalFilter}
          />

          <div className="flex justify-end">
            <Button
              onClick={() => setIsCalculated(false)}
              variant="outline"
              className="text-xs"
              startIcon={<FaRecycle />}
            >
              Re-calculate
            </Button>
          </div>

          <BaseTable
            data={calculatedData}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            columns={[
              { accessorKey: "spb_number", header: "SPB Number" },
              { accessorKey: "sales_name", header: "Nama Sales" },
              { accessorKey: "sales_nik", header: "NIK Sales" },
              {
                id: "total_sku",
                header: "Total SKU",
                cell: ({ row }) => row.original.details?.length || 0,
              },
            ]}
            isExpandable={true}
            renderSubComponent={(row, filter) => (
              <CalculationSubTable
                details={row.details}
                globalFilter={filter}
              />
            )}
            footerAction={
              <Button
                onClick={onProceed}
                variant="primary"
                endIcon={<FaArrowRight />}
              >
                Proceed to Goods Preparation
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
};
