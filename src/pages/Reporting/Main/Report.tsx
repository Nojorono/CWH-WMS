// import React, { useEffect, useState, useMemo } from "react";
// import {
//   useReactTable,
//   getCoreRowModel,
//   flexRender,
//   createColumnHelper,
// } from "@tanstack/react-table";
// import { useStoreReportInbound } from "../../../DynamicAPI/stores/Store/MasterStore";
// import { FaFileExcel } from "react-icons/fa";
// import { useSearchParams } from "react-router-dom";
// import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import TabsSection from "../../../components/wms-components/inbound-component/tabs/TabsSection";

// const Reporting = () => {
//   const [activeTab, setActiveTab] = useState(0);
//   const [searchParams, setSearchParams] = useSearchParams();
//   const { fetchUsingPagination, list, pagination, isLoading } =
//     useStoreReportInbound();

//   const currentPage = parseInt(searchParams.get("page") || "1");
//   const pageIndex = currentPage - 1;
//   const [pageSize, setPageSize] = useState(20);

//   // ================= 1. FETCH SERVER SIDE (Hardcoded Params) =================
//   useEffect(() => {
//     if (fetchUsingPagination) {
//       fetchUsingPagination({
//         page: currentPage,
//         limit: pageSize,
//         sortOrder: "DESC",
//         status: "INTEGRATED",
//       });
//     }
//   }, [fetchUsingPagination, currentPage, pageSize]);

//   console.log("item list", list);

//   // ================= 2. DATA FLATTENING =================
//   // Kita ratakan data agar TanStack Table bisa merender per-item SKU
//   const flatData = useMemo(() => {
//     if (!list || !Array.isArray(list)) return [];
//     const results: any[] = [];

//     list.forEach((inbound: any) => {
//       const dos = inbound.inbound_dos || [];
//       dos.forEach((doItem: any) => {
//         const items = doItem.inbound_items || [];
//         items.forEach((itemRow: any) => {
//           results.push({
//             id_unique: `${inbound.id}-${doItem.id}-${itemRow.id}`,
//             arrival_date: inbound.arrival_date,
//             inbound_do_number: doItem.inbound_do_number,
//             inbound_po_number: doItem.inbound_po_number,
//             origin: inbound.origin || "-",
//             expedition: inbound.expedition,
//             license_plate: inbound.license_plate,
//             item_number: itemRow.item?.item_number,
//             description: itemRow.item?.description,
//             quantity: itemRow.quantity,
//             uom: itemRow.uom,
//             inbound_number: inbound.inbound_number,
//             principal: doItem.principal || "-", // ✓ Correct - from inbound_dos level
//           });
//         });
//       });
//     });
//     return results;
//   }, [list]);

//   // ================= 3. EXPORT EXCEL FUNCTION =================
//   const handleExportExcel = () => {
//     // 1. Definisikan Judul dan Metadata (Berdasarkan gambar yang Anda lampirkan)
//     const headerMetadata = [
//       ["REPORT PENERIMAAN BARANG"], // Judul Utama (Baris 1)
//       [], // Baris Kosong
//       ["TANGGAL AWAL", `: ${new Date().toLocaleDateString("id-ID")}`], // Contoh hardcode, bisa ganti dari state filter
//       ["TANGGAL AKHIR", `: ${new Date().toLocaleDateString("id-ID")}`],
//       ["TYPE STORAGE", ": SKU"],
//       [], // Baris Kosong sebelum tabel
//     ];

//     // 2. Definisikan Header Tabel
//     const tableHeader = [
//       "TANGGAL INBOUND",
//       "NO SURAT JALAN",
//       "NO PO",
//       "PENGIRIM",
//       "EXPEDISI",
//       "NOPOL",
//       "KODE ITEM",
//       "DESKRIPSI",
//       "QTY",
//       "UOM",
//       "NO RECEIPT",
//     ];

//     // 3. Mapping Data dari flatData
//     const tableRows = flatData.map((item) => [
//       item.arrival_date
//         ? new Date(item.arrival_date).toLocaleDateString("id-ID")
//         : "-",
//       item.inbound_do_number,
//       item.inbound_po_number,
//       item.principal, // Menggunakan principal sesuai kolom "Pengirim" di UI Anda
//       item.expedition || "-",
//       item.license_plate || "-",
//       item.item_number,
//       item.description,
//       item.quantity,
//       item.uom,
//       item.inbound_number,
//     ]);

//     // 4. Gabungkan Metadata + Header Tabel + Isi Tabel
//     const finalDataForExcel = [...headerMetadata, tableHeader, ...tableRows];

//     // 5. Buat Worksheet
//     const worksheet = XLSX.utils.aoa_to_sheet(finalDataForExcel);

//     // 6. Styling: Merge cell untuk Judul (Opsional agar rapi seperti di gambar)
//     // Merge cell A1 sampai K1 (Indeks baris 0, kolom 0 ke kolom 10)
//     if (!worksheet["!merges"]) worksheet["!merges"] = [];
//     worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } });

//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Inbound_Report");

//     // 7. Generate File
//     const excelBuffer = XLSX.write(workbook, {
//       bookType: "xlsx",
//       type: "array",
//     });
//     const data = new Blob([excelBuffer], {
//       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     });

//     saveAs(data, `Report_Penerimaan_Barang_Page_${currentPage}.xlsx`);
//   };

//   // ================= 4. COLUMNS DEFINITION =================
//   const columnHelper = createColumnHelper<any>();

//   const columns = [
//     columnHelper.accessor("arrival_date", {
//       header: "Tanggal Inbound",
//       cell: (info) => new Date(info.getValue()).toLocaleDateString("id-ID"),
//     }),
//     columnHelper.accessor("inbound_do_number", {
//       header: "No Surat Jalan",
//     }),
//     columnHelper.accessor("inbound_po_number", {
//       header: "No PO",
//     }),
//     columnHelper.accessor("principal", {
//       header: "Pengirim",
//     }),
//     columnHelper.accessor("item_number", {
//       header: "Kode Item",
//       cell: (info) => (
//         <span className="font-bold text-blue-600">{info.getValue()}</span>
//       ),
//     }),
//     columnHelper.accessor("description", {
//       header: "Deskripsi",
//     }),
//     columnHelper.accessor("quantity", {
//       header: "Qty",
//       cell: (info) => <span className="font-bold">{info.getValue()}</span>,
//     }),
//     columnHelper.accessor("uom", {
//       header: "UOM",
//     }),
//     columnHelper.accessor("inbound_number", {
//       header: "No Receipt",
//     }),
//   ];

//   // ================= 5. TABLE INSTANCE =================
//   const tableSKU = useReactTable({
//     data: flatData,
//     columns,
//     pageCount: pagination?.totalPages ?? 0,
//     state: {
//       pagination: { pageIndex, pageSize },
//     },
//     manualPagination: true,
//     getCoreRowModel: getCoreRowModel(),
//   });

//   const handlePageChange = (newPageIndex: number, newSize: number) => {
//     const newParams = new URLSearchParams(searchParams);
//     newParams.set("page", (newPageIndex + 1).toString());
//     setSearchParams(newParams);
//     if (newSize !== pageSize) setPageSize(newSize);
//   };

//   const flatDataPalletExtended = useMemo(() => {
//     if (!list || !Array.isArray(list)) return [];
//     const results: any[] = [];

//     list.forEach((inbound: any) => {
//       const dos = inbound.inbound_dos || [];
//       const scanInbounds = inbound.transaction_scan_inbounds || [];

//       dos.forEach((doItem: any) => {
//         const items = doItem.inbound_items || [];

//         items.forEach((itemRow: any) => {
//           // Cari semua scan yang cocok dengan item ini
//           const matchedScans = scanInbounds.filter(
//             (scan: any) => scan.item_id === itemRow.item_id,
//           );

//           if (matchedScans.length > 0) {
//             // Jika ada data scan → expand per scan (per pallet)
//             matchedScans.forEach((scan: any) => {
//               results.push({
//                 id_unique: `${inbound.id}-${doItem.id}-${itemRow.id}-${scan.id}`,

//                 // === Kolom dari inbound_dos & inbound ===
//                 arrival_date: inbound.arrival_date,
//                 inbound_do_number: doItem.inbound_do_number,
//                 inbound_po_number: doItem.inbound_po_number,
//                 principal: doItem.principal || "-",
//                 origin: inbound.origin || "-",
//                 expedition: inbound.expedition || "-",
//                 license_plate: inbound.license_plate || "-",
//                 item_number: itemRow.item?.item_number || "-",
//                 description: itemRow.item?.description || "-",
//                 quantity: scan.quantity, // Qty per scan/pallet
//                 uom: scan.uom || itemRow.uom,
//                 inbound_number: inbound.inbound_number,

//                 // === Kolom BARU dari transaction_scan_inbounds ===
//                 penerima: inbound.origin || "-", // PENERIMA → origin warehouse
//                 kode_produksi: scan.week_number
//                   ? `W${String(scan.week_number).padStart(2, "0")}`
//                   : "-", // KODE PRODUKSI → "W10", "W45", dst
//                 no_pallet: scan.pallet?.pallet_code || "-", // NO PALLET → pallet_code
//                 waktu_update_pallet: scan.updatedAt
//                   ? new Date(scan.updatedAt).toLocaleString("id-ID", {
//                       day: "2-digit",
//                       month: "2-digit",
//                       year: "numeric",
//                       hour: "2-digit",
//                       minute: "2-digit",
//                       second: "2-digit",
//                       hour12: false,
//                     })
//                   : "-", // WAKTU UPDATE PALLET
//                 user_loading: scan.user_name || "-", // USER LOADING → user_name scanner
//                 tgl_receipt: inbound.arrival_date
//                   ? new Date(inbound.arrival_date).toLocaleDateString("id-ID")
//                   : "-", // TGL RECEIPT → arrival_date
//                 receipt_by: scan.user_name || "-", // RECEIPT BY → user yang scan
//               });
//             });
//           } else {
//             // Fallback: tidak ada scan → tetap tampilkan data item tanpa kolom scan
//             results.push({
//               id_unique: `${inbound.id}-${doItem.id}-${itemRow.id}-noscan`,
//               arrival_date: inbound.arrival_date,
//               inbound_do_number: doItem.inbound_do_number,
//               inbound_po_number: doItem.inbound_po_number,
//               principal: doItem.principal || "-",
//               origin: inbound.origin || "-",
//               expedition: inbound.expedition || "-",
//               license_plate: inbound.license_plate || "-",
//               item_number: itemRow.item?.item_number || "-",
//               description: itemRow.item?.description || "-",
//               quantity: itemRow.quantity,
//               uom: itemRow.uom,
//               inbound_number: inbound.inbound_number,
//               penerima: inbound.origin || "-",
//               kode_produksi: "-",
//               no_pallet: "-",
//               waktu_update_pallet: "-",
//               user_loading: "-",
//               tgl_receipt: "-",
//               receipt_by: "-",
//             });
//           }
//         });
//       });
//     });

//     return results;
//   }, [list]);

//   const tablePallet = useReactTable({
//     data: flatDataPalletExtended,
//     columns,
//     pageCount: pagination?.totalPages ?? 0,
//     state: {
//       pagination: { pageIndex, pageSize },
//     },
//     manualPagination: true,
//     getCoreRowModel: getCoreRowModel(),
//   });

//   return (
//     <div className="flex flex-col gap-4">
//       <PageBreadcrumb breadcrumbs={[{ title: "Reporting Inbound" }]} />
//       <TabsSection
//         activeTab={activeTab}
//         onTabChange={setActiveTab}
//         tabs={[
//           {
//             label: "Report Inbound SKU",
//             content: (
//               <div className="w-full overflow-x-auto mb-5">
//                 <div className="flex justify-between items-center mb-4">
//                   <h2 className="text-lg font-semibold text-gray-700"></h2>
//                   <button
//                     onClick={handleExportExcel}
//                     className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm shadow transition-all"
//                   >
//                     <FaFileExcel /> Export Excel (Page {currentPage})
//                   </button>
//                 </div>

//                 <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
//                   <div className="overflow-x-auto">
//                     <table className="w-full text-left border-collapse">
//                       <thead className="bg-orange-500 text-white text-xs uppercase tracking-wider">
//                         {tableSKU.getHeaderGroups().map((headerGroup) => (
//                           <tr key={headerGroup.id}>
//                             {headerGroup.headers.map((header) => (
//                               <th
//                                 key={header.id}
//                                 className="p-3 font-semibold border-b border-orange-600"
//                               >
//                                 {flexRender(
//                                   header.column.columnDef.header,
//                                   header.getContext(),
//                                 )}
//                               </th>
//                             ))}
//                           </tr>
//                         ))}
//                       </thead>

//                       <tbody
//                         className={`text-sm text-gray-600 ${isLoading ? "opacity-50" : ""}`}
//                       >
//                         {tableSKU.getRowModel().rows.length > 0 ? (
//                           tableSKU.getRowModel().rows.map((row) => (
//                             <tr
//                               key={row.id}
//                               className="border-b hover:bg-orange-50 transition-colors"
//                             >
//                               {row.getVisibleCells().map((cell) => (
//                                 <td key={cell.id} className="p-3">
//                                   {flexRender(
//                                     cell.column.columnDef.cell,
//                                     cell.getContext(),
//                                   )}
//                                 </td>
//                               ))}
//                             </tr>
//                           ))
//                         ) : (
//                           <tr>
//                             <td
//                               colSpan={columns.length}
//                               className="p-10 text-center text-gray-400 italic"
//                             >
//                               Data tidak ditemukan...
//                             </td>
//                           </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   </div>

//                   {/* PAGINATION CONTROL */}
//                   <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
//                     <div className="text-xs text-gray-500 italic">
//                       Showing page {currentPage} of{" "}
//                       {pagination?.totalPages || 1}
//                     </div>

//                     <div className="flex items-center gap-2">
//                       <button
//                         onClick={() =>
//                           handlePageChange(pageIndex - 1, pageSize)
//                         }
//                         disabled={currentPage === 1 || isLoading}
//                         className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-xs shadow-sm"
//                       >
//                         Previous
//                       </button>

//                       <button
//                         onClick={() =>
//                           handlePageChange(pageIndex + 1, pageSize)
//                         }
//                         disabled={
//                           currentPage >= (pagination?.totalPages || 1) ||
//                           isLoading
//                         }
//                         className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-xs shadow-sm"
//                       >
//                         Next
//                       </button>

//                       <select
//                         value={pageSize}
//                         onChange={(e) =>
//                           handlePageChange(0, Number(e.target.value))
//                         }
//                         className="border rounded px-2 py-1 text-xs outline-none focus:border-orange-500"
//                       >
//                         {[5, 10, 20, 50, 100].map((size) => (
//                           <option key={size} value={size}>
//                             Show {size}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ),
//           },
//           {
//             label: "Report Inbound Pallet",
//             content: (
//               <div className="w-full overflow-x-auto mb-5">
//                 <div className="flex justify-between items-center mb-4">
//                   <h2 className="text-lg font-semibold text-gray-700"></h2>
//                   <button
//                     onClick={handleExportExcel}
//                     className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm shadow transition-all"
//                   >
//                     <FaFileExcel /> Export Excel (Page {currentPage})
//                   </button>
//                 </div>

//                 <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
//                   <div className="overflow-x-auto">
//                     <table className="w-full text-left border-collapse">
//                       <thead className="bg-orange-500 text-white text-xs uppercase tracking-wider">
//                         {tablePallet.getHeaderGroups().map((headerGroup) => (
//                           <tr key={headerGroup.id}>
//                             {headerGroup.headers.map((header) => (
//                               <th
//                                 key={header.id}
//                                 className="p-3 font-semibold border-b border-orange-600"
//                               >
//                                 {flexRender(
//                                   header.column.columnDef.header,
//                                   header.getContext(),
//                                 )}
//                               </th>
//                             ))}
//                           </tr>
//                         ))}
//                       </thead>

//                       <tbody
//                         className={`text-sm text-gray-600 ${isLoading ? "opacity-50" : ""}`}
//                       >
//                         {tablePallet.getRowModel().rows.length > 0 ? (
//                           tablePallet.getRowModel().rows.map((row) => (
//                             <tr
//                               key={row.id}
//                               className="border-b hover:bg-orange-50 transition-colors"
//                             >
//                               {row.getVisibleCells().map((cell) => (
//                                 <td key={cell.id} className="p-3">
//                                   {flexRender(
//                                     cell.column.columnDef.cell,
//                                     cell.getContext(),
//                                   )}
//                                 </td>
//                               ))}
//                             </tr>
//                           ))
//                         ) : (
//                           <tr>
//                             <td
//                               colSpan={columns.length}
//                               className="p-10 text-center text-gray-400 italic"
//                             >
//                               Data tidak ditemukan...
//                             </td>
//                           </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   </div>

//                   {/* PAGINATION CONTROL */}
//                   <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
//                     <div className="text-xs text-gray-500 italic">
//                       Showing page {currentPage} of{" "}
//                       {pagination?.totalPages || 1}
//                     </div>

//                     <div className="flex items-center gap-2">
//                       <button
//                         onClick={() =>
//                           handlePageChange(pageIndex - 1, pageSize)
//                         }
//                         disabled={currentPage === 1 || isLoading}
//                         className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-xs shadow-sm"
//                       >
//                         Previous
//                       </button>

//                       <button
//                         onClick={() =>
//                           handlePageChange(pageIndex + 1, pageSize)
//                         }
//                         disabled={
//                           currentPage >= (pagination?.totalPages || 1) ||
//                           isLoading
//                         }
//                         className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-xs shadow-sm"
//                       >
//                         Next
//                       </button>

//                       <select
//                         value={pageSize}
//                         onChange={(e) =>
//                           handlePageChange(0, Number(e.target.value))
//                         }
//                         className="border rounded px-2 py-1 text-xs outline-none focus:border-orange-500"
//                       >
//                         {[5, 10, 20, 50, 100].map((size) => (
//                           <option key={size} value={size}>
//                             Show {size}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ),
//           },
//         ]}
//       />
//     </div>
//   );
// };

// export default Reporting;

import React, { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useStoreReportInbound } from "../../../DynamicAPI/stores/Store/MasterStore";
import { FaFileExcel, FaBox, FaPallet } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import TabsSection from "../../../components/wms-components/inbound-component/tabs/TabsSection";

const columnHelper = createColumnHelper<any>();

const Reporting = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchUsingPagination, list, pagination, isLoading } =
    useStoreReportInbound();

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageIndex = currentPage - 1;
  const [pageSize, setPageSize] = useState(20);

  // ================= 1. FETCHING LOGIC =================
  useEffect(() => {
    if (fetchUsingPagination) {
      fetchUsingPagination({
        page: currentPage,
        limit: pageSize,
        sortOrder: "DESC",
        status: "INTEGRATED",
      });
    }
  }, [fetchUsingPagination, currentPage, pageSize]);

  // ================= 2. DATA TRANSFORMATION =================
  const flatDataSKU = useMemo(() => {
    if (!list || !Array.isArray(list)) return [];
    return list.flatMap((inbound: any) =>
      (inbound.inbound_dos || []).flatMap((doItem: any) =>
        (doItem.inbound_items || []).map((itemRow: any) => ({
          id_unique: `${inbound.id}-${doItem.id}-${itemRow.id}`,
          arrival_date: inbound.arrival_date,
          inbound_do_number: doItem.inbound_do_number,
          inbound_po_number: doItem.inbound_po_number,
          principal: doItem.principal || "-",
          expedition: inbound.expedition,
          license_plate: inbound.license_plate,
          item_number: itemRow.item?.item_number,
          description: itemRow.item?.description,
          quantity: itemRow.quantity,
          uom: itemRow.uom,
          inbound_number: inbound.inbound_number,
        })),
      ),
    );
  }, [list]);

  const flatDataPallet = useMemo(() => {
    if (!list || !Array.isArray(list)) return [];
    const results: any[] = [];

    list.forEach((inbound: any) => {
      const dos = inbound.inbound_dos || [];
      const scans = inbound.transaction_scan_inbounds || [];

      dos.forEach((doItem: any) => {
        (doItem.inbound_items || []).forEach((itemRow: any) => {
          const matchedScans = scans.filter(
            (s: any) => s.item_id === itemRow.item_id,
          );

          if (matchedScans.length > 0) {
            matchedScans.forEach((scan: any) => {
              results.push({
                ...itemRow,
                arrival_date: inbound.arrival_date,
                inbound_do_number: doItem.inbound_do_number,
                inbound_po_number: doItem.inbound_po_number,
                principal: doItem.principal,
                penerima: inbound.origin || "-",
                expedition: inbound.expedition,
                license_plate: inbound.license_plate,
                item_number: itemRow.item?.item_number,
                description: itemRow.item?.description,
                quantity: scan.quantity,
                uom: scan.uom || itemRow.uom,
                kode_produksi: scan.week_number
                  ? `W${String(scan.week_number).padStart(2, "0")}`
                  : "-",
                no_pallet: scan.pallet?.pallet_code || "-",
                waktu_update_pallet: scan.updatedAt
                  ? new Date(scan.updatedAt).toLocaleString("id-ID")
                  : "-",
                user_loading: scan.user_name || "-",
                inbound_number: inbound.inbound_number,
                tgl_receipt: inbound.arrival_date
                  ? new Date(inbound.arrival_date).toLocaleDateString("id-ID")
                  : "-",
                receipt_by: scan.user_name || "-",
              });
            });
          }
        });
      });
    });
    return results;
  }, [list]);

  // ================= 3. EXPORT EXCEL (PREMIUM) =================
  const handleExportExcel = (type: "SKU" | "PALLET") => {
    const isPallet = type === "PALLET";
    const dataToExport = isPallet ? flatDataPallet : flatDataSKU;

    // Header Metadata sesuai Gambar
    const headerMetadata = [
      ["REPORT PENERIMAAN BARANG"],
      [],
      [
        "TANGGAL AWAL",
        `: ${new Date().toLocaleDateString("id-ID")}`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "PRINT DATE",
        `: ${new Date().toLocaleDateString("id-ID")}`,
      ],
      [
        "TANGGAL AKHIR",
        `: ${new Date().toLocaleDateString("id-ID")}`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "PRINT BY",
        ": USER WMS",
      ],
      ["TYPE STORAGE", `: ${type}`],
      [],
    ];

    const tableHeaders = isPallet
      ? [
          "TANGGAL INBOUND PLANNING",
          "NO SURAT JALAN",
          "NO PO",
          "PENGIRIM",
          "PENERIMA",
          "EXPEDISI",
          "NOPOL",
          "KODE ITEM",
          "DESKRIPSI",
          "QTY",
          "UOM",
          "KODE PRODUKSI",
          "NO PALLET",
          "WAKTU UPDATE PALLET",
          "USER LOADING",
          "NO RECEIPT",
          "TGL RECEIPT",
          "RECEIPT BY",
        ]
      : [
          "TANGGAL INBOUND",
          "NO SURAT JALAN",
          "NO PO",
          "PENGIRIM",
          "EXPEDISI",
          "NOPOL",
          "KODE ITEM",
          "DESKRIPSI",
          "QTY",
          "UOM",
          "NO RECEIPT",
        ];

    const tableRows = dataToExport.map((item: any) =>
      isPallet
        ? [
            item.arrival_date
              ? new Date(item.arrival_date).toLocaleDateString("id-ID")
              : "-",
            item.inbound_do_number,
            item.inbound_po_number,
            item.principal,
            item.penerima,
            item.expedition,
            item.license_plate,
            item.item_number,
            item.description,
            item.quantity,
            item.uom,
            item.kode_produksi,
            item.no_pallet,
            item.waktu_update_pallet,
            item.user_loading,
            item.inbound_number,
            item.tgl_receipt,
            item.receipt_by,
          ]
        : [
            item.arrival_date
              ? new Date(item.arrival_date).toLocaleDateString("id-ID")
              : "-",
            item.inbound_do_number,
            item.inbound_po_number,
            item.principal,
            item.expedition,
            item.license_plate,
            item.item_number,
            item.description,
            item.quantity,
            item.uom,
            item.inbound_number,
          ],
    );

    const worksheet = XLSX.utils.aoa_to_sheet([
      ...headerMetadata,
      tableHeaders,
      ...tableRows,
    ]);

    // Merge Title
    if (!worksheet["!merges"]) worksheet["!merges"] = [];
    worksheet["!merges"].push({
      s: { r: 0, c: 0 },
      e: { r: 0, c: isPallet ? 17 : 10 },
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAs(
      new Blob([excelBuffer]),
      `Report_${type}_${new Date().getTime()}.xlsx`,
    );
  };

  // ================= 4. TABLE COLUMNS =================
  const columnsSKU = [
    columnHelper.accessor("arrival_date", {
      header: "Tanggal Inbound",
      cell: (i) => new Date(i.getValue()).toLocaleDateString("id-ID"),
    }),
    columnHelper.accessor("inbound_do_number", { header: "Surat Jalan" }),
    columnHelper.accessor("inbound_po_number", { header: "No PO" }),
    columnHelper.accessor("principal", { header: "Pengirim" }),
    columnHelper.accessor("item_number", {
      header: "Kode Item",
      cell: (i) => (
        <span className="font-bold text-blue-600">{i.getValue()}</span>
      ),
    }),
    columnHelper.accessor("description", { header: "Deskripsi" }),
    columnHelper.accessor("quantity", {
      header: "Qty",
      cell: (i) => <span className="font-bold">{i.getValue()}</span>,
    }),
    columnHelper.accessor("uom", { header: "UOM" }),
    columnHelper.accessor("inbound_number", { header: "No Receipt" }),
  ];

  const columnsPallet = [
    columnHelper.accessor("arrival_date", {
      header: "Tanggal Inbound",
      cell: (i) => new Date(i.getValue()).toLocaleDateString("id-ID"),
    }),
    columnHelper.accessor("inbound_do_number", { header: "Surat Jalan" }),
    columnHelper.accessor("principal", { header: "Pengirim" }),
    columnHelper.accessor("penerima", { header: "Penerima" }),
    columnHelper.accessor("item_number", { header: "Item" }),
    columnHelper.accessor("quantity", { header: "Qty" }),
    columnHelper.accessor("no_pallet", {
      header: "No Pallet",
      cell: (i) => (
        <span className="badge bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
          {i.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("kode_produksi", { header: "Prod Code" }),
    columnHelper.accessor("waktu_update_pallet", { header: "Update At" }),
    columnHelper.accessor("inbound_number", { header: "Receipt No" }),
  ];

  const tableSKU = useReactTable({
    data: flatDataSKU,
    columns: columnsSKU,
    getCoreRowModel: getCoreRowModel(),
  });
  const tablePallet = useReactTable({
    data: flatDataPallet,
    columns: columnsPallet,
    getCoreRowModel: getCoreRowModel(),
  });

  const renderTable = (instance: any, type: "SKU" | "PALLET") => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {type === "SKU" ? (
            <FaBox className="text-orange-500" />
          ) : (
            <FaPallet className="text-blue-500" />
          )}
          <h3 className="font-bold text-gray-700 uppercase tracking-tight">
            Data Penerimaan {type}
          </h3>
        </div>
        <button
          onClick={() => handleExportExcel(type)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-md transition-all active:scale-95"
        >
          <FaFileExcel /> Export {type}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              {instance.getHeaderGroups().map((hg: any) => (
                <tr key={hg.id}>
                  {hg.headers.map((h: any) => (
                    <th
                      key={h.id}
                      className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody
              className={`divide-y divide-gray-100 ${isLoading ? "animate-pulse" : ""}`}
            >
              {instance.getRowModel().rows.length > 0 ? (
                instance.getRowModel().rows.map((row: any) => (
                  <tr
                    key={row.id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell: any) => (
                      <td
                        key={cell.id}
                        className="p-4 text-sm text-gray-600 whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={100}
                    className="p-20 text-center text-gray-400 italic bg-gray-50/50"
                  >
                    Belum ada data tersedia untuk periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const handlePageChange = (newPage: number, newSize: number) => {
    setPageSize(newSize);
    // Reset ke halaman 1 jika limit berubah untuk menghindari error data kosong
    const targetPage = newSize !== pageSize ? "1" : newPage.toString();
    setSearchParams({ page: targetPage });
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      <PageBreadcrumb breadcrumbs={[{ title: "Reporting Inbound" }]} />

      <TabsSection
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          {
            label: "Report Inbound SKU",
            content: renderTable(tableSKU, "SKU"),
          },
          {
            label: "Report Inbound Pallet",
            content: renderTable(tablePallet, "PALLET"),
          },
        ]}
      />

      {/* Pagination (Global) */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 whitespace-nowrap">
            Showing page <strong>{currentPage}</strong> of{" "}
            {pagination?.totalPages || 1}
          </span>

          {/* SELECT LIMIT PER PAGE */}
          <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
            <span className="text-xs text-gray-400 font-medium uppercase italic">
              Rows:
            </span>
            <select
              value={pageSize}
              onChange={(e) => handlePageChange(1, Number(e.target.value))}
              className="bg-gray-50 border border-gray-300 text-gray-700 text-xs rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-1.5 outline-none font-semibold cursor-pointer hover:bg-white transition-all"
            >
              {[1, 5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            disabled={currentPage === 1 || isLoading}
            onClick={() => handlePageChange(currentPage - 1, pageSize)}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-all text-sm font-semibold text-gray-600 shadow-sm"
          >
            Previous
          </button>
          <button
            disabled={currentPage >= (pagination?.totalPages || 1) || isLoading}
            onClick={() => handlePageChange(currentPage + 1, pageSize)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-30 transition-all text-sm font-semibold shadow-md active:scale-95 shadow-gray-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reporting;
