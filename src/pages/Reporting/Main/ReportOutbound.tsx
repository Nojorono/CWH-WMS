import { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useStoreReportOutbound } from "../../../DynamicAPI/stores/Store/MasterStore";
import {
  FaFileExcel,
  FaPallet,
  FaCalendarAlt,
  FaTruckLoading,
} from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import TabsSection from "../../../components/wms-components/inbound-component/tabs/TabsSection";
import DatePicker from "../../../components/form/date-picker";
import { formatDateIndo } from "../../../helper/FormatDate";
import { exportOutboundToExcel } from "../hooks/exportOutboundExcel";
import { showErrorToast } from "../../../components/toast";

const columnHelper = createColumnHelper<any>();

const ReportOutbound = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  // Menggunakan store outbound
  const { fetchUsingPagination, list, pagination, isLoading } =
    useStoreReportOutbound();

  const currentPage = parseInt(searchParams.get("page") || "1");
  const [pageSize, setPageSize] = useState(20);

  // ================= 0. STATE FILTER TANGGAL =================
  const dateNow = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState<any>([dateNow, dateNow]);

  const startDate = useMemo(() => {
    const d = Array.isArray(dateRange) ? dateRange[0] : dateRange;
    return d ? formatDateIndo(d) : dateNow;
  }, [dateRange, dateNow]);

  const endDate = useMemo(() => {
    const d = Array.isArray(dateRange)
      ? dateRange[1] || dateRange[0]
      : dateRange;
    return d ? formatDateIndo(d) : dateNow;
  }, [dateRange, dateNow]);

  // ================= 1. FETCHING LOGIC =================
  useEffect(() => {
    if (fetchUsingPagination) {
      fetchUsingPagination({
        page: currentPage,
        limit: pageSize,
        sortOrder: "DESC",
        start_date: startDate,
        end_date: endDate,
        sortBy: "createdAt",
      });
    }
  }, [fetchUsingPagination, currentPage, pageSize, startDate, endDate]);

  console.log("list report out", list);

  // ================= 2. DATA TRANSFORMATION (OUTBOUND) =================
  const flatDataSKU = useMemo(() => {
    if (!list || !Array.isArray(list)) return [];

    return list.flatMap((outbound: any) => {
      // Ambil semua memo yang ada di outbound ini
      const memos = outbound.outbound_memos || [];

      return memos.flatMap((memo: any) => {
        // Ambil semua item yang ada di dalam memo ini
        const memoItems = memo.outbound_memo_items || [];

        return memoItems.map((itemRow: any) => ({
          id_unique: `${outbound.id}-${memo.id}-${itemRow.id}`,
          no_surat_jalan: outbound.outbound_do_number || "-", // Key di JSON adalah outbound_do_number
          tanggal_kirim: formatDateIndo(
            outbound.delivery_date || outbound.createdAt,
          ),
          pengirim: "DC CENTRAL WAREHOUSE JATI",
          penerima: memo.ship_to || "-", // Penerima ada di level memo (ship_to)
          jenis_pengiriman: outbound.outbound_type || "-",
          expedisi: outbound.expedition || "-",
          nopol: outbound.license_plate || "-",
          kode_item: itemRow.item?.item_number || "-",
          deskripsi: itemRow.item?.description || "-",
          qty: itemRow.quantity_plan || 0, // Di JSON outbound menggunakan quantity_plan
          uom: itemRow.uom || "DUS",
        }));
      });
    });
  }, [list]);

  const flatDataPallet = useMemo(() => {
    if (!list || !Array.isArray(list)) return [];
    const results: any[] = [];

    list.forEach((outbound: any) => {
      (outbound.outbound_memos || []).forEach((memo: any) => {
        (memo.outbound_memo_items || []).forEach((itemRow: any) => {
          // Data pallet ada di dalam assigned_gate_load
          (itemRow.assigned_gate_load || []).forEach((gateLoad: any) => {
            results.push({
              tanggal_kirim: formatDateIndo(outbound.delivery_date),
              no_surat_jalan: outbound.outbound_do_number,
              penerima: memo.ship_to || "-",
              kode_item: gateLoad.item?.item_number || "-",
              qty: gateLoad.quantity_loaded || 0,
              no_pallet: gateLoad.pallet?.pallet_code || "-",
              waktu_out: gateLoad.updatedAt
                ? formatDateIndo(gateLoad.updatedAt)
                : "-",
            });
          });
        });
      });
    });
    return results;
  }, [list]);

  // ================= 3. EXPORT HANDLER =================
  const handleExportExcel = (type: "SKU" | "PALLET") => {
    const dataToExport = type === "PALLET" ? flatDataPallet : flatDataSKU;

    if (!dataToExport || dataToExport.length === 0) {
      showErrorToast(
        `Tidak ada data ${type} untuk periode ${startDate} sampai ${endDate}`,
      );
      return;
    }

    exportOutboundToExcel({
      type,
      data: dataToExport,
      startDate,
      endDate,
    });
  };

  // ================= 4. TABLE COLUMNS (Sesuai Gambar) =================
  const columnsSKU = [
    columnHelper.accessor("no_surat_jalan", { header: "No Surat Jalan" }),
    columnHelper.accessor("tanggal_kirim", { header: "Tanggal Kirim" }),
    columnHelper.accessor("pengirim", { header: "Pengirim" }),
    columnHelper.accessor("penerima", {
      header: "Penerima",
      cell: (info) => (
        <div className="min-w-[250px] max-w-[400px] whitespace-normal break-words leading-relaxed">
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("jenis_pengiriman", { header: "Jenis Pengiriman" }),
    columnHelper.accessor("expedisi", { header: "Ekspedisi" }),
    columnHelper.accessor("nopol", { header: "Nopol" }),
    columnHelper.accessor("kode_item", {
      header: "Kode Item",
      cell: (i) => (
        <span className="font-bold text-blue-600">{i.getValue()}</span>
      ),
    }),
    columnHelper.accessor("deskripsi", { header: "Deskripsi" }),
    columnHelper.accessor("qty", {
      header: "Qty",
      cell: (i) => <span className="font-bold">{i.getValue()}</span>,
    }),
    columnHelper.accessor("uom", { header: "UOM" }),
  ];

  const columnsPallet = [
    columnHelper.accessor("tanggal_kirim", { header: "Tgl Kirim" }),
    columnHelper.accessor("no_surat_jalan", { header: "Surat Jalan" }),
    columnHelper.accessor("penerima", { header: "Penerima" }),
    columnHelper.accessor("kode_item", { header: "Item" }),
    columnHelper.accessor("qty", { header: "Qty" }),
    columnHelper.accessor("no_pallet", {
      header: "No Pallet",
      cell: (i) => (
        <span className="badge bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">
          {i.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("waktu_out", { header: "Waktu Keluar" }),
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
            <FaTruckLoading className="text-orange-500" />
          ) : (
            <FaPallet className="text-blue-500" />
          )}
          <h3 className="font-bold text-gray-700 uppercase tracking-tight">
            Data Pengeluaran {type}
          </h3>
        </div>
        <button
          onClick={() => handleExportExcel(type)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-md transition-all active:scale-95"
        >
          <FaFileExcel /> Export by {type}
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
                        className="p-4 text-sm text-gray-600 break-words max-w-[300px]"
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
                    Tidak ada data outbound pada periode ini.
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
    setSearchParams({ page: newSize !== pageSize ? "1" : newPage.toString() });
  };

  const handleReset = () => {
    const today = new Date().toISOString().split("T")[0];
    setDateRange([today, today]);
    setSearchParams({ page: "1" });
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      <PageBreadcrumb breadcrumbs={[{ title: "Reporting Outbound" }]} />

      {/* FILTER SECTION */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2 min-w-[320px]">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <FaCalendarAlt className="text-blue-500" /> Filter Tanggal Outbound
          </label>
          <DatePicker
            id="range-date-picker"
            mode="range"
            placeholder="Pilih range tanggal"
            value={dateRange}
            onChange={(selectedDates: any) => {
              if (selectedDates.length === 2) setDateRange(selectedDates);
            }}
          />
        </div>

        <div className="pb-1 flex items-center gap-3">
          <div className="bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg">
            <p className="text-[11px] text-gray-500 font-medium">
              Periode{" "}
              <span className="text-blue-600 font-bold">{startDate}</span> s/d{" "}
              <span className="text-blue-600 font-bold">{endDate}</span>
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-red-500 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-all active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>

      <TabsSection
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          {
            label: "Report Outbound SKU",
            content: renderTable(tableSKU, "SKU"),
          },
          {
            label: "Report Outbound Pallet",
            content: renderTable(tablePallet, "PALLET"),
          },
        ]}
      />

      {/* PAGINATION */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Halaman <strong>{currentPage}</strong> dari{" "}
            {pagination?.totalPages || 1}
          </span>
          <select
            value={pageSize}
            onChange={(e) => handlePageChange(1, Number(e.target.value))}
            className="bg-gray-50 border border-gray-300 text-gray-700 text-xs rounded-lg p-1.5 outline-none font-semibold cursor-pointer"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                Tampilkan {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            disabled={currentPage === 1 || isLoading}
            onClick={() => handlePageChange(currentPage - 1, pageSize)}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 text-sm font-semibold"
          >
            Kembali
          </button>
          <button
            disabled={currentPage >= (pagination?.totalPages || 1) || isLoading}
            onClick={() => handlePageChange(currentPage + 1, pageSize)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-30 text-sm font-semibold shadow-md"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportOutbound;
