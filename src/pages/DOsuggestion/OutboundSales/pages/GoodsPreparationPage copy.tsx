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

interface GoodsPreparationPageProps {
  targetDate: string;
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
const PrepDetailTable = ({ details }: { details: DOSuggestionDetail[] }) => {
  if (!details?.length)
    return (
      <div className="text-center py-6 text-slate-400 text-sm italic">
        Data kosong.
      </div>
    );

  const processedData = details
    .map((item: any) => {
      const finalQty = Number(item.item_qty_final) || 0;
      const btbQty = Number(item.qty_btb) || 0;
      return { ...item, finalQty, btbQty, qtyTopUp: finalQty - btbQty };
    })
    .filter((item) => item.qtyTopUp > 0);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm my-2 mx-4 overflow-hidden">
      <div className="bg-slate-50 border-b px-4 py-3 flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-700 uppercase">
          Picking List ({processedData.length} Items)
        </h4>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-[11px] uppercase sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">SKU Code</th>
              <th className="px-4 py-3 text-right">Qty Final</th>
              <th className="px-4 py-3 text-right">Qty BTB</th>
              <th className="px-4 py-3 text-right text-orange-600">Top Up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processedData.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-orange-50/40">
                <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                <td className="px-4 py-3 font-bold">{item.item_code}</td>
                <td className="px-4 py-3 text-right">{item.finalQty}</td>
                <td className="px-4 py-3 text-right font-semibold text-blue-600">
                  {item.btbQty}
                </td>
                <td className="px-4 py-3 text-right font-bold text-orange-700">
                  {item.qtyTopUp}
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
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingVisible, setLoadingVisible] = useState(false);
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
      { accessorKey: "status", header: "Status SPB" },
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

  if (isDOLoading || isBTBLoading)
    return <div className="text-center py-20 font-medium">Memuat data...</div>;

  const handleExportSummary = () => {
    exportSummaryToExcel(enrichedData, String(organization_name), targetDate);
  };

  return (
    <div className="space-y-6">
      <PremiumLoadingOverlay visible={loadingVisible} />
      <BaseTable
        data={enrichedData}
        columns={columns}
        isExpandable={true}
        renderSubComponent={(row) => <PrepDetailTable details={row.details} />}
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
