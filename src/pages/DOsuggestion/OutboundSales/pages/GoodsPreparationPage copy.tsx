import React, { useState, useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { BaseTable } from "../component/BaseTable";
import {
  DOSuggestionData,
  DOSuggestionDetail,
} from "../../../../API/types/draftDOsuggestion";
import { PrintPreviewModal } from "../component/PrintPreviewModal";
import { FaPrint, FaDownload, FaCheckCircle } from "react-icons/fa";
import { useGetLocalDoSuggestion } from "../../Suggestion/hook/useGetLocalDoSuggestion";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { useGetBTB } from "../hook/useGetBTB";
import { showErrorToast } from "../../../../components/toast";
import {
  getBTBErrorMessage,
  isGetBTBTimeAllowed,
} from "../../Suggestion/global/allowedDate";
import { exportSummaryToExcel } from "../hook/exportSummaryExcel";
import { checkAndIntegrateSPB } from "../service/integrationService";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import BTBTotalBreakdown from "../component/BTBTotalBreakdown";

interface GoodsPreparationPageProps {
  targetDate: string;
}

interface PrepDetailTableProps {
  details: DOSuggestionDetail[]; // Data DO yang butuh Top Up (Match)
  unmatchedDetails?: any[]; // Data BTB yang tidak ada di DO (Unmatch/Excess)
}

const PremiumLoadingOverlay = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
        <div className="relative size-12">
          <div className="absolute size-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
        </div>
        <div className="text-center">
          <h3 className="text-sm font-bold text-slate-800">
            Sinkronisasi Data
          </h3>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
            Mohon tunggu sebentar...
          </p>
        </div>
      </div>
    </div>
  );
};

// Sub-komponen tetap dipertahankan logikanya
const PrepDetailTable = ({
  details,
  unmatchedDetails = [],
}: PrepDetailTableProps) => {
  const { fetchAll, list: itemList } = useStoreItem();

  // Fetch master items saat komponen dimuat
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- 1. PROSES DATA MATCH (TOP UP) ---
  const processedData = useMemo(() => {
    return details
      .map((item: any) => {
        const finalQty = Number(item.item_qty_final) || 0;
        const btbQty = Number(item.qty_btb) || 0;
        const qtyTopUp = finalQty - btbQty;

        const matchedItem = itemList?.find(
          (master: any) => master.sku === item.item_code,
        );
        const itemName = matchedItem ? matchedItem.description : item.item_code;

        return { ...item, finalQty, btbQty, qtyTopUp, itemName };
      })
      .filter((item) => item.qtyTopUp > 0)
      .sort((a, b) => a.itemName.localeCompare(b.itemName)); // Sort A-Z
  }, [details, itemList]);

  // --- 2. PROSES DATA UNMATCH (EXCESS) ---
  const processedUnmatchedData = useMemo(() => {
    return unmatchedDetails
      .map((item: any) => {
        // Karena data unmatch dari BTB, field SKU-nya mungkin bernama PRODUCT_SKU
        const sku = item.PRODUCT_SKU || item.item_code;
        const matchedItem = itemList?.find((master: any) => master.sku === sku);
        const itemName = matchedItem
          ? matchedItem.description
          : item.PRODUCT_NAME || sku;

        // Ambil Qty asli dari BTB
        const btbQty = Number(item.QTY_BTB) || 0;

        return { ...item, sku, btbQty, itemName };
      })
      .sort((a, b) => a.itemName.localeCompare(b.itemName)); // Sort A-Z
  }, [unmatchedDetails, itemList]);

  // Jika keduanya kosong sama sekali
  if (!details?.length && !unmatchedDetails?.length) {
    return (
      <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-sm italic mx-4 my-2">
        Tidak ada data barang untuk salesman ini.
      </div>
    );
  }

  return (
    // Wrapper Utama: Menggunakan Grid 2 Kolom di Desktop, 1 Kolom berjejer bawah di Mobile
    <div className="p-3 bg-slate-50/80 border-t border-slate-100 shadow-inner">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* =========================================
            PANEL KIRI: MATCH / PICKING LIST (TOP UP)
            ========================================= */}
        <div className="flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          {/* Header Panel Match */}
          <div className="flex justify-between items-center px-3 py-2.5 bg-slate-50 border-b border-slate-100">
            <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
              Picking List (Top Up)
              <span className="bg-emerald-100 border border-emerald-200 text-emerald-700 py-0.5 px-2 rounded-full text-[10px] font-bold">
                {processedData.length} Items
              </span>
            </h4>
          </div>

          {/* Scrollable Area Match */}
          <div className="p-2 max-h-[350px] overflow-y-auto custom-scrollbar bg-slate-50/30">
            {processedData.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Tidak ada barang yang perlu di Top Up.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 pb-1">
                {processedData.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="group flex flex-col p-2.5 bg-white border border-slate-200 rounded-lg hover:border-emerald-400 hover:shadow-md transition-all duration-200 cursor-default relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-1 h-full bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-start gap-2.5 mb-2">
                      <span className="flex-shrink-0 flex items-center justify-center min-w-[24px] h-6 rounded-md bg-slate-50 border border-slate-100 text-slate-400 text-[10px] font-bold group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col overflow-hidden w-full">
                        <span
                          className="text-xs font-bold text-slate-800 truncate"
                          title={item.itemName}
                        >
                          {item.itemName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {item.item_code}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-auto pt-2 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                          Final Qty
                        </span>
                        <span className="text-sm font-semibold text-slate-700">
                          {item.finalQty}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                          Qty BTB
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                          {item.btbQty}
                        </span>
                      </div>
                      <div className="flex flex-col items-end border-l border-slate-100 pl-2">
                        <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold">
                          Top Up
                        </span>
                        <span className="text-sm font-bold text-emerald-600">
                          +{item.qtyTopUp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* =========================================
            PANEL KANAN: UNMATCH / EXCESS (SISA BTB)
            ========================================= */}
        <div className="flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          {/* Header Panel Unmatch */}
          <div className="flex justify-between items-center px-3 py-2.5 bg-slate-50 border-b border-slate-100">
            <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
              Unmatched BTB (Sisa)
              <span className="bg-rose-100 border border-rose-200 text-rose-700 py-0.5 px-2 rounded-full text-[10px] font-bold">
                {processedUnmatchedData.length} Items
              </span>
            </h4>
          </div>

          {/* Scrollable Area Unmatch */}
          <div className="p-2 max-h-[350px] overflow-y-auto custom-scrollbar bg-slate-50/30">
            {processedUnmatchedData.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Semua barang BTB terpakai di DO.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 pb-1">
                {processedUnmatchedData.map((item, idx) => (
                  <div
                    key={idx}
                    className="group flex flex-col p-2.5 bg-white border border-slate-200 rounded-lg hover:border-rose-400 hover:shadow-md transition-all duration-200 cursor-default relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-1 h-full bg-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-start gap-2.5 mb-2">
                      <span className="flex-shrink-0 flex items-center justify-center min-w-[24px] h-6 rounded-md bg-slate-50 border border-slate-100 text-slate-400 text-[10px] font-bold group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col overflow-hidden w-full">
                        <span
                          className="text-xs font-bold text-slate-800 truncate"
                          title={item.itemName}
                        >
                          {item.itemName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {item.sku}
                        </span>
                      </div>
                    </div>

                    {/* Untuk Unmatch, kita hanya tampilkan QTY Sisa (Bawaan BTB) */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                      <span className="text-[9px] uppercase tracking-wider text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-sm">
                        Tidak ada di DO
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                          Sisa QTY
                        </span>
                        <span className="text-sm font-bold text-rose-600">
                          {item.btbQty}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const GoodsPreparationPage = ({
  targetDate,
}: GoodsPreparationPageProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [selectedDataToPrint, setSelectedDataToPrint] =
    useState<DOSuggestionData | null>(null);

  const { user } = usePersistAuthStore.getState();
  const { organizationId, organization } = user?.userDetail || {};
  const organization_name = user?.userDetail?.organization?.organization_name;

  const [integrationStatus, setIntegrationStatus] = useState<any>(null);

  const {
    submittedList,
    isLoading: isDOLoading,
    fetchSubmittedList,
  } = useGetLocalDoSuggestion();

  const apiDate = submittedList?.[0]?.callplan_date_start;
  const isDateMatch = apiDate === targetDate;
  const isTimeAllowed = isGetBTBTimeAllowed(apiDate);

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
        isTimeAllowed
      ),
    },
  );

  useEffect(() => {
    if (organizationId && targetDate)
      fetchSubmittedList(targetDate, organizationId, "FINAL");
  }, [organizationId, targetDate, fetchSubmittedList]);

  useEffect(() => {
    if (errBTB) showErrorToast(errBTB);
    if (!isDOLoading && apiDate && (!isDateMatch || !isTimeAllowed)) {
      showErrorToast(
        !isDateMatch
          ? `Data Error: URL (${targetDate}) != Data (${apiDate})`
          : getBTBErrorMessage(apiDate),
      );
    }
  }, [isDOLoading, apiDate, targetDate, isDateMatch, isTimeAllowed, errBTB]);

  const enrichedData = useMemo(() => {
    if (!submittedList.length || !BTBdata?.length) return submittedList;

    // DEBUGGING: Pilih satu salesman (misal Sodikin)
    const sodikin = submittedList.find(s => s.sales_name.includes("SODIKIN"));
    const btbSodikin = BTBdata?.find(b => b.SALES_NIK.trim() === sodikin?.sales_nik.trim());

    if (sodikin && btbSodikin) {
        console.log("--- DEBUG SODIKIN ---");
        console.log("DO Items:", sodikin.details.map(d => d.item_code.trim()));
        console.log("BTB Items:", btbSodikin.details.map(b => b.PRODUCT_SKU.trim()));
        
        // Cari mana yang di BTB tapi tidak ada di DO
        const missing = btbSodikin.details.filter(b => 
            !sodikin.details.find(d => d.item_code.trim() === b.PRODUCT_SKU.trim())
        );
        console.log("Item yang ada di BTB tapi hilang di DO:", missing);
    }

    
    return submittedList.map((doc) => ({
      ...doc,
      details: doc.details.map((detail: any) => {
        const btb = BTBdata.find(
          (b) => b.SALES_NIK.trim() === doc.sales_nik.trim(),
        )?.details.find(
          (d: any) => d.PRODUCT_SKU.trim() === detail.item_code.trim(),
        );
        return { ...detail, qty_btb: btb ? btb.QTY_BTB : 0 };
      }),
    }));
  }, [submittedList, BTBdata]);

  const handleOpenPrintPreview = async (rowData: DOSuggestionData) => {
    setLoadingVisible(true);
    try {
      // Panggil service kita
      const result = await checkAndIntegrateSPB(rowData.id);

      console.log("result checkAndIntegrateSPB", result.data);

      // Simpan hasilnya ke state
      setIntegrationStatus(result.data);

      // Tunggu animasi agar premium
      await new Promise((r) => setTimeout(r, 800));

      setSelectedDataToPrint(rowData);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Gagal melakukan integrasi:", error);
    } finally {
      setLoadingVisible(false);
    }
  };

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
        cell: ({ row }) => (
          <button
            onClick={() => handleOpenPrintPreview(row.original)}
            className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            <FaPrint className="inline mr-1" /> Print SPB
          </button>
        ),
      },
    ],
    [],
  );

  const handleExportSummary = () => {
    exportSummaryToExcel(enrichedData, String(organization_name), targetDate);
  };

  const isLoading =
    isDOLoading || (isDateMatch && isTimeAllowed && isBTBLoading);

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

  return (
    <div className="space-y-6">
      <PremiumLoadingOverlay visible={loadingVisible || showLoading} />

      <BaseTable
        data={showLoading ? [] : enrichedData}
        columns={columns}
        isExpandable={true}
        renderSubComponent={(row) => (
          <div className="flex flex-col gap-4">
            <BTBTotalBreakdown
              title={`Total BTB - ${row.sales_name}`}
              data={row.details}
            />
            <PrepDetailTable
              details={row.details}
              unmatchedDetails={row.details}
            />
          </div>
        )}
        headerActions={
          <div className="flex items-center flex-1 w-full min-w-full gap-4">
            <div>
              {(!isTimeAllowed || errBTB) && (
                <span className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center w-fit shadow-sm whitespace-nowrap">
                  <span className="mr-2">⚠️</span>
                  {errBTB
                    ? "DWH Error: Data BTB Gagal Ditarik, data yang ditampilkan belum dikurangi dengan data BTB"
                    : "Belum Masuk Waktu Tarik BTB"}
                </span>
              )}
            </div>

            {/* --- BAGIAN KANAN: Tombol Aksi --- */}
            {/* 2. Tambahkan ml-auto di sini. Ini adalah kunci untuk mendorong elemen ke ujung kanan! */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleExportSummary}
                disabled={!isBTBSuccess || !isTimeAllowed}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
                  !isBTBSuccess || !isTimeAllowed
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "text-slate-600 bg-white border border-slate-300 hover:bg-slate-50"
                }`}
              >
                <FaDownload /> Summary
              </button>

              <button
                disabled={!isBTBSuccess || !isTimeAllowed}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
                  !isBTBSuccess || !isTimeAllowed
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
        integrationInfo={integrationStatus}
      />
    </div>
  );
};
