import React, { useState, useMemo, useEffect } from "react";
import { BaseTable } from "../component/BaseTable";
import Button from "../../../../components/ui/button/Button";
import { FaArrowRight, FaCalculator } from "react-icons/fa";
import { GroupedSPBData } from "../MainTable";
import { useGetStockOnHand } from "../hook/useGetStockOnHand";
import { useAllocationCalculation } from "../hook/useAllocationCalculation";
import { SKUSummaryPanel } from "../component/SKUSummaryPanel";
import { CalculationSubTable } from "../component/CalculationSubTable";
import { CallPlanBindings } from "../../../../API/types/callPlan";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { updateBatchDO } from "../../../../API/services/DOsuggestionServices/postDOsuggestion";
import { showConfirmDialog } from "../../../../components/swal-confirm";
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
  const [isInserting, setIsInserting] = useState(false);

  const effectiveSohDate = useMemo(() => {
    return dayjs(params.CALL_PLAN_START_DATE)
      .subtract(1, "day")
      .format("YYYY-MM-DD");
  }, [params.CALL_PLAN_START_DATE]);

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
    setIsCalculated(false);
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setIsCalculated(true);
    }, 3000);
  };

  useEffect(() => {
    handleCalculate();
  }, []);

  const chunkArray = (array: any[], size: number) => {
    return Array.from({ length: Math.ceil(array.length / size) }, (v, i) =>
      array.slice(i * size, i * size + size),
    );
  };

  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleInsert = (calculatedData: any[]) => {
    showConfirmDialog(
      async () => {
        setIsInserting(true);
        const BATCH_SIZE = 10;
        const batches = chunkArray(calculatedData, BATCH_SIZE);
        setProgress({ current: 0, total: batches.length });

        try {
          let batchCount = 0;
          for (const batch of batches) {
            batchCount++;
            setProgress({ current: batchCount, total: batches.length });

            // Transformasi batch menjadi format Bulk Payload
            const bulkPayload = {
              data: batch.map((salesman) => ({
                id: salesman.id,
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
                lines: salesman.details.map((detail: any, index: number) => ({
                  id: detail.id,
                  item_code: detail.item_code,
                  inventory_item_id: detail.inventory_item_id,
                  item_qty_suggestion: Number(detail.item_qty_suggestion || 0),
                  item_qty_revision: detail.item_qty_revision,
                  item_qty_submitted: Number(detail.item_qty_submitted || 0),
                  item_qty_final: detail.item_qty_final,
                  contribution_percentage: Number(
                    detail.contribution_percentage || 0,
                  ),
                  item_uom: detail.item_uom,
                  line_number: index + 1,
                })),
              })),
            };

            // Kirim seluruh batch dalam 1 request
            await updateBatchDO(bulkPayload);
            showSuccessToast(
              `Berhasil mengirim batch ${batchCount} dengan ${batch.length} SPB`,
            );
          }

          onProceed(calculatedData);
        } catch (error) {
          console.error("Gagal melakukan bulk insert:", error);
          showErrorToast("Gagal melakukan insert data ke server");
        } finally {
          setIsInserting(true);
          setProgress({ current: 0, total: 0 });
        }
      },
      {
        title: "Simpan Hasil Kalkulasi?",
        text: "Data kalkulasi stok akan disimpan ke sistem. Setelah ini, Anda akan diarahkan untuk mencetak dokumen SPB.",
        confirmButtonText: "Ya, Simpan & Lanjutkan",
        cancelButtonText: "Batal",
      },
    );
  };

  return (
    <div className="p-6">
      {!isCalculated && !isCalculating && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-white shadow-sm">
          <FaCalculator className="text-slate-400 mb-4 text-4xl" />
          <h3 className="text-lg font-semibold text-slate-700">
            Ready to Calculate?
          </h3>
        </div>
      )}

      {isCalculating && (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
          {/* Spinner */}
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-6" />

          {/* Judul Utama */}
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Processing Data...
          </h3>

          {/* Indikator Tanggal (Sesuai permintaan Anda) */}
          <div className="bg-orange-50 px-4 py-2 rounded-lg border border-orange-100 flex items-center gap-2">
            <span className="text-sm text-orange-800 font-medium">
              Sedang menarik & mengalkulasi Stock On Hand tanggal:
            </span>
            <span className="text-sm font-bold text-orange-900 bg-white px-2 py-0.5 rounded border border-orange-200">
              {effectiveSohDate}
            </span>
          </div>

          <p className="text-sm text-slate-500 mt-4 text-center max-w-xs">
            Mohon tunggu, sistem sedang memproses kalkulasi stok berdasarkan
            tanggal tersebut.
          </p>
        </div>
      )}

      {isInserting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center max-w-sm w-full">
            {/* Spinner */}
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6" />

            {/* Judul */}
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Saving Final Calculation
            </h3>

            {/* Progress */}
            <p className="text-sm text-slate-500 mb-6 text-center">
              Batch {progress.current} dari {progress.total}
            </p>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{
                  width: `${
                    progress.total > 0
                      ? (progress.current / progress.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="mt-4 text-xs text-slate-400">
              Mohon jangan menutup halaman selama proses berlangsung
            </div>
          </div>
        </div>
      )}

      {isCalculated && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <SKUSummaryPanel
            summary={skuSummary}
            onSearchChange={setGlobalFilter}
          />

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
