import { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useStoreReportInbound } from "../../../DynamicAPI/stores/Store/MasterStore";
import { FaFileExcel, FaBox, FaPallet, FaCalendarAlt } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import TabsSection from "../../../components/wms-components/inbound-component/tabs/TabsSection";
import DatePicker from "../../../components/form/date-picker";
import { formatDateIndo } from "../../../helper/FormatDate";
import { exportInboundToExcel } from "../hooks/exportInboundExcel";
import { showErrorToast } from "../../../components/toast";

const columnHelper = createColumnHelper<any>();

const ReportInbound = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchUsingPagination, list, pagination, isLoading } =
    useStoreReportInbound();

  const currentPage = parseInt(searchParams.get("page") || "1");
  const [pageSize, setPageSize] = useState(20);

  // ================= 0. STATE FILTER TANGGAL (RANGE MODE) =================
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
        sortOrder: "ASC",
        status: "INTEGRATED",
        start_date: startDate,
        end_date: endDate,
        sortBy: "createdAt",
      });
    }
  }, [fetchUsingPagination, currentPage, pageSize, startDate, endDate]);

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
          penerima: inbound.origin || "-",
          expedition: inbound.expedition,
          license_plate: inbound.license_plate,
          item_number: itemRow.item?.item_number,
          description: itemRow.item?.description,
          quantity: itemRow.quantity,
          uom: itemRow.uom,
          inbound_number: inbound.inbound_number,
          createdAt: formatDateIndo(inbound.createdAt),
          tgl_receipt: formatDateIndo(inbound.updatedAt),
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
                  ? new Intl.DateTimeFormat("en-GB", {
                      day: "numeric",
                      month: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    }).format(new Date(scan.updatedAt))
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

  // ================= 3. EXPORT HANDLER (delegasi ke utility) =================
  const handleExportExcel = (type: "SKU" | "PALLET") => {
    const dataToExport = type === "PALLET" ? flatDataPallet : flatDataSKU;

    if (!dataToExport || dataToExport.length === 0) {
      showErrorToast(
        `Gagal Export: Tidak ada data Inbound ${type} untuk periode ${startDate} - ${endDate}`,
      );
      return;
    }

    exportInboundToExcel({
      type,
      data: dataToExport,
      startDate,
      endDate,
    });
  };

  // ================= 4. TABLE COLUMNS =================
  const columnsSKU = [
    columnHelper.accessor("createdAt", {
      header: "Tanggal Inbound",
    }),
    columnHelper.accessor("inbound_do_number", { header: "Surat Jalan" }),
    columnHelper.accessor("inbound_po_number", { header: "No PO" }),
    columnHelper.accessor("principal", { header: "Pengirim" }),
    columnHelper.accessor("penerima", { header: "Penerima" }),
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
    columnHelper.accessor("tgl_receipt", { header: "Tgl Receipt" }),
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
    const targetPage = newSize !== pageSize ? "1" : newPage.toString();
    setSearchParams({ page: targetPage });
  };

  const handleReset = () => {
    const today = new Date().toISOString().split("T")[0];
    setDateRange([today, today]);
    setSearchParams({ page: "1" });
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      <PageBreadcrumb breadcrumbs={[{ title: "Reporting Inbound" }]} />

      {/* ================= FILTER SECTION ================= */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2 min-w-[320px]">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <FaCalendarAlt className="text-blue-500" /> Filter Date Range
          </label>
          <DatePicker
            id="range-date-picker"
            mode="range"
            placeholder="Select start and end date"
            value={dateRange}
            onChange={(selectedDates: any) => {
              if (selectedDates.length === 2) {
                setDateRange(selectedDates);
              }
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
            title="Reset Filter"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset
          </button>
        </div>
      </div>

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

      {/* ================= PAGINATION ================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 whitespace-nowrap">
            Showing page <strong>{currentPage}</strong> of{" "}
            {pagination?.totalPages || 1}
          </span>
          <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
            <span className="text-xs text-gray-400 font-medium uppercase italic">
              Rows:
            </span>
            <select
              value={pageSize}
              onChange={(e) => handlePageChange(1, Number(e.target.value))}
              className="bg-gray-50 border border-gray-300 text-gray-700 text-xs rounded-lg p-1.5 outline-none font-semibold cursor-pointer hover:bg-white transition-all"
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

export default ReportInbound;
