// import React, { useState, useMemo, useEffect } from "react";
// import { ColumnDef } from "@tanstack/react-table";
// import { BaseTable } from "../component/BaseTable";
// import {
//   DOSuggestionData,
//   DOSuggestionDetail,
// } from "../../../../API/types/draftDOsuggestion";
// import { PrintPreviewModal } from "../component/PrintPreviewModal";
// import { FaPrint, FaDownload, FaCheckCircle } from "react-icons/fa";
// import { useGetLocalDoSuggestion } from "../../Suggestion/hook/useGetLocalDoSuggestion";
// import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
// import { useGetBTB } from "../hook/useGetBTB";
// import { showErrorToast } from "../../../../components/toast";
// import {
//   getBTBErrorMessage,
//   isGetBTBTimeAllowed,
// } from "../../Suggestion/global/allowedDate";
// import { exportSummaryToExcel } from "../hook/exportSummaryExcel";
// import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

// interface GoodsPreparationPageProps {
//   targetDate: string;
// }

// // --- SUB-TABLE KHUSUS UNTUK GOODS PREPARATION ---
// const PrepDetailTable = ({ details }: { details: DOSuggestionDetail[] }) => {
//   if (!details || !Array.isArray(details) || details.length === 0) {
//     return (
//       <div className="text-center py-6 bg-slate-50 text-slate-400 text-sm italic border border-slate-200 rounded-lg mx-4 my-2">
//         Data detail item tidak ditemukan atau kosong.
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden my-2 mx-4">
//       <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
//         <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
//           Picking List ({details.length} Items)
//         </h4>
//         <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
//           <FaCheckCircle /> All items locked
//         </span>
//       </div>
//       <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
//         <table className="w-full text-left text-sm text-slate-600">
//           <thead className="bg-slate-50/90 text-slate-500 font-semibold text-[11px] uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-200 backdrop-blur-sm">
//             <tr>
//               <th className="px-4 py-3 w-12 text-center">No.</th>
//               <th className="px-4 py-3">SKU Code</th>
//               <th className="px-4 py-3 text-right">Qty Final SPB</th>
//               <th className="px-4 py-3 text-right">Qty BTB</th>
//               <th className="px-4 py-3 text-right font-extrabold text-orange-600">
//                 Top Up
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100 bg-white">
//             {details
//               .map((item: any) => {
//                 const finalQty = Number(item.item_qty_final) || 0;
//                 // Sekarang qty_btb dari parent (hasil mapping) digunakan di sini
//                 const btbQty = Number(item.qty_btb) || 0;
//                 const qtyTopUp = finalQty - btbQty;
//                 return { ...item, finalQty, btbQty, qtyTopUp };
//               })
//               .filter((item: any) => item.qtyTopUp > 0)
//               .map((item: any, idx: number) => (
//                 <tr
//                   key={item.id || item.item_code || idx}
//                   className="hover:bg-orange-50/40 transition-colors group"
//                 >
//                   <td className="px-4 py-3 text-center text-slate-400 font-medium w-12">
//                     {idx + 1}
//                   </td>
//                   <td className="px-4 py-3 font-bold text-slate-800">
//                     {item.item_code}
//                   </td>
//                   <td className="px-4 py-3 text-right font-medium text-slate-600 tabular-nums">
//                     {item.finalQty}
//                   </td>
//                   <td className="px-4 py-3 text-right font-semibold text-blue-600 tabular-nums">
//                     {item.btbQty}
//                   </td>
//                   <td className="px-4 py-3 text-right">
//                     <span className="inline-block px-3 py-1 bg-orange-100/50 text-orange-700 font-bold text-base rounded-lg tabular-nums border border-orange-200/50 group-hover:bg-orange-100 transition-colors">
//                       {item.qtyTopUp}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// // --- MAIN COMPONENT ---
// export const GoodsPreparationPage = ({
//   targetDate,
// }: GoodsPreparationPageProps) => {
//   const [globalFilter, setGlobalFilter] = useState("");
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedDataToPrint, setSelectedDataToPrint] =
//     useState<DOSuggestionData | null>(null);

//   const { user } = usePersistAuthStore.getState();
//   const organization_id = user?.userDetail?.organizationId;
//   const organization_name = user?.userDetail?.organization?.organization_name;

//   const {
//     submittedList,
//     isLoading: isDOLoading,
//     fetchSubmittedList,
//   } = useGetLocalDoSuggestion();

//   // 2. Ekstrak tanggal dari data API (Asumsi bentuknya Array)
//   const apiDate = submittedList?.[0]?.callplan_date_start;
//   const isDateMatch = apiDate === targetDate;
//   const isTimeAllowed = isGetBTBTimeAllowed(apiDate);

//   const paramGetBTB = useMemo(
//     () => ({
//       CABANG: String(organization_name),
//       CALL_PLAN_START_DATE: targetDate,
//     }),
//     [organization_name, targetDate],
//   );

//   const {
//     data: BTBdata,
//     isLoading: isBTBLoading,
//     error: errBTB,
//     isSuccess: isBTBSuccess,
//   } = useGetBTB(paramGetBTB, {
//     enabled: !!(
//       organization_name &&
//       targetDate &&
//       isDateMatch &&
//       isTimeAllowed
//     ),
//   });

//   useEffect(() => {
//     if (errBTB) {
//       showErrorToast(errBTB);
//     }

//     // Pastikan loading lokal selesai dan data ada
//     if (!isDOLoading && apiDate) {
//       if (!isDateMatch) {
//         showErrorToast(
//           `Data Error: URL (${targetDate}) berbeda dengan Data (${apiDate})`,
//         );
//       } else if (!isTimeAllowed) {
//         showErrorToast(getBTBErrorMessage(apiDate));
//       }
//     }
//   }, [isDOLoading, apiDate, targetDate, isDateMatch, isTimeAllowed]);

//   useEffect(() => {
//     if (organization_id && targetDate) {
//       fetchSubmittedList(targetDate, organization_id, "FINAL");
//     }
//   }, [organization_id, targetDate, fetchSubmittedList]);

//   const enrichedData = useMemo(() => {
//     if (!submittedList.length || !BTBdata?.length) return submittedList;

//     return submittedList.map((doDocument) => {
//       const salesmanBTB = BTBdata.find(
//         (btb) => btb.SALES_NIK.trim() === doDocument.sales_nik.trim(),
//       );

//       const updatedDetails = doDocument.details.map((doDetail: any) => {
//         const skuMatch = salesmanBTB?.details.find(
//           (btbLine: any) =>
//             btbLine.PRODUCT_SKU.trim() === doDetail.item_code.trim(),
//         );

//         return { ...doDetail, qty_btb: skuMatch ? skuMatch.QTY_BTB : 0 };
//       });

//       return { ...doDocument, details: updatedDetails };
//     });
//   }, [submittedList, BTBdata]);

//   const handleOpenPrintPreview = async (rowData: DOSuggestionData) => {

//     setSelectedDataToPrint(rowData);
//     setIsModalOpen(true);
//     const idData = rowData.id;

//     // buatkan srvice untuk cek ke table integration, header id ini sudah ada atau belum,
//     // jika belum maka jalankan integrasi, jika sudah ada maka cek integrasinya sudah SUccess atau error? jika error maka hit ulang saja
//     // dan jika sudah ada dalam table namun sudah success, maka tak usah lakukan apa apa, lanjutkan proses print SPB

//     try {
//       const response = await axiosInstance.post(
//         `/do-suggestion/${idData}/integrate`,
//       );
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   };

//   const columns = useMemo<ColumnDef<DOSuggestionData>[]>(
//     () => [
//       { accessorKey: "spb_number", header: "SPB Number" },
//       { accessorKey: "sales_name", header: "Sales Name" },
//       { accessorKey: "sales_spv", header: "Supervisor" },
//       { accessorKey: "callplan_date_start", header: "Callplan Start Date" },
//       { accessorKey: "callplan_date_end", header: "Callplan End Date" },
//       {
//         id: "total_items",
//         header: "Total SKU to Pick",
//         cell: ({ row }) => {
//           const details = row.original.details || [];
//           const count = details.filter(
//             (d: any) => Number(d.item_qty_final) > 0,
//           ).length;
//           return <span className="font-semibold">{count}</span>;
//         },
//       },
//       { accessorKey: "status", header: "Status SPB" },
//       {
//         id: "action",
//         header: "Action",
//         cell: ({ row }) => (
//           <button
//             onClick={() => handleOpenPrintPreview(row.original)}
//             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 hover:shadow-md transition-all"
//           >
//             <FaPrint /> Print SPB
//           </button>
//         ),
//       },
//     ],
//     [],
//   );

//   const isLoading = isDOLoading || isBTBLoading;

//   if (isLoading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20">
//         <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
//         <p className="text-slate-600 font-medium">
//           Memuat data persiapan barang & BTB...
//         </p>
//       </div>
//     );
//   }

//   if (!enrichedData || enrichedData.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm mt-4">
//         <p className="text-slate-500 font-medium">
//           Belum ada data SPB dengan status FINAL.
//         </p>
//       </div>
//     );
//   }

//   const handleExportSummary = () => {
//     exportSummaryToExcel(enrichedData, String(organization_name), targetDate);
//   };

//   return (
//     <div className="space-y-6 animate-in fade-in duration-500">
//       <BaseTable
//         data={enrichedData} // Gunakan data yang sudah di-enrich dengan BTB
//         columns={columns}
//         globalFilter={globalFilter}
//         setGlobalFilter={setGlobalFilter}
//         isExpandable={true}
//         renderSubComponent={(row) => <PrepDetailTable details={row.details} />}
//         headerActions={
//           <div className="flex items-center flex-1 w-full min-w-full gap-4">
//             <div>
//               {(!isTimeAllowed || errBTB) && (
//                 <span className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center w-fit shadow-sm whitespace-nowrap">
//                   <span className="mr-2">⚠️</span>
//                   {errBTB
//                     ? "DWH Error: Data BTB Gagal Ditarik, data yang ditampilkan belum dikurangi dengan data BTB"
//                     : "Belum Masuk Waktu Tarik BTB"}
//                 </span>
//               )}
//             </div>

//             {/* --- BAGIAN KANAN: Tombol Aksi --- */}
//             {/* 2. Tambahkan ml-auto di sini. Ini adalah kunci untuk mendorong elemen ke ujung kanan! */}
//             <div className="flex items-center gap-2 ml-auto">
//               <button
//                 onClick={handleExportSummary}
//                 disabled={!isBTBSuccess || !isTimeAllowed}
//                 className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
//                   !isBTBSuccess || !isTimeAllowed
//                     ? "bg-slate-200 text-slate-400 cursor-not-allowed"
//                     : "text-slate-600 bg-white border border-slate-300 hover:bg-slate-50"
//                 }`}
//               >
//                 <FaDownload /> Summary
//               </button>

//               <button
//                 disabled={!isBTBSuccess || !isTimeAllowed}
//                 className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
//                   !isBTBSuccess || !isTimeAllowed
//                     ? "bg-slate-200 text-slate-400 cursor-not-allowed border-transparent"
//                     : "text-white bg-orange-500 border-transparent hover:bg-orange-600"
//                 }`}
//               >
//                 <FaPrint /> Print All Picklists
//               </button>
//             </div>
//           </div>
//         }
//       />

//       {/* <PrintPreviewModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         data={selectedDataToPrint}
//       /> */}
//     </div>
//   );
// };

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
