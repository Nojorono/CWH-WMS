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
import dayjs from "dayjs";

interface CalculationPageProps {
  data: GroupedSPBData[];
  onProceed: (data: any[]) => void;
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
  const DateNow = dayjs().format("YYYY-MM-DD");

  const { data: stockList } = useGetStockOnHand({
    org: params.CABANG,
    date: DateNow,
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

  const handleInsert = async (calculatedData: any[]) => {
    setIsCalculating(true); // Opsional: gunakan loading state yang sama

    try {
      // Kita lakukan proses insert/update per Salesman/SPB
      const updatePromises = calculatedData.map(async (salesman) => {
        // Transformasi data ke format payload yang diinginkan API
        const payload = {
          id: salesman.id, // Sesuaikan dengan key ID yang dikirim BE
          organization_id: salesman.organization_id,
          callplan_number: salesman.callplan_number,
          callplan_date_start: salesman.callplan_date_start,
          callplan_date_end: salesman.callplan_date_end,
          route_number: salesman.route_number,
          trip_type: salesman.trip_type,
          sales_nik: salesman.sales_nik,
          sales_name: salesman.sales_name,
          sales_spv: salesman.sales_spv,
          sales_spv_nik: salesman.sales_spv_nik,
          status: "FINAL",
          created_by: salesman.created_by,
          updated_by: salesman.created_by,
          spb_date: salesman.spb_date,
          spb_number: salesman.spb_number,
          // Mapping detail ke lines
          lines: salesman.details.map((detail: any, index: number) => ({
            id: detail.id,
            item_code: detail.item_code,
            inventory_item_id: detail.inventory_item_id,
            item_qty_suggestion: Number(detail.item_qty_suggestion),
            item_qty_revision: detail.item_qty_revision,
            item_qty_submitted: Number(detail.item_qty_submitted),
            item_qty_final: detail.item_qty_final,
            contribution_percentage: Number(detail.contribution_percentage),
            item_uom: detail.item_uom,
            line_number: index + 1,
          })),
        };

        return await updateDO(payload);
        console.log("PAYLOAD FINAL", payload);
      });

      // // Tunggu semua request selesai
      // await Promise.all(updatePromises);

      // // Sukses: Lanjut ke tahap berikutnya
      // onProceed(calculatedData);
    } catch (error) {
      console.error("Gagal melakukan insert ke DB:", error);
      // Tambahkan notifikasi error (toast) di sini jika perlu
    } finally {
      setIsCalculating(false);
    }
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
                // onClick={() => onProceed(calculatedData)}
                onClick={() => handleInsert(calculatedData)}
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
