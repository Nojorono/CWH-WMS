import React, { useState, useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { BaseTable } from "../component/BaseTable";
import {
  DOSuggestionData,
  DOSuggestionDetail,
} from "../../../../API/types/draftDOsuggestion";
import { PrintPreviewModal } from "../component/PrintPreviewModal";
import { FaPrint, FaDownload } from "react-icons/fa";
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
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="relative size-12">
          <div className="absolute size-12 rounded-full border-4 border-slate-100 border-t-orange-600 animate-spin"></div>
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
  const { list: itemList } = useStoreItem();

  // Memproses data agar konsisten
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
      .sort((a, b) => a.itemName.localeCompare(b.itemName)); // Sort A-Z

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
      .sort((a, b) => a.itemName.localeCompare(b.itemName)); // Sort A-Z

    return { pickList: picked, excessList: excess };
  }, [details, unmatchedDetails, itemList]);

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50 border-t">
      {/* PANEL PICKING LIST (TABLE) */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b font-bold text-xs uppercase text-slate-700">
          Picking List (Top Up) {pickList.length} Items
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500">
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
          Unmatched BTB {excessList.length} Items
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-rose-50 text-rose-600">
            <tr>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2 text-center">Sisa Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-50">
            {excessList.map((item, i) => (
              <tr key={i} className="hover:bg-rose-50">
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

  // --- REFACTOR: Pemisahan Data Match, Unmatch, dan Raw BTB ---
  const enrichedData = useMemo(() => {
    if (!submittedList.length) return [];

    // DEBUGGING: Pilih satu salesman (misal Sodikin)
    const sodikin = submittedList.find((s) => s.sales_name.includes("SODIKIN"));
    const btbSodikin = BTBdata?.find(
      (b) => b.SALES_NIK.trim() === sodikin?.sales_nik.trim(),
    );

    if (sodikin && btbSodikin) {
      console.log("--- DEBUG SODIKIN ---");
      console.log(
        "DO Items:",
        sodikin.details.map((d) => d.item_code.trim()),
      );
      console.log(
        "BTB Items:",
        btbSodikin.details.map((b) => b.PRODUCT_SKU.trim()),
      );

      // Cari mana yang di BTB tapi tidak ada di DO
      const missing = btbSodikin.details.filter(
        (b) =>
          !sodikin.details.find(
            (d) => d.item_code.trim() === b.PRODUCT_SKU.trim(),
          ),
      );
      console.log("Item yang ada di BTB tapi hilang di DO:", missing);
    }

    return submittedList.map((doc) => {
      // 1. Ambil data BTB khusus untuk salesman ini
      const btbForSalesman = BTBdata?.find(
        (b) => b.SALES_NIK?.trim() === doc.sales_nik?.trim(),
      );

      const btbDetails = btbForSalesman?.details || [];

      // 2. Kumpulkan set SKU dari DO untuk filter unmatch
      const doSkuSet = new Set(
        doc.details.map((d: any) => d.item_code?.trim()),
      );

      // 3. Proses DO Details (Match) - Tambahkan qty_btb ke masing-masing item DO
      // 3. Proses DO Details (Match) - Tambahkan qty_btb ke masing-masing item DO
      const matchedDetails = doc.details.map((detail: any) => {
        const matchingBtbItem = btbDetails.find(
          (b: any) =>
            (b.PRODUCT_SKU || b.item_code)?.trim() === detail.item_code?.trim(),
        );
        return {
          ...detail,
          // HANYA gunakan QTY_BTB (huruf besar) dari hasil match BTB
          qty_btb: matchingBtbItem ? matchingBtbItem.QTY_BTB : 0,
        };
      });

      // 4. Proses Unmatch BTB (Excess) - Ambil barang BTB yang tidak ada di DO
      const unmatchedBTBDetails = btbDetails.filter(
        (b: any) => !doSkuSet.has((b.PRODUCT_SKU || b.item_code)?.trim()),
      );

      return {
        ...doc,
        details: matchedDetails, // Data DO yang sudah dicocokkan dengan BTB
        unmatchedBTBDetails, // Data BTB berlebih (tidak ada di DO)
        rawBTBDetails: btbDetails, // Data mentah BTB utuh milik sales ini (Untuk kalkulasi Grand Total)
      };
    });
  }, [submittedList, BTBdata]);

  const handleOpenPrintPreview = async (rowData: DOSuggestionData) => {
    setLoadingVisible(true);
    try {
      const result = await checkAndIntegrateSPB(rowData.id);
      console.log("result checkAndIntegrateSPB", result.data);
      setIntegrationStatus(result.data);

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
        // renderSubComponent Menerima row yang sudah kita proses di atas
        renderSubComponent={(row: any) => (
          <div className="flex flex-col gap-4 bg-slate-50/50 p-2 border-b border-slate-200">
            {/* Breakdown Keseluruhan BTB Sales Ini */}
            <BTBTotalBreakdown
              title={`Total Seluruh BTB - ${row.sales_name}`}
              data={row.rawBTBDetails || []}
            />

            {/* Split View Match (Kebutuhan DO) vs Unmatch (Sisa BTB) */}
            <PrepDetailTable
              details={row.details || []}
              unmatchedDetails={row.unmatchedBTBDetails || []}
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
