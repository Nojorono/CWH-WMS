import React, { useEffect, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { FaPrint, FaTimes } from "react-icons/fa";
import dayjs from "dayjs";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any | null;
  integrationInfo: any;
  unmatchBTB?: any[];
}

export const PrintPreviewModal = ({
  isOpen,
  onClose,
  data,
  integrationInfo,
  unmatchBTB
}: PrintPreviewModalProps) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const status = integrationInfo?.iface_status || "";
  const isIntegrated = ["SUCCESS", "INTEGRATED"].includes(status);
  const buttonLabel = isIntegrated ? "Re-Print Struk" : "Cetak Struk";

  const { fetchAll, list: itemList } = useStoreItem();
  useEffect(() => {
    fetchAll();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `SPB_${data?.spb_number || "Document"}`,
    pageStyle: `
      @page {
        size: auto;
        margin: 0mm;
      }
      @media print {
        html, body {
          margin: 0;
          padding: 0;
          background-color: white;
        }
      }
    `,
  });

  // ============================================================================
  // ⚡ LOGIKA PERSIAPAN DATA (Diletakkan di atas sebelum early return)
  // ============================================================================

  // 1. Proses data UNMATCHED BTB (tampil di paling atas, diurutkan sesuai abjad)
  const processedUnmatched = useMemo(() => {
    if (!isOpen || !data) return [];
    return (unmatchBTB || [])
      .map((item: any) => {
        const btbQty = Number(item.QTY_BTB || item.qty_btb || 0);
        const sku = item.PRODUCT_SKU || item.item_code;
        const matchedItem = itemList?.find((master: any) => master.sku === sku);
        const itemName = item.PRODUCT_NAME || (matchedItem ? matchedItem.description : sku);
        return {
          id: sku || Math.random().toString(),
          item_description: itemName,
          item_qty_submitted: "-", // SPB ditulis "-"
          calculated_btb: btbQty,
          calculated_top_up: `-${btbQty}`, // TOP UP ditulis dengan minus (contoh: -25)
          is_unmatched: true,
        };
      })
      .sort((a, b) => a.item_description.localeCompare(b.item_description));
  }, [isOpen, data, unmatchBTB, itemList]);

  // 2. Proses data MATCHED SPB (tampil di bawah unmatched, diurutkan abjad, termasuk top up 0)
  const processedDetails = useMemo(() => {
    if (!isOpen || !data?.details) return [];
    return data.details
      .map((item: any) => {
        const btbQty = item.qty_btb && item.qty_btb !== "-" ? Number(item.qty_btb) : 0;
        const finalQty = Number(item.item_qty_final || 0);
        const topUpValue = finalQty - btbQty;
        const matchedItem = itemList?.find(
          (master: any) => master.sku === item.item_code,
        );
        const itemName = matchedItem ? matchedItem.description : item.item_code;
        return {
          ...item,
          calculated_btb: btbQty,
          calculated_top_up: topUpValue > 0 ? topUpValue : 0, // Menampilkan top-up 0
          item_description: itemName,
          is_unmatched: false,
        };
      })
      .sort((a: any, b: any) => a.item_description.localeCompare(b.item_description));
  }, [isOpen, data?.details, itemList]);

  // 3. Gabungkan: Unmatched di atas, Matched di bawah
  const finalTableItems = useMemo(() => {
    if (!isOpen || !data) return [];
    return [...processedUnmatched, ...processedDetails];
  }, [isOpen, data, processedUnmatched, processedDetails]);


  // ============================================================================
  // 🚪 EARLY RETURN DILETAKKAN DI BAWAH HOOKS
  // ============================================================================
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex justify-center">
        {/* Header Modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <FaPrint className="text-orange-500" /> Print Preview
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Print Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200">
          <div
            ref={componentRef}
            className="bg-white shadow-md w-full max-w-[380px] p-6 print:p-0 print:px-4 print:pt-4 print:pb-8 text-[12px] text-black relative mx-auto h-fit"
            style={{ fontFamily: "monospace" }}
          >
            {/* Kop Dokumen */}
            <div className="text-center mb-4">
              <h2 className="font-extrabold text-base tracking-widest uppercase">
                SPB AMO {data.organization?.organization_name || "CABANG"}
              </h2>
              <div className="border-b-2 border-black border-dashed mt-2"></div>
            </div>

            {/* Info Dokumen */}
            <div className="grid grid-cols-[90px_10px_1fr] gap-y-1.5 mb-5 font-semibold leading-snug">
              <span>Tanggal SPB</span>
              <span>:</span>
              <span className="break-words">
                {dayjs(data.createdAt).format("DD-MM-YYYY, HH:mm")}
              </span>

              <span>No. SPB</span>
              <span>:</span>
              <span className="break-all">{data.spb_number}</span>

              <span>NIK Salesman</span>
              <span>:</span>
              <span className="break-words">{data.sales_nik}</span>

              <span>Nama Salesman</span>
              <span>:</span>
              <span className="break-words leading-tight">
                {data.sales_name}
              </span>
            </div>

            <div className="border-b-2 border-black border-dashed mb-2"></div>

            {/* Tabel Item */}
            <table className="w-full text-left text-black text-[12px] table-fixed mb-4">
              <thead>
                <tr className="border-b border-black border-dashed">
                  <th className="py-2 w-[40%] font-bold align-bottom">SKU</th>
                  <th className="py-2 w-[18%] font-bold text-right align-bottom">
                    SPB
                  </th>
                  <th className="py-2 w-[18%] font-bold text-right align-bottom">
                    BTB
                  </th>
                  <th className="py-2 w-[24%] font-bold text-right align-bottom">
                    SISA BTB
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-black divide-dashed">
                {finalTableItems.length > 0 ? (
                  finalTableItems.map((item: any, idx: number) => (
                    <tr key={item.id || idx}>
                      <td className="py-2.5 font-bold pr-1 break-words">
                        {item.item_description}
                      </td>
                      <td className="py-2.5 text-right font-medium pr-1">
                        {item.item_qty_submitted}
                      </td>
                      <td className="py-2.5 text-right font-medium pr-1">
                        {item.calculated_btb === 0 ? "-" : item.calculated_btb}
                      </td>
                      <td className="py-2.5 text-right text-[14px] font-extrabold">
                        {item.calculated_top_up}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center italic font-bold"
                    >
                      - KEBUTUHAN TERPENUHI -
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="border-t-2 border-black border-dashed mb-6"></div>

            {/* Tanda Tangan */}
            <div className="flex justify-between text-center pb-6 border-b-2">
              <div className="w-1/2 flex flex-col items-center">
                <p className="mb-12 font-semibold">Dibuat,</p>
                <div className="border-b border-black px-2 min-w-[80px]">
                  <p className="font-bold text-[11px] uppercase">
                    ( Admin Gudang )
                  </p>
                </div>
              </div>
              <div className="w-1/2 flex flex-col items-center">
                <p className="mb-12 font-semibold">Salesman,</p>
                <div className="border-b border-black px-2 min-w-[80px]">
                  <p className="font-bold text-[11px] break-words line-clamp-1 uppercase truncate max-w-[130px]">
                    {data.sales_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Date Time Print */}
            <div className="mt-3 text-[10px] font-semibold flex justify-between items-center px-1">
              <span>Print: {dayjs().format("DD/MM/YY HH:mm")}</span>
              <span>WMS System</span>
            </div>

            <div className="mt-8 text-[10px] font-semibold flex justify-between items-center px-1">
              <span>-</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="relative"></div>

          <button
            onClick={() => handlePrint()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all ${isIntegrated
              ? "bg-slate-700 text-white hover:bg-slate-800"
              : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
              }`}
          >
            <FaPrint size={14} /> {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};


// import React, { useEffect, useRef } from "react";
// import { useReactToPrint } from "react-to-print";
// import { FaPrint, FaTimes } from "react-icons/fa";
// import dayjs from "dayjs";
// import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";

// interface PrintPreviewModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: any | null;
//   integrationInfo: any;
// }

// export const PrintPreviewModal = ({
//   isOpen,
//   onClose,
//   data,
//   integrationInfo,
// }: PrintPreviewModalProps) => {
//   const status = integrationInfo?.iface_status || "";
//   const isIntegrated = ["SUCCESS", "INTEGRATED"].includes(status);
//   const buttonLabel = isIntegrated ? "Re-Print Struk" : "Cetak Struk";

//   const { fetchAll, list: itemList } = useStoreItem();
//   useEffect(() => {
//     fetchAll();
//   }, []);

//   const componentRef = useRef<HTMLDivElement>(null);

//   const handlePrint = useReactToPrint({
//     contentRef: componentRef,
//     documentTitle: `SPB_${data?.spb_number || "Document"}`,
//     pageStyle: `
//       @page {
//         size: auto;
//         margin: 0mm;
//       }
//       @media print {
//         html, body {
//           margin: 0;
//           padding: 0;
//           background-color: white;
//         }
//       }
//     `,
//   });

//   if (!isOpen || !data) return null;

//   // --- LOGIKA PERSIAPAN DATA ---
//   const processedDetails = (data.details || [])
//     .map((item: any) => {
//       // 1. Kalkulasi Qty
//       const btbQty =
//         item.qty_btb && item.qty_btb !== "-" ? Number(item.qty_btb) : 0;
//       const finalQty = Number(item.item_qty_final || 0);
//       const topUpValue = finalQty - btbQty;

//       const matchedItem = itemList.find(
//         (master: any) => master.sku === item.item_code,
//       );

//       const itemName = matchedItem ? matchedItem.description : item.item_code;

//       return {
//         ...item,
//         calculated_btb: btbQty,
//         calculated_top_up: topUpValue > 0 ? topUpValue : 0,
//         item_description: itemName,
//       };
//     })
//     .filter((item: any) => item.calculated_top_up > 0);

//   return (
//     <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex justify-center">
//         {/* Header Modal */}
//         <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80">
//           <h3 className="font-semibold text-slate-800 flex items-center gap-2">
//             <FaPrint className="text-orange-500" /> Print Preview
//           </h3>
//           <button
//             onClick={onClose}
//             className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
//           >
//             <FaTimes size={16} />
//           </button>
//         </div>

//         {/* Print Preview Area */}
//         <div className="flex-1 overflow-y-auto p-6 bg-slate-200">
//           {/* ========================================================== */}
//           {/* AREA KERTAS DOKUMEN YANG AKAN DI-PRINT                     */}
//           {/* ========================================================== */}
//           <div
//             ref={componentRef}
//             className="bg-white shadow-md w-full max-w-[380px] p-6 print:p-0 print:px-4 print:pt-4 print:pb-8 text-[12px] text-black relative mx-auto h-fit"
//             style={{ fontFamily: "monospace" }}
//           >
//             {/* Kop Dokumen */}
//             <div className="text-center mb-4">
//               <h2 className="font-extrabold text-base tracking-widest uppercase">
//                 SPB AMO {data.organization?.organization_name || "CABANG"}
//               </h2>
//               <div className="border-b-2 border-black border-dashed mt-2"></div>
//             </div>

//             {/* Info Dokumen */}
//             {/* grid layout diatur agar teks panjang seperti nama & SPB bisa break-words (turun baris) dengan rapi */}
//             <div className="grid grid-cols-[90px_10px_1fr] gap-y-1.5 mb-5 font-semibold leading-snug">
//               <span>Tanggal SPB</span>
//               <span>:</span>
//               <span className="break-words">
//                 {dayjs(data.createdAt).format("DD-MM-YYYY, HH:mm")}
//               </span>

//               <span>No. SPB</span>
//               <span>:</span>
//               <span className="break-all">{data.spb_number}</span>

//               <span>NIK Salesman</span>
//               <span>:</span>
//               <span className="break-words">{data.sales_nik}</span>

//               <span>Nama Salesman</span>
//               <span>:</span>
//               <span className="break-words leading-tight">
//                 {data.sales_name}
//               </span>
//             </div>

//             <div className="border-b-2 border-black border-dashed mb-2"></div>

//             {/* Tabel Item - table-fixed sangat penting di sini */}
//             <table className="w-full text-left text-black text-[12px] table-fixed mb-4">
//               <thead>
//                 <tr className="border-b border-black border-dashed">
//                   <th className="py-2 w-[40%] font-bold align-bottom">SKU</th>
//                   <th className="py-2 w-[18%] font-bold text-right align-bottom">
//                     SPB
//                   </th>
//                   <th className="py-2 w-[18%] font-bold text-right align-bottom">
//                     BTB
//                   </th>
//                   <th className="py-2 w-[24%] font-bold text-right align-bottom">
//                     TOP UP
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-black divide-dashed">
//                 {processedDetails.length > 0 ? (
//                   processedDetails.map((item: any, idx: number) => (
//                     <tr key={item.id || idx}>
//                       {/* SKU dipaksa break-words jika kode sangat panjang */}
//                       <td className="py-2.5 font-bold pr-1 break-words">
//                         {item.item_description}
//                       </td>
//                       <td className="py-2.5 text-right font-medium pr-1">
//                         {item.item_qty_submitted}
//                       </td>
//                       <td className="py-2.5 text-right font-medium pr-1">
//                         {item.calculated_btb === 0 ? "-" : item.calculated_btb}
//                       </td>
//                       {/* TOP UP Dibuat lebih besar dan tebal */}
//                       <td className="py-2.5 text-right text-[14px] font-extrabold">
//                         {item.calculated_top_up}
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td
//                       colSpan={4}
//                       className="py-6 text-center italic font-bold"
//                     >
//                       - KEBUTUHAN TERPENUHI -
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>

//             <div className="border-t-2 border-black border-dashed mb-6"></div>

//             {/* Tanda Tangan */}
//             <div className="flex justify-between text-center pb-6 border-b-2">
//               <div className="w-1/2 flex flex-col items-center">
//                 <p className="mb-12 font-semibold">Dibuat,</p>
//                 <div className="border-b border-black px-2 min-w-[80px]">
//                   <p className="font-bold text-[11px] uppercase">
//                     ( Admin Gudang )
//                   </p>
//                 </div>
//               </div>
//               <div className="w-1/2 flex flex-col items-center">
//                 <p className="mb-12 font-semibold">Salesman,</p>
//                 <div className="border-b border-black px-2 min-w-[80px]">
//                   <p className="font-bold text-[11px] break-words line-clamp-1 uppercase  truncate max-w-[130px]">
//                     {data.sales_name}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Date Time Print */}
//             <div className="mt-3 text-[10px] font-semibold flex justify-between items-center px-1">
//               <span>Print: {dayjs().format("DD/MM/YY HH:mm")}</span>
//               <span>WMS System</span>
//             </div>

//             <div className="mt-8 text-[10px] font-semibold flex justify-between items-center px-1">
//               <span>-</span>
//             </div>
//           </div>
//           {/* ========================================================== */}
//           {/* END AREA KERTAS DOKUMEN                                    */}
//           {/* ========================================================== */}
//         </div>

//         {/* Footer Actions */}
//         <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
//           <div className="relative"></div>

//           <button
//             onClick={() => handlePrint()}
//             className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all ${isIntegrated
//               ? "bg-slate-700 text-white hover:bg-slate-800" // Warna netral untuk Re-Print
//               : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
//               }`}
//           >
//             <FaPrint size={14} /> {buttonLabel}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };
