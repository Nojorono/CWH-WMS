import React, { useEffect, useState } from "react";
import {
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaSpinner,
  FaFilter,
  FaFileAlt,
  FaCalendarAlt,
  FaLayerGroup,
} from "react-icons/fa";
import { useOpeningStockStore } from "../../../DynamicAPI/services/Service/OpeningStockBalanceService";
import { usePersistAuthStore } from "../../../API/store/AuthStore/PersistAuthStore";

export default function OpeningStockListPage() {
  const { data, meta, isLoading, fetchOpeningStockList } =
    useOpeningStockStore();
  const user = usePersistAuthStore((state) => state.user);
  const organizationId =
    user?.userDetail?.organizationId ||
    user?.userDetail?.organization?.id ||
    "";

  // State untuk Filters & Pagination
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // State untuk menampung baris ID mana saja yang sedang di-expand (buka detail)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Trigger Fetch Data ketika filter atau halaman berubah
  useEffect(() => {
    if (organizationId) {
      fetchOpeningStockList({
        search: search || undefined,
        status: status || undefined,
        source: source || undefined,
        organization_id: organizationId,
        page,
        limit,
      });
    }
  }, [search, status, source, page, organizationId]);

  // Toggle baris detail item
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper badge warna status
  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
      CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
      APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
      CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return `px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] || "bg-slate-100 text-slate-700 border-slate-200"}`;
  };

  return (
    <div className="max-w-8xl mx-auto p-6 space-y-6">
      {/* Header Utama */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Opening Stock List
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Riwayat saldo awal inventaris dan detail baris material/item.
          </p>
        </div>
      </div>

      {/* TATA LETAK FILTER (Premium Panel) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Kolom Search */}
        <div className="relative">
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
            Search Document
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari code atau notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
            <FaSearch className="absolute left-3 top-3 text-slate-400 w-3.5 h-3.5" />
          </div>
        </div>

        {/* Filter Status (Sesuai parameter Swagger Anda) */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Filter Source (Sesuai parameter Swagger Anda) */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
            Source Origin
          </label>
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
          >
            <option value="">All Source</option>
            <option value="MANUAL">MANUAL</option>
            <option value="EXCEL">EXCEL</option>
          </select>
        </div>

        {/* Tombol Clear / Info */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              setSearch("");
              setStatus("");
              setSource("");
              setPage(1);
            }}
            className="w-full md:w-auto px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* CONTAINER TABEL DATA UTAMA */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10"></th>
                <th className="py-3.5 px-4">Document Code</th>
                <th className="py-3.5 px-4">Period Date</th>
                <th className="py-3.5 px-4">Week</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">File Name</th>
                <th className="py-3.5 px-4 text-center">Total Items</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-400 font-medium"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin text-blue-600 w-5 h-5" />
                      Loading data ledger...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-400 font-medium"
                  >
                    Belum ada data opening stock ditemukan.
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const isExpanded = !!expandedRows[row.id];
                  return (
                    <React.Fragment key={row.id}>
                      {/* Baris Utama Document Header */}
                      <tr
                        onClick={() => toggleRow(row.id)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${isExpanded ? "bg-blue-50/20" : ""}`}
                      >
                        <td className="py-4 px-4 text-center">
                          {isExpanded ? (
                            <FaChevronUp className="w-3 h-3 text-slate-400" />
                          ) : (
                            <FaChevronDown className="w-3 h-3 text-slate-400" />
                          )}
                        </td>
                        <td className="py-4 px-4 font-semibold text-blue-600 tracking-tight">
                          {row.code || "-"}
                        </td>
                        <td className="py-4 px-4">{row.period_date}</td>
                        <td className="py-4 px-4 font-medium">
                          W-{row.week_number}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-medium">
                            {row.source}
                          </span>
                        </td>
                        <td
                          className="py-4 px-4 text-xs text-slate-500 max-w-[180px] truncate"
                          title={row.file_name || ""}
                        >
                          {row.file_name || "-"}
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-slate-800">
                          {(row as any).total_items || 0}
                        </td>
                        <td className="py-4 px-4">
                          <span className={getStatusBadge(row.status)}>
                            {row.status}
                          </span>
                        </td>
                      </tr>

                      {/* Baris Detail Nested Items (Muncul saat di-expand) */}
                      {isExpanded && (
                        <tr className="bg-slate-50/40">
                          <td
                            colSpan={8}
                            className="p-4 border-t border-b border-slate-100"
                          >
                            <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-inner">
                              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <FaLayerGroup className="text-blue-500" />
                                <span>
                                  Material Item Lines (
                                  {(row as any).openingBalanceStockItems
                                    ?.length || 0}
                                  )
                                </span>
                              </div>

                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                                    <th className="py-2.5 px-3">Item Code</th>
                                    <th className="py-2.5 px-3">Description</th>
                                    <th className="py-2.5 px-3">Sub Whse</th>
                                    <th className="py-2.5 px-3">Bin Code</th>
                                    <th className="py-2.5 px-3">Pallet Code</th>
                                    <th className="py-2.5 px-3 text-right">
                                      Qty
                                    </th>
                                    <th className="py-2.5 px-3">UoM</th>
                                    <th className="py-2.5 px-3">Prod Date</th>
                                    <th className="py-2.5 px-3">Notes</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-600">
                                  {(
                                    (row as any).openingBalanceStockItems || []
                                  ).map((item: any) => (
                                    <tr
                                      key={item.id}
                                      className="hover:bg-slate-50/50"
                                    >
                                      <td className="py-2 px-3 font-bold text-slate-800">
                                        {item.item_code}
                                      </td>
                                      <td
                                        className="py-2 px-3 text-slate-500 max-w-[160px] truncate"
                                        title={item.item?.description || ""}
                                      >
                                        {item.item?.description || "-"}
                                      </td>
                                      <td className="py-2 px-3 font-medium text-amber-700">
                                        {item.warehouse_sub_code}
                                      </td>
                                      <td className="py-2 px-3">
                                        {item.warehouse_bin_code || "-"}
                                      </td>
                                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                                        {item.pallet_code || "-"}
                                      </td>
                                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                                        {item.quantity}
                                      </td>
                                      <td className="py-2 px-3 font-medium">
                                        {item.uom}
                                      </td>
                                      <td className="py-2 px-3">
                                        {item.production_date || "-"}
                                      </td>
                                      <td
                                        className="py-2 px-3 text-slate-400 italic max-w-[140px] truncate"
                                        title={item.notes || ""}
                                      >
                                        {item.notes || "-"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* INTEGRASI CONTROLLER PAGINATION */}
        {meta && (
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-3.5 flex items-center justify-between">
            <div className="text-xs font-medium text-slate-500">
              Showing page{" "}
              <span className="font-bold text-slate-700">{meta.page}</span> of{" "}
              <span className="font-bold text-slate-700">
                {meta.totalPages}
              </span>{" "}
              ({meta.total} entries)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={!meta.hasPreviousPage || isLoading}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
              >
                Previous
              </button>
              <button
                disabled={!meta.hasNextPage || isLoading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
