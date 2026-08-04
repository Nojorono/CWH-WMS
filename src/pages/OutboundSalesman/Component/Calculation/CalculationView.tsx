import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { FaArrowLeft, FaArrowRight, FaCalculator } from "react-icons/fa";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { updateBatchDO } from "../../../../API/services/DOsuggestionServices/postDOsuggestion";
import { showConfirmDialog } from "../../../../components/swal-confirm";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import Button from "../../../../components/ui/button/Button";
import { GroupedSPBData } from "../../../DOsuggestion/OutboundSales/MainTable";
import { BaseTable } from "../../../DOsuggestion/OutboundSales/component/BaseTable";
import { CalculationSubTable } from "../../../DOsuggestion/OutboundSales/component/CalculationSubTable";
import { SKUSummaryPanel } from "../../../DOsuggestion/OutboundSales/component/SKUSummaryPanel";
import { useAllocationCalculation } from "../../../DOsuggestion/OutboundSales/hook/useAllocationCalculation";
import { useGetStockOnHand } from "../../../DOsuggestion/OutboundSales/hook/useGetStockOnHand";
import { Callplan } from "../../Services/types";
import { CalculationViewProps } from "../../types/flow";

function StockCalculationView({
  callplans,
  onBack,
  onProceedToPreparation,
}: CalculationViewProps) {
  const { user } = usePersistAuthStore.getState();
  const organization_name =
    user?.userDetail?.organization?.organization_name ||
    callplans[0]?.organization?.organization_name ||
    "";

  const [globalFilter, setGlobalFilter] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const targetDate = useMemo(
    () =>
      callplans[0]?.callplan_date_start || dayjs().format("YYYY-MM-DD"),
    [callplans],
  );

  const effectiveSohDate = useMemo(
    () => dayjs(targetDate).subtract(1, "day").format("YYYY-MM-DD"),
    [targetDate],
  );

  /** SOH Gudang Kecil — sama seperti CalculationPage */
  const { data: stockList, isLoading: isSohLoading } = useGetStockOnHand({
    org: String(organization_name),
    sub: "KECIL",
  });

  /**
   * Adapt Callplan[] → GroupedSPBData[] agar reuse useAllocationCalculation.
   * Satu grup dummy: flatMap salesmenDO = daftar SPB SUBMITTED.
   */
  const groupedForCalc = useMemo<GroupedSPBData[]>(() => {
    if (!callplans.length) return [];
    return [
      {
        sales_spv_nik: "",
        sales_spv_name: "",
        salesmenDO: callplans as unknown as GroupedSPBData["salesmenDO"],
      },
    ];
  }, [callplans]);

  const { calculatedData, skuSummary } = useAllocationCalculation(
    groupedForCalc,
    Array.isArray(stockList) ? stockList : [],
  );

  const runCalculate = () => {
    setIsCalculated(false);
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setIsCalculated(true);
    }, 1200);
  };

  useEffect(() => {
    if (!organization_name || isSohLoading) return;
    runCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization_name, isSohLoading, callplans.length]);

  const chunkArray = <T,>(array: T[], size: number) =>
    Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size),
    );

  const handleInsert = (rows: any[]) => {
    if (!onProceedToPreparation) return;

    showConfirmDialog(
      async () => {
        setIsInserting(true);
        const BATCH_SIZE = 10;
        const batches = chunkArray(rows, BATCH_SIZE);
        setProgress({ current: 0, total: batches.length });

        try {
          let batchCount = 0;
          for (const batch of batches) {
            batchCount++;
            setProgress({ current: batchCount, total: batches.length });

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
                lines: (salesman.details || []).map(
                  (detail: any, index: number) => ({
                    // item_qty_submitted disamakan dengan hasil final kalkulasi
                    // agar data yang tersimpan konsisten dengan output allocation.
                    id: detail.id,
                    item_code: detail.item_code,
                    inventory_item_id: detail.inventory_item_id,
                    item_qty_suggestion: Number(
                      detail.item_qty_suggestion || 0,
                    ),
                    item_qty_revision: detail.item_qty_revision,
                    item_qty_submitted: Number(detail.item_qty_final || 0),
                    item_qty_final: Number(detail.item_qty_final || 0),
                    contribution_percentage: Number(
                      detail.contribution_percentage || 0,
                    ),
                    item_uom: detail.item_uom,
                    line_number: index + 1,
                  }),
                ),
              })),
            };

            // await updateBatchDO(bulkPayload);
            // showSuccessToast(
            //   `Berhasil mengirim batch ${batchCount} dengan ${batch.length} SPB`,
            // );

            console.log("bulkPayload", bulkPayload);

          }

          // // Map hasil kalkulasi → Callplan (status FINAL + item_qty_final)
          // const prepCallplans: Callplan[] = rows.map((row) => ({
          //   ...row,
          //   status: "FINAL",
          //   details: (row.details || []).map((d: any) => ({
          //     ...d,
          //     item_qty_final: String(d.item_qty_final ?? 0),
          //     contribution_percentage: String(
          //       d.contribution_percentage ?? "0",
          //     ),
          //   })),
          // }));

          // onProceedToPreparation(prepCallplans);
        } catch (error) {
          console.error("Gagal bulk insert kalkulasi:", error);
          showErrorToast("Gagal menyimpan hasil kalkulasi ke server");
        } finally {
          setIsInserting(false);
          setProgress({ current: 0, total: 0 });
        }
      },
      {
        title: "Simpan Hasil Kalkulasi?",
        text: "Data kalkulasi stok akan disimpan ke sistem. Setelah ini Anda diarahkan ke Goods Preparation.",
        confirmButtonText: "Ya, Simpan & Lanjutkan",
        cancelButtonText: "Batal",
      },
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">
          Stock on Hand & Calculation
        </h1>
        <div className="mt-1 flex gap-2 text-sm text-gray-500">
          <span>Home</span>
          <span>&gt;</span>
          <span>Stock on Hand & Calculation</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Memproses <strong>{callplans.length}</strong> SPB berstatus SUBMITTED
          · Callplan Date: <strong>{targetDate}</strong>
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800">
          Stock on Hand & Calculation
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded border border-[#F26522] px-4 py-1.5 text-sm font-semibold text-[#F26522] transition-colors hover:bg-orange-50"
        >
          <FaArrowLeft size={12} /> Back to SPB
        </button>
      </div>

      {(isSohLoading || isCalculating) && (
        <div className="flex animate-in fade-in flex-col items-center justify-center py-20">
          <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
          <h3 className="mb-2 text-lg font-bold text-slate-800">
            Processing Data...
          </h3>
          <div className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-4 py-2">
            <span className="text-sm font-medium text-orange-800">
              Menarik & mengalkulasi Stock On Hand tanggal:
            </span>
            <span className="rounded border border-orange-200 bg-white px-2 py-0.5 text-sm font-bold text-orange-900">
              {effectiveSohDate}
            </span>
          </div>
          <p className="mt-4 max-w-xs text-center text-sm text-slate-500">
            Mohon tunggu, sistem memproses kalkulasi stok berdasarkan SOH
            Gudang Kecil.
          </p>
        </div>
      )}

      {!isSohLoading && !isCalculating && !isCalculated && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 shadow-sm">
          <FaCalculator className="mb-4 text-4xl text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-700">
            Ready to Calculate?
          </h3>
          <button
            type="button"
            onClick={runCalculate}
            className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Hitung Alokasi SOH
          </button>
        </div>
      )}

      {isInserting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
            <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <h3 className="mb-1 text-lg font-bold text-slate-800">
              Saving Final Calculation
            </h3>
            <p className="mb-6 text-center text-sm text-slate-500">
              Batch {progress.current} dari {progress.total}
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
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

      {isCalculated && !isCalculating && !isSohLoading && (
        <div className="animate-in fade-in space-y-4 duration-500">
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
            isExpandable
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
                disabled={!onProceedToPreparation || calculatedData.length === 0}
              >
                Proceed to Goods Preparation
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}

export default StockCalculationView;
