// File: GoodsPreparationPage.tsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { BaseTable } from "../component/BaseTable";
import {
  DOSuggestionData,
  DOSuggestionDetail,
} from "../../../../API/types/draftDOsuggestion";
import { PrintPreviewModal } from "../component/PrintPreviewModal";
import { PrintAllSKU } from "../component/PrintAllSKU"; // Import komponen baru yang dipisahkan
import { FaPrint, FaDownload, FaSyncAlt } from "react-icons/fa";
import { useGetLocalDoSuggestion } from "../../Suggestion/hook/useGetLocalDoSuggestion";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { useGetBTB } from "../hook/useGetBTB";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { exportSummaryToExcel } from "../hook/exportSummaryExcel";
import { checkAndIntegrateSPB } from "../service/integrationService";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useGetStockOnHand } from "../hook/useGetStockOnHand";
import BTBTotalBreakdown from "../component/BTBTotalBreakdown";
import dayjs from "dayjs";
import { showConfirmDialog } from "../../../../components/swal-confirm";

interface GoodsPreparationPageProps {
  targetDate: string;
}

interface PrepDetailTableProps {
  details: DOSuggestionDetail[];
  unmatchedDetails?: any[];
}

const PremiumLoadingOverlay = ({ visible, btbDate }: { visible: boolean; btbDate: string }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="relative size-12">
          <div className="absolute size-12 rounded-full border-4 border-slate-100 border-t-orange-600 animate-spin"></div>
        </div>
        <div className="text-center">
          <h3 className="text-sm font-bold text-slate-800">
            Sinkronisasi Data
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Mengambil data BTB Tanggal: <span className="text-orange-600">{btbDate}</span>
          </p>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1">
            Mohon tunggu sebentar...
          </p>
        </div>
      </div>
    </div>
  );
};

const PrepDetailTable = ({
  details,
  unmatchedDetails = [],
}: PrepDetailTableProps) => {
  const { list: itemList } = useStoreItem();

  const { pickList, excessList } = useMemo(() => {
    const picked = details
      .filter((d) => Number(d.item_qty_final) > 0)
      .map((d) => {
        const final = Number(d.item_qty_final) || 0;
        const btb = Number(d.qty_btb) || 0;
        const master = itemList?.find((m: any) => m.sku === d.item_code);
        return {
          ...d,
          itemName: master?.description || d.item_code,
          finalQty: final,
          btbQty: btb,
          topUpQty: Math.max(0, final - btb),
        };
      })
      .sort((a, b) => a.itemName.localeCompare(b.itemName));

    const excess = unmatchedDetails
      .map((u) => ({
        ...u,
        itemName:
          itemList?.find((m: any) => m.sku === (u.PRODUCT_SKU || u.item_code))
            ?.description ||
          u.PRODUCT_NAME ||
          u.item_code,
        btbQty: Number(u.QTY_BTB || u.qty_btb) || 0,
      }))
      .sort((a, b) => a.itemName.localeCompare(b.itemName));

    return { pickList: picked, excessList: excess };
  }, [details, unmatchedDetails, itemList]);

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50 border-t">
      {/* PANEL PICKING LIST (TABLE) */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-emerald-50 border-b font-bold text-xs uppercase text-slate-700">
          Picking List (Top Up) {pickList.length} Items
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-emerald-50 text-slate-500">
            <tr>
              <th className="px-3 py-2">No</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2 text-center">Qty Final</th>
              <th className="px-3 py-2 text-center">Qty BTB</th>
              <th className="px-3 py-2 text-center text-emerald-600">Top Up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pickList.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-800">
                  {i + 1}
                </td>
                <td className="px-3 py-2 font-medium text-slate-800">
                  {item.itemName}
                </td>
                <td className="px-3 py-2 text-center">{item.finalQty}</td>
                <td className="px-3 py-2 text-center text-blue-600">
                  {item.btbQty}
                </td>
                <td className="px-3 py-2 text-center font-bold text-emerald-600">
                  {item.topUpQty > 0 ? `${item.topUpQty}` : "0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PANEL UNMATCHED (TABLE) */}
      <div className="bg-white rounded-lg shadow-sm border border-rose-200 overflow-hidden">
        <div className="px-4 py-3 bg-rose-50 border-b border-rose-100 font-bold text-xs uppercase text-rose-700">
          Unmatched BTB SKU
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-rose-50 text-rose-600">
            <tr>
              <th className="px-3 py-2">No</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2 text-center">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-50">
            {excessList.map((item, i) => (
              <tr key={i} className="hover:bg-rose-50">
                <td className="px-3 py-2 font-medium text-slate-800">
                  {i + 1}
                </td>
                <td className="px-3 py-2 font-medium text-slate-800">
                  {item.itemName}
                </td>
                <td className="px-3 py-2 text-center font-bold text-rose-600">
                  {item.btbQty}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const GoodsPreparationPage = ({
  targetDate,
}: GoodsPreparationPageProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [selectedDataToPrint, setSelectedDataToPrint] =
    useState<DOSuggestionData | null>(null);

  // Ambil list item master untuk deskripsi SKU
  const { list: itemList } = useStoreItem();

  // Menyimpan list ID yang sedang/sudah di-check status integrasinya untuk menghindari request ganda
  const requestedIdsRef = useRef<Set<string>>(new Set());

  const { user } = usePersistAuthStore.getState();
  const { organizationId, organization } = user?.userDetail || {};
  const organization_name = user?.userDetail?.organization?.organization_name;

  // Hook untuk mengambil data SOH Cabang Gudang Kecil
  const { data: stockList } = useGetStockOnHand({
    org: String(organization_name),
    sub: "KECIL",
  });

  const [integrationStatus, setIntegrationStatus] = useState<Record<string, any>>({});

  // Menentukan tanggal BTB hari ini - 1 hari (format YYYY-MM-DD)
  const btbDateString = useMemo(() => {
    return dayjs().subtract(1, "day").format("YYYY-MM-DD");
  }, []);

  const {
    submittedList,
    isLoading: isDOLoading,
    fetchSubmittedList,
  } = useGetLocalDoSuggestion();

  const apiDate = submittedList?.[0]?.callplan_date_start;
  const isDateMatch = apiDate === targetDate;

  // Proteksi: Cek apakah tanggal Callplan lebih lampau dari tanggal BTB (-1)
  const isCallPlanBeforeBTB = useMemo(() => {
    if (!apiDate) return false;
    const btbCompareDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    return dayjs(apiDate).isBefore(dayjs(btbCompareDate), "day");
  }, [apiDate]);

  const {
    data: BTBdata,
    isLoading: isBTBLoading,
    error: errBTB,
    isSuccess: isBTBSuccess,
  } = useGetBTB(
    {
      CABANG: String(organization?.organization_name),
      CALL_PLAN_START_DATE: targetDate,
    },
    {
      enabled: !!(
        organization?.organization_name &&
        targetDate &&
        isDateMatch &&
        !isCallPlanBeforeBTB
      ),
    },
  );

  const isBTBEmpty = isBTBSuccess && (!BTBdata || BTBdata.length === 0);
  const isPrintDisabled = !isBTBSuccess || isBTBEmpty;

  // Tombol global disabled jika BTB gagal, kosong, atau Callplan lampau
  const isGlobalPrintDisabled = isPrintDisabled || isCallPlanBeforeBTB;

  useEffect(() => {
    if (organizationId && targetDate) {
      requestedIdsRef.current.clear(); // Bersihkan cache request ketika pindah tanggal / org
      fetchSubmittedList(targetDate, organizationId, "FINAL");
    }
  }, [organizationId, targetDate, fetchSubmittedList]);


  // Auto-fetch status integrasi ke Meta di background untuk setiap dokumen pada awal render/load
  useEffect(() => {
    if (!submittedList || submittedList.length === 0) return;

    submittedList.forEach(async (doc) => {
      // 1. Lewati jika status dari DB utama sudah menunjukkan terintegrasi
      const isDbIntegrated = ["SUCCESS", "INTEGRATED"].includes(doc.iface_status || "");
      if (isDbIntegrated) return;

      // 2. Lewati jika ID ini sedang/sudah diproses di background untuk mencegah request ganda
      if (requestedIdsRef.current.has(doc.id)) return;
      requestedIdsRef.current.add(doc.id);

      try {
        const result = await checkAndIntegrateSPB(doc.id);
        setIntegrationStatus((prev) => ({
          ...prev,
          [doc.id]: result.data,
        }));
      } catch (error) {
        console.error(`Gagal memuat status integrasi SPB ${doc.spb_number} di background:`, error);
      }
    });
  }, [submittedList]);

  useEffect(() => {
    if (errBTB) showErrorToast(errBTB);
    if (!isDOLoading && apiDate && !isDateMatch) {
      showErrorToast(`Data Error: URL (${targetDate}) != Data (${apiDate})`);
    }
  }, [isDOLoading, apiDate, targetDate, isDateMatch, errBTB]);

  // Data Mapping Rekonsiliasi SPB & BTB
  const enrichedData = useMemo(() => {
    if (!submittedList.length || isCallPlanBeforeBTB) return [];

    return submittedList.map((doc) => {
      const btbForSalesman = BTBdata?.find(
        (b) => b.SALES_NIK?.trim() === doc.sales_nik?.trim(),
      );

      const btbDetails = btbForSalesman?.details || [];
      const doSkuSet = new Set(doc.details.map((d: any) => d.item_code?.trim()));

      const matchedDetails = doc.details.map((detail: any) => {
        const matchingBtbItem = btbDetails.find(
          (b: any) =>
            (b.PRODUCT_SKU || b.item_code)?.trim() === detail.item_code?.trim(),
        );
        return {
          ...detail,
          qty_btb: matchingBtbItem ? matchingBtbItem.QTY_BTB : 0,
        };
      });

      const unmatchedBTBDetails = btbDetails.filter(
        (b: any) => !doSkuSet.has((b.PRODUCT_SKU || b.item_code)?.trim()),
      );

      return {
        ...doc,
        details: matchedDetails,
        unmatchedBTBDetails,
        rawBTBDetails: btbDetails,
        btbNumber: btbForSalesman?.BTB_NUMBER || null,
        btbDate: btbForSalesman?.TANGGAL_BTB || null,
      };
    });
  }, [submittedList, BTBdata, isCallPlanBeforeBTB]);

  // Aggregasi data SKU & Inventory ID dari seluruh SPB
  const aggregatedPickList = useMemo(() => {
    const summary: Record<string, {
      item_code: string;
      itemName: string;
      inventory_item_id: string; // Menggunakan properti dari JSON payload
      finalQty: number;
      btbQty: number;
      topUpQty: number;
      item_uom?: string; // Menggunakan properti dari JSON payload
    }> = {};

    enrichedData.forEach((doc) => {
      if (!doc.details) return;
      doc.details.forEach((d: any) => {
        const final = Number(d.item_qty_final) || 0;
        if (final <= 0) return;

        const btb = Number(d.qty_btb) || 0;
        const topUp = Math.max(0, final - btb);
        const sku = d.item_code || "";
        const invId = d.inventory_item_id || ""; // Membaca inventory_item_id dari JSON payload detail
        const key = `${sku}_${invId}`; // Pengelompokan berdasarkan SKU dan Inventory Item ID

        const master = itemList?.find((m: any) => m.sku === sku);
        const itemName = master?.description || d.item_name || sku;

        if (summary[key]) {
          summary[key].finalQty += final;
          summary[key].btbQty += btb;
          summary[key].topUpQty += topUp;
        } else {
          summary[key] = {
            item_code: sku,
            itemName,
            inventory_item_id: invId,
            finalQty: final,
            btbQty: btb,
            topUpQty: topUp,
            item_uom: "BKS",
          };
        }
      });
    });

    return Object.values(summary).sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [enrichedData, itemList]);

  // Handler: Integrasikan SPB ke Meta (Preventif & Early return jika sudah sukses)
  const handleIntegrateMeta = useCallback(async (rowData: DOSuggestionData) => {
    const rowStatus = integrationStatus[rowData.id]?.iface_status || rowData.iface_status || "";
    const isAlreadyIntegrated = ["SUCCESS", "INTEGRATED"].includes(rowStatus);

    if (isAlreadyIntegrated) {
      showSuccessToast(`Dokumen SPB ${rowData.spb_number} sudah pernah di-integrasikan sebelumnya.`);
      return;
    }

    showConfirmDialog(
      async () => {
        setLoadingVisible(true);
        try {
          const result = await checkAndIntegrateSPB(rowData.id);
          setIntegrationStatus((prev) => ({
            ...prev,
            [rowData.id]: result.data,
          }));
          showSuccessToast(`Integrasi Meta SPB ${rowData.spb_number} berhasil!`);
        } catch (error: any) {
          console.error("Gagal melakukan integrasi:", error);
          showErrorToast(error?.message || "Gagal melakukan integrasi Meta SPB");
        } finally {
          setLoadingVisible(false);
        }
      },
      {
        title: "Konfirmasi Integrasi SPB",
        text: `Apakah Anda yakin ingin mengintegrasikan dokumen SPB ${rowData.spb_number || ""} sekarang?`,
        confirmButtonText: "Ya, Integrasikan",
        cancelButtonText: "Batal",
      }
    );
  }, [integrationStatus]);

  // Handler: Buka Preview Cetak SPB (Optimasi API background)
  const handleOpenPrintPreview = useCallback(async (rowData: DOSuggestionData) => {
    setSelectedDataToPrint(rowData);
    setIsModalOpen(true);

    const rowStatus = integrationStatus[rowData.id]?.iface_status || rowData.iface_status || "";
    const isAlreadyIntegrated = ["SUCCESS", "INTEGRATED"].includes(rowStatus);

    if (!isAlreadyIntegrated) {
      try {
        const result = await checkAndIntegrateSPB(rowData.id);
        setIntegrationStatus((prev) => ({
          ...prev,
          [rowData.id]: result.data,
        }));
      } catch (error) {
        console.error("Gagal memuat status integrasi di background:", error);
      }
    }
  }, [integrationStatus]);

  const columns: ColumnDef<DOSuggestionData>[] = useMemo(
    () => [
      { accessorKey: "spb_number", header: "SPB Number" },
      { accessorKey: "sales_name", header: "Sales Name" },
      { accessorKey: "sales_nik", header: "Sales NIK" },
      { accessorKey: "sales_spv", header: "Supervisor" },
      { accessorKey: "sales_spv_nik", header: "Supervisor NIK" },
      { accessorKey: "callplan_date_start", header: "Start Date" },
      { accessorKey: "callplan_date_end", header: "End Date" },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => {
          const rowData = row.original;

          const rowStatus = integrationStatus[rowData.id]?.iface_status || rowData.iface_status || "";
          const isAlreadyIntegrated = ["SUCCESS", "INTEGRATED"].includes(rowStatus);
          const integrateTooltip = isAlreadyIntegrated
            ? "Dokumen SPB sudah berhasil di-integrasikan sebelumnya"
            : "Integrasikan ke Meta SPB";

          return (
            <div className="flex gap-2 items-center whitespace-nowrap">
              {isAlreadyIntegrated ? (
                <></>
              ) : (
                <button
                  onClick={() => handleIntegrateMeta(rowData)}
                  disabled={isGlobalPrintDisabled}
                  className={`px-3 py-1.5 text-xs font-bold text-white rounded transition-colors flex items-center gap-1.5 ${isGlobalPrintDisabled
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed border-transparent"
                    : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  title={integrateTooltip}
                >
                  <FaSyncAlt className="inline" size={11} /> Integrate Meta
                </button>
              )}

              <button
                onClick={() => handleOpenPrintPreview(rowData)}
                disabled={isGlobalPrintDisabled}
                className={`px-3 py-1.5 text-xs font-bold text-white rounded transition-colors flex items-center gap-1.5 ${isGlobalPrintDisabled
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed border-transparent"
                  : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                <FaPrint className="inline" size={11} /> Print SPB
              </button>
            </div>
          );
        },
      },
    ],
    [isGlobalPrintDisabled, integrationStatus, handleIntegrateMeta, handleOpenPrintPreview]
  );

  const handleExportSummary = () => {
    exportSummaryToExcel(enrichedData, String(organization_name), targetDate, stockList);
  };

  const isLoading = isDOLoading || (isDateMatch && isBTBLoading);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isLoading) {
      setShowLoading(true);
    } else {
      timer = setTimeout(() => {
        setShowLoading(false);
      }, 300);
    }

    return () => clearTimeout(timer);
  }, [isLoading]);

  console.log("BTBdata", BTBdata);
  console.log("enrichedData", enrichedData);

  return (
    <div className="space-y-6">
      <PremiumLoadingOverlay visible={loadingVisible || showLoading} btbDate={btbDateString} />

      <BaseTable
        data={showLoading ? [] : enrichedData}
        columns={columns}
        isExpandable={true}
        renderSubComponent={(row: any) => (
          <div className="flex flex-col gap-4 bg-slate-50/50 p-2 border-b border-slate-200">
            {(row.btbNumber || row.btbDate) && (
              <div className="flex flex-wrap gap-6 items-center bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. BTB:</span>
                  <span className="px-2 py-0.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded">
                    {row.btbNumber || "Tidak Diketahui"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal BTB:</span>
                  <span className="text-xs font-bold text-slate-800">
                    {row.btbDate ? dayjs(row.btbDate).format("DD MMMM YYYY") : "-"}
                  </span>
                </div>
              </div>
            )}

            <BTBTotalBreakdown
              title={`Total Seluruh BTB - ${row.sales_name}`}
              data={row.rawBTBDetails || []}
            />

            <PrepDetailTable
              details={row.details || []}
              unmatchedDetails={row.unmatchedBTBDetails || []}
            />
          </div>
        )}

        headerActions={
          <div className="flex items-center flex-1 w-full min-w-full gap-4">
            <div>
              {(errBTB || isBTBEmpty || isCallPlanBeforeBTB) && (
                <span className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center w-fit shadow-sm whitespace-nowrap">
                  <span className="mr-2">⚠️</span>
                  {errBTB
                    ? "DWH Error: Data BTB Gagal Ditarik, data Top Up yang ditampilkan belum dikurangi dengan data BTB"
                    : isCallPlanBeforeBTB
                      ? `Tanggal Callplan (${targetDate}) lebih lampau dari tanggal BTB (${btbDateString}). Mapping dibatalkan untuk menghindari kerancuan data!`
                      : `Data BTB tgl ${btbDateString} dari DWH untuk para Salesman masih belum tersedia!`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleExportSummary}
                disabled={isGlobalPrintDisabled}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${isGlobalPrintDisabled
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "text-slate-600 bg-white border border-slate-300 hover:bg-slate-50"
                  }`}
              >
                <FaDownload /> Summary
              </button>

              <button
                onClick={() => setIsPrintAllOpen(true)}
                disabled={isGlobalPrintDisabled}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${isGlobalPrintDisabled
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed border-transparent"
                  : "text-white bg-orange-500 border-transparent hover:bg-orange-600"
                  }`}
              >
                <FaPrint /> Print All Picklists
              </button>
            </div>
          </div>
        }
      />

      <PrintPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedDataToPrint}
        integrationInfo={selectedDataToPrint ? integrationStatus[selectedDataToPrint.id] : null}
        unmatchBTB={selectedDataToPrint ? selectedDataToPrint.unmatchedBTBDetails : []}
      />

      {/* Modal Print Preview untuk Semua SKU yang Terakumulasi */}
      <PrintAllSKU
        isOpen={isPrintAllOpen}
        onClose={() => setIsPrintAllOpen(false)}
        data={aggregatedPickList}
        targetDate={targetDate}
        organizationName={String(organization_name || organization?.organization_name || "")}
        spbCount={submittedList.length}
        callplanNumber={submittedList?.[0]?.callplan_number || "CP-" + targetDate.replace(/-/g, "")}
      />
    </div>
  );
};
