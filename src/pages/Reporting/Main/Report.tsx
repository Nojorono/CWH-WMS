import React, { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useStoreInboundGoodStock } from "../../../DynamicAPI/stores/Store/MasterStore";
import { FaFileExcel, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Reporting: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchUsingPagination, list, pagination, isLoading } =
    useStoreInboundGoodStock();

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageIndex = currentPage - 1;
  const [pageSize, setPageSize] = useState(20);

  // ================= 1. FETCH SERVER SIDE (Hardcoded Params) =================
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

  console.log("item list", list);

  // ================= 2. DATA FLATTENING =================
  // Kita ratakan data agar TanStack Table bisa merender per-item SKU
  const flatData = useMemo(() => {
    if (!list || !Array.isArray(list)) return [];
    const results: any[] = [];

    list.forEach((inbound: any) => {
      const dos = inbound.inbound_dos || [];
      dos.forEach((doItem: any) => {
        const items = doItem.inbound_items || [];
        items.forEach((itemRow: any) => {
          results.push({
            id_unique: `${inbound.id}-${doItem.id}-${itemRow.id}`,
            arrival_date: inbound.arrival_date,
            inbound_do_number: doItem.inbound_do_number,
            inbound_po_number: doItem.inbound_po_number,
            origin: inbound.origin || "-",
            expedition: inbound.expedition,
            license_plate: inbound.license_plate,
            item_number: itemRow.item?.item_number,
            description: itemRow.item?.description,
            quantity: itemRow.quantity,
            uom: itemRow.uom,
            inbound_number: inbound.inbound_number,
            principal: doItem.principal || "-", // ✓ Correct - from inbound_dos level
          });
        });
      });
    });
    return results;
  }, [list]);

  // ================= 3. EXPORT EXCEL FUNCTION =================
  // const handleExportExcel = () => {
  //   const tableHeader = [
  //     "TANGGAL INBOUND",
  //     "NO SURAT JALAN",
  //     "NO PO",
  //     "PENGIRIM",
  //     "EXPEDISI",
  //     "NOPOL",
  //     "KODE ITEM",
  //     "DESKRIPSI",
  //     "QTY",
  //     "UOM",
  //     "NO RECEIPT",
  //   ];

  //   const tableRows = flatData.map((item) => [
  //     item.arrival_date
  //       ? new Date(item.arrival_date).toLocaleDateString("id-ID")
  //       : "-",
  //     item.inbound_do_number,
  //     item.inbound_po_number,
  //     item.origin,
  //     item.expedition,
  //     item.license_plate,
  //     item.item_number,
  //     item.description,
  //     item.quantity,
  //     item.uom,
  //     item.inbound_number,
  //   ]);

  //   const worksheet = XLSX.utils.aoa_to_sheet([tableHeader, ...tableRows]);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Inbound_Report");

  //   const excelBuffer = XLSX.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });
  //   const data = new Blob([excelBuffer], {
  //     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //   });
  //   saveAs(data, `Inbound_Report_Page_${currentPage}.xlsx`);
  // };

  // ================= 3. EXPORT EXCEL FUNCTION =================
  const handleExportExcel = () => {
    // 1. Definisikan Judul dan Metadata (Berdasarkan gambar yang Anda lampirkan)
    const headerMetadata = [
      ["REPORT PENERIMAAN BARANG"], // Judul Utama (Baris 1)
      [], // Baris Kosong
      ["TANGGAL AWAL", `: ${new Date().toLocaleDateString("id-ID")}`], // Contoh hardcode, bisa ganti dari state filter
      ["TANGGAL AKHIR", `: ${new Date().toLocaleDateString("id-ID")}`],
      ["TYPE STORAGE", ": SKU"],
      [], // Baris Kosong sebelum tabel
    ];

    // 2. Definisikan Header Tabel
    const tableHeader = [
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

    // 3. Mapping Data dari flatData
    const tableRows = flatData.map((item) => [
      item.arrival_date
        ? new Date(item.arrival_date).toLocaleDateString("id-ID")
        : "-",
      item.inbound_do_number,
      item.inbound_po_number,
      item.principal, // Menggunakan principal sesuai kolom "Pengirim" di UI Anda
      item.expedition || "-",
      item.license_plate || "-",
      item.item_number,
      item.description,
      item.quantity,
      item.uom,
      item.inbound_number,
    ]);

    // 4. Gabungkan Metadata + Header Tabel + Isi Tabel
    const finalDataForExcel = [...headerMetadata, tableHeader, ...tableRows];

    // 5. Buat Worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(finalDataForExcel);

    // 6. Styling: Merge cell untuk Judul (Opsional agar rapi seperti di gambar)
    // Merge cell A1 sampai K1 (Indeks baris 0, kolom 0 ke kolom 10)
    if (!worksheet["!merges"]) worksheet["!merges"] = [];
    worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inbound_Report");

    // 7. Generate File
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(data, `Report_Penerimaan_Barang_Page_${currentPage}.xlsx`);
  };

  // ================= 4. COLUMNS DEFINITION =================
  const columnHelper = createColumnHelper<any>();

  const columns = [
    columnHelper.accessor("arrival_date", {
      header: "Tanggal Inbound",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("id-ID"),
    }),
    columnHelper.accessor("inbound_do_number", {
      header: "No Surat Jalan",
    }),
    columnHelper.accessor("inbound_po_number", {
      header: "No PO",
    }),
    columnHelper.accessor("principal", {
      header: "Pengirim",
    }),
    columnHelper.accessor("item_number", {
      header: "Kode Item",
      cell: (info) => (
        <span className="font-bold text-blue-600">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("description", {
      header: "Deskripsi",
    }),
    columnHelper.accessor("quantity", {
      header: "Qty",
      cell: (info) => <span className="font-bold">{info.getValue()}</span>,
    }),
    columnHelper.accessor("uom", {
      header: "UOM",
    }),
    columnHelper.accessor("inbound_number", {
      header: "No Receipt",
    }),
  ];

  // ================= 5. TABLE INSTANCE =================
  const table = useReactTable({
    data: flatData,
    columns,
    pageCount: pagination?.totalPages ?? 0,
    state: {
      pagination: { pageIndex, pageSize },
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const handlePageChange = (newPageIndex: number, newSize: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", (newPageIndex + 1).toString());
    setSearchParams(newParams);
    if (newSize !== pageSize) setPageSize(newSize);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <PageBreadcrumb breadcrumbs={[{ title: "Reporting Inbound" }]} />
        <button
          onClick={handleExportExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm shadow transition-all"
        >
          <FaFileExcel /> Export Excel (Page {currentPage})
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-orange-500 text-white text-xs uppercase tracking-wider">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-3 font-semibold border-b border-orange-600"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody
              className={`text-sm text-gray-600 ${isLoading ? "opacity-50" : ""}`}
            >
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-orange-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3">
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
                    colSpan={columns.length}
                    className="p-10 text-center text-gray-400 italic"
                  >
                    Data tidak ditemukan...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROL */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
          <div className="text-xs text-gray-500 italic">
            Showing page {currentPage} of {pagination?.totalPages || 1}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pageIndex - 1, pageSize)}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-xs shadow-sm"
            >
              Previous
            </button>

            <button
              onClick={() => handlePageChange(pageIndex + 1, pageSize)}
              disabled={
                currentPage >= (pagination?.totalPages || 1) || isLoading
              }
              className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-xs shadow-sm"
            >
              Next
            </button>

            <select
              value={pageSize}
              onChange={(e) => handlePageChange(0, Number(e.target.value))}
              className="border rounded px-2 py-1 text-xs outline-none focus:border-orange-500"
            >
              {[5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reporting;
