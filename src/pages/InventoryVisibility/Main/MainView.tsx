import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useStoreInventoryVisibility } from "../../../DynamicAPI/stores/Store/MasterStore";
import {
  InventoryVisibilityResponse,
  InventoryVisibilityItem,
} from "../../../DynamicAPI/types/InventoryVisibilty";
import Button from "../../../components/ui/button/Button";
import { FaSync } from "react-icons/fa";
import ActIndicator from "../../../components/ui/activityIndicator";

const InventoryVisibility: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const store = useStoreInventoryVisibility() as any;
  const { fetchAll, list } = store;

  const [expanded, setExpanded] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  // UPDATE: Pengaman ekstra untuk membaca root wrapper payload API dengan aman
  const currentData = useMemo<InventoryVisibilityResponse | null>(() => {
    if (!list) return null;

    if (Array.isArray(list) && list[0]?.data) {
      return list[0].data;
    }

    if (typeof list === "object" && list !== null && "data" in list) {
      return (list as any).data;
    }

    return list;
  }, [list]);

  const columnHelper = createColumnHelper<InventoryVisibilityItem>();

  const columns = useMemo<ColumnDef<InventoryVisibilityItem, any>[]>(
    () => [
      {
        id: "expander",
        header: () => <span className="pl-2">Info</span>,
        cell: ({ row }) => (
          <button
            onClick={row.getToggleExpandedHandler()}
            className={`transition-all duration-200 p-2 rounded-full hover:bg-slate-100 ${
              row.getIsExpanded() ? "rotate-90 text-blue-600" : "text-slate-400"
            }`}
          >
            <span className="block w-4 h-4 flex items-center justify-center font-bold">
              ▶
            </span>
          </button>
        ),
      },

      columnHelper.accessor("sku", {
        header: "SKU",
        cell: (info) => (
          <span className="font-bold text-slate-800">{info.getValue()}</span>
        ),
      }),

      columnHelper.accessor("item_name", {
        header: "Product Name",
        cell: (info) => {
          const {
            item_number,
            earliest_production_date,
            latest_production_date,
          } = info.row.original;

          const formatDate = (dateStr: string) =>
            dateStr ? new Date(dateStr).toLocaleDateString("id-ID") : "-";

          return (
            <div className="flex flex-col min-w-[240px]">
              <span className="font-medium text-slate-700">
                {info.getValue()}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                {item_number}
              </span>
              <span className="text-[9px] text-blue-500 font-medium mt-0.5">
                📅 Prod: {formatDate(earliest_production_date)} -{" "}
                {formatDate(latest_production_date)}
              </span>
            </div>
          );
        },
      }),

      columnHelper.accessor("total_quantity", {
        header: "Total Stock",
        cell: (info) => (
          <div className="flex items-baseline space-x-1">
            <span className="font-bold text-slate-800">
              {info.getValue().toLocaleString()}
            </span>
          </div>
        ),
      }),

      columnHelper.accessor("booked_quantity", {
        header: "Booked",
        cell: (info) => (
          <div className="flex items-center space-x-2">
            <span
              className={`font-bold ${
                info.getValue() > 0 ? "text-red-500" : "text-slate-300"
              }`}
            >
              {info.getValue().toLocaleString()}
            </span>
          </div>
        ),
      }),

      columnHelper.accessor("available_quantity", {
        header: "Available",
        cell: (info) => (
          <span
            className={`text-sm font-black px-2 py-1 rounded ${
              info.getValue() > 0
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-slate-50 text-slate-400"
            }`}
          >
            {info.getValue().toLocaleString()}
          </span>
        ),
      }),

      columnHelper.accessor("uom", {
        header: "UoM",
        cell: (info) => (
          <div className="flex items-baseline space-x-1">
            <span className="font-bold text-blue-500">
              {info.row.original.uom}
            </span>
          </div>
        ),
      }),

      columnHelper.accessor("booking_count", {
        header: "Booked By DO",
        cell: (info) => {
          const bookings = info.row.original.booking_details || [];
          const uniqueDOCount = new Set(bookings.map((book) => book.do_number))
            .size;

          return (
            <div className="flex items-center space-x-2">
              <span
                className={`font-bold ${
                  uniqueDOCount > 0 ? "text-orange-400" : "text-slate-300"
                }`}
              >
                {uniqueDOCount}{" "}
                <span className="text-slate-500 text-[10px]">DO</span>
              </span>
            </div>
          );
        },
      }),

      columnHelper.accessor("pallet_count", {
        header: "Pallets",
        cell: (info) => (
          <div className="flex items-center text-slate-500 font-mono text-xs font-bold">
            <span className="mr-1">📦</span> {info.getValue()} PLT
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: currentData?.items || [],
    columns,
    state: {
      expanded,
      globalFilter,
    },
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: () => true,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // PENGAMAN RENDERING: Mencegah error crash jika data summary belum siap di-load
  if (!currentData || !currentData.summary)
    return (
      <div className="p-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">
          Syncing Inventory...
        </p>
      </div>
    );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAll();
    } catch (error) {
      console.error("Gagal memuat ulang data:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* SUMMARY DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatItem
          label="Total SKU"
          value={currentData.summary.total_items}
          color="blue"
        />
        <StatItem
          label="Total Quantity"
          value={currentData.summary.total_quantity}
          color="indigo"
        />
        <StatItem
          label="Total Booked Outbound"
          value={currentData.summary.total_booked_quantity}
          color="orange"
        />
        <StatItem
          label="Total Available"
          value={currentData.summary.total_available_quantity}
          color="emerald"
        />
        <StatItem
          label="Pending Booking Items"
          value={currentData.summary.items_with_pending_bookings}
          color="rose"
        />

        <div className="flex justify-end items-center md:col-span-5">
          <Button
            variant="action"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={isRefreshing ? "opacity-75 cursor-not-allowed" : ""}
          >
            <FaSync className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {isRefreshing && <ActIndicator />}

      {/* FILTER SEARCH */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search SKU or Product Name..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase">
          Showing {table.getRowModel().rows.length} of{" "}
          {currentData.items.length} Items
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-orange-500 text-white text-lg">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-[14px] font-black text-white-400 uppercase tracking-widest cursor-pointer select-none"
                      onClick={header.column.getToggleSortingHandler()}
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
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    className={`group transition-all hover:bg-blue-50/40 ${
                      row.getIsExpanded() ? "bg-blue-50/60" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 align-middle text-[15px]"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* EXPANDED SECTION (DETAIL LOGISTIK BARANG) */}
                  {row.getIsExpanded() && (
                    <tr className="bg-slate-50 shadow-inner">
                      <td colSpan={columns.length} className="px-12 py-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* DETAIL PALLET LOCATION */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center">
                                <span className="mr-2">🏪</span> Pallet Location
                              </h4>
                              <span className="text-[10px] font-bold text-slate-400 italic">
                                Total {row.original.pallet_count} Pallets
                              </span>
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                              {(() => {
                                // 1. BUAT CONSUMPTION POOL BOOKING BERDASARKAN UOM DAN WEEK NUMBER
                                const bookingPool: Record<string, number> = {};

                                (row.original.booking_details || []).forEach(
                                  (book) => {
                                    // UOM ada di level item; fallback ke book.uom jika API kirim
                                    const bookUom =
                                      row.original.uom ||
                                      (book as { uom?: string | null }).uom ||
                                      "";
                                    const key = `${bookUom}_${book.week_number}`;
                                    bookingPool[key] =
                                      (bookingPool[key] || 0) +
                                      (book.quantity ?? 0);
                                  },
                                );

                                // 2. LOOP DAN KALKULASI PENGURANGAN STOCK SECARA PRESISI
                                return row.original.pallet_details.map(
                                  (plt, idx) => {
                                    const palletUom =
                                      row.original.uom ||
                                      (plt as { uom?: string | null }).uom ||
                                      "";
                                    const poolKey = `${palletUom}_${plt.week_number}`;
                                    const totalBookedForThisMatch =
                                      bookingPool[poolKey] || 0;

                                    let deductedQuantity = 0;
                                    if (totalBookedForThisMatch > 0) {
                                      deductedQuantity = Math.min(
                                        plt.quantity,
                                        totalBookedForThisMatch,
                                      );
                                      bookingPool[poolKey] -= deductedQuantity; // Susutkan isi pool utama
                                    }

                                    const calculatedAvailableQty =
                                      plt.quantity - deductedQuantity;

                                    return (
                                      <div
                                        key={idx}
                                        className={`bg-white p-3 rounded-lg border flex justify-between items-center shadow-sm transition-colors ${
                                          calculatedAvailableQty === 0
                                            ? "border-red-200 bg-red-50/20 opacity-70"
                                            : "border-slate-200 hover:border-blue-300"
                                        }`}
                                      >
                                        <div>
                                          <p className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">
                                              {plt.pallet_code}
                                            </span>
                                            <span className="text-[9px] font-normal text-slate-400">
                                              (Prod:{" "}
                                              {plt.production_date
                                                ? new Date(
                                                    plt.production_date,
                                                  ).toLocaleDateString("id-ID")
                                                : "-"}
                                              )
                                            </span>
                                          </p>
                                          <p className="text-[12px] text-slate-500 font-medium uppercase tracking-tighter mt-1">
                                            {plt.warehouse_sub_name}{" "}
                                            <span className="text-slate-300 mx-1">
                                              |
                                            </span>{" "}
                                            {plt.warehouse_bin_code ? (
                                              <span className="text-slate-700 font-bold">
                                                {plt.warehouse_bin_code}
                                              </span>
                                            ) : (
                                              <span className="text-amber-600 font-bold italic text-[11px]">
                                                NO BIN (STAGING)
                                              </span>
                                            )}
                                          </p>
                                        </div>

                                        <div className="text-right">
                                          {/* INDIKATOR QTY LIVE (Format Sisa/Total UoM) */}
                                          <div className="flex flex-col items-end">
                                            <p className="text-sm font-black text-slate-800 tracking-tight">
                                              {deductedQuantity > 0 ? (
                                                <>
                                                  <span className="text-emerald-600 font-black">
                                                    {calculatedAvailableQty}
                                                  </span>
                                                  <span className="text-slate-400 font-medium mx-0.5">
                                                    /
                                                  </span>
                                                  <span className="text-slate-500 font-bold">
                                                    {plt.quantity}
                                                  </span>
                                                </>
                                              ) : (
                                                <span className="text-emerald-600 font-black">
                                                  {plt.quantity}
                                                </span>
                                              )}
                                              <small className="text-[12px] text-slate-400 font-normal ml-1">
                                                {palletUom}
                                              </small>
                                            </p>

                                            {/* Label Micro Status Tag */}
                                            {deductedQuantity > 0 ? (
                                              <span className="text-[9px] font-black text-red-500 bg-red-50 border border-red-100 px-1 py-0.5 rounded mt-1 animate-pulse">
                                                🔏 ALLOCATED {deductedQuantity}
                                              </span>
                                            ) : (
                                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded mt-1">
                                                ✓ FULL READY
                                              </span>
                                            )}

                                            <p className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded font-mono font-bold inline-block mt-1">
                                              WK {plt.week_number}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  },
                                );
                              })()}

                              {row.original.pallet_details.length === 0 && (
                                <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 italic text-xs">
                                  No pallet tracking available
                                </div>
                              )}
                            </div>
                          </div>

                          {/* DETAIL ALLOCATION & RESERVATIONS */}
                          <div>
                            {(() => {
                              const groupedBookings =
                                row.original.booking_details.reduce(
                                  (acc: any, curr) => {
                                    if (!acc[curr.do_number]) {
                                      acc[curr.do_number] = [];
                                    }
                                    acc[curr.do_number].push(curr);
                                    return acc;
                                  },
                                  {},
                                );

                              const uniqueDOCount =
                                Object.keys(groupedBookings).length;

                              return (
                                <>
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-widest flex items-center">
                                      <span className="mr-2">📋</span>{" "}
                                      Allocation & Reservations
                                    </h4>
                                    <span className="text-[10px] font-bold text-slate-400 italic">
                                      Total {uniqueDOCount} DO Bookings
                                    </span>
                                  </div>

                                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {Object.entries(groupedBookings).map(
                                      ([doNumber, items]: [string, any]) => (
                                        <div
                                          key={doNumber}
                                          className="bg-orange-50/30 rounded-lg border border-orange-100 overflow-hidden shadow-sm"
                                        >
                                          <div className="bg-orange-100/50 px-3 py-1.5 border-b border-orange-100 flex justify-between items-center">
                                            <span className="font-black text-orange-700 text-[11px]">
                                              DO: {doNumber}
                                            </span>
                                            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-orange-600 font-bold border border-orange-200">
                                              {items.length} Memo Items
                                            </span>
                                          </div>

                                          <div className="divide-y divide-orange-100/50">
                                            {items.map(
                                              (book: any, idx: number) => (
                                                <div
                                                  key={idx}
                                                  className="p-3 flex justify-between items-center hover:bg-orange-50 transition-colors"
                                                >
                                                  <div>
                                                    <p className="text-[10px] text-orange-600 font-bold">
                                                      Memo: {book.memo_number}
                                                    </p>
                                                    <div className="text-[9px] text-slate-500 uppercase mt-0.5">
                                                      Loc:{" "}
                                                      {
                                                        book.source_warehouse_sub_name
                                                      }
                                                      <span className="text-slate-300 mx-1">
                                                        |
                                                      </span>
                                                      {book.source_bin_code ? (
                                                        <span className="font-bold text-slate-700 bg-slate-100 px-1 rounded">
                                                          {book.source_bin_code}
                                                        </span>
                                                      ) : (
                                                        <span className="text-amber-600 font-bold italic">
                                                          NO BIN (STAGING)
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="text-sm font-black text-orange-600 font-mono">
                                                      {book.quantity}
                                                    </p>
                                                    <p className="text-[9px] text-slate-400 uppercase">
                                                      {row.original.uom} (Wk{" "}
                                                      {book.week_number})
                                                    </p>
                                                  </div>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      ),
                                    )}

                                    {row.original.booking_details.length ===
                                      0 && (
                                      <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 italic text-xs">
                                        No active reservations for this SKU
                                      </div>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 rounded-md border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              PREV
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 rounded-md border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              NEXT
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-500">
              Page{" "}
              <span className="text-slate-900 font-bold">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              of{" "}
              <span className="text-slate-900 font-bold">
                {table.getPageCount()}
              </span>
            </span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="text-xs border rounded p-1 bg-white font-bold text-slate-600 outline-none"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  SHOW {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => {
  const colorMap: any = {
    blue: "border-l-blue-500 text-blue-600",
    indigo: "border-l-indigo-500 text-indigo-600",
    orange: "border-l-orange-500 text-orange-600",
    emerald: "border-l-emerald-500 text-emerald-600",
    rose: "border-l-rose-500 text-rose-600",
  };
  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 border-l-4 ${colorMap[color]}`}
    >
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-2xl font-black text-slate-800 tracking-tight">
        {(value ?? 0).toLocaleString()}
      </p>
    </div>
  );
};

export default InventoryVisibility;
