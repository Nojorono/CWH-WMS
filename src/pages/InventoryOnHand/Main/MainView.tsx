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
import { useStoreInventorySelisih } from "../../../DynamicAPI/stores/Store/MasterStore";
import ActIndicator from "../../../components/ui/activityIndicator";
import { InventorySelisihItem } from "../../../DynamicAPI/types/InventorySelisih";

const InventoryVisibility: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { fetchUsingParam, list } = useStoreInventorySelisih();

  const [expanded, setExpanded] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const fetchData = async () => {
    await fetchUsingParam({
      organization_code: "CWH",
      subinventory_code: "SELISIH",
    });
  };

  useEffect(() => {
    fetchData();
  }, [fetchUsingParam]);

  console.log("LIST DATA", list);

  // Ekstraksi array data dari list API
  const itemsData = useMemo<InventorySelisihItem[]>(() => {
    return Array.isArray(list) ? list : [];
  }, [list]);

  // Hitung summary secara manual dari data
  const summary = useMemo(() => {
    return {
      total_items: itemsData.length,
      total_quantity: itemsData.reduce(
        (acc, curr) => acc + (curr.QUANTITY || 0),
        0,
      ),
      total_lines: itemsData.reduce(
        (acc, curr) => acc + (curr.LINE_COUNT || 0),
        0,
      ),
    };
  }, [itemsData]);

  const columnHelper = createColumnHelper<InventorySelisihItem>();

  const columns = useMemo<ColumnDef<InventorySelisihItem, any>[]>(
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

      columnHelper.accessor("ITEM_CODE", {
        header: "Item Code",
        cell: (info) => (
          <span className="font-bold text-slate-800">{info.getValue()}</span>
        ),
      }),

      columnHelper.accessor("ITEM_DESCRIPTION", {
        header: "Product Detail",
        cell: (info) => (
          <div className="flex flex-col min-w-[200px]">
            <span className="font-medium text-slate-700">
              {info.getValue()}
            </span>
            <span className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">
              {info.row.original.ITEM_NUMBER}
            </span>
          </div>
        ),
      }),

      columnHelper.accessor("ORGANIZATION_CODE", {
        header: "Org Code",
        cell: (info) => (
          <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded">
            {info.getValue()}
          </span>
        ),
      }),

      columnHelper.accessor("SUBINVENTORY_CODE", {
        header: "Sub Inventory",
        cell: (info) => (
          <span className="text-xs font-black px-2 py-1 rounded bg-rose-50 text-rose-600 border border-rose-100">
            {info.getValue()}
          </span>
        ),
      }),

      columnHelper.accessor("QUANTITY", {
        header: "Total Selisih",
        cell: (info) => (
          <div className="flex items-baseline space-x-1">
            <span className="font-bold text-slate-800 text-lg">
              {info.getValue().toLocaleString()}
            </span>
          </div>
        ),
      }),

      columnHelper.accessor("LINE_COUNT", {
        header: "Txn Lines",
        cell: (info) => (
          <div className="flex items-center text-slate-500 font-mono text-xs font-bold">
            <span className="mr-1">📄</span> {info.getValue()} Lines
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: itemsData,
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

  if (!itemsData || itemsData.length === 0)
    return (
      <div className="p-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">
          Syncing Inventory Selisih...
        </p>
      </div>
    );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error("Gagal memuat ulang data:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">

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
          Showing {table.getRowModel().rows.length} of {itemsData.length} Items
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
                      className="px-6 py-4 text-[14px] font-black text-white-400 uppercase tracking-widest cursor-pointer hover:bg-orange-600 transition-colors"
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
                    className={`group transition-all hover:bg-rose-50/40 ${
                      row.getIsExpanded() ? "bg-rose-50/60" : ""
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

                  {/* EXPANDED ROW UNTUK DETAIL LINES */}
                  {row.getIsExpanded() && (
                    <tr className="bg-slate-50 shadow-inner">
                      <td colSpan={columns.length} className="px-12 py-8">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-widest flex items-center">
                              <span className="mr-2">📄</span> Transaction Lines
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400 italic">
                              Total {row.original.LINE_COUNT} Lines
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {row.original.LINES.map((line, idx) => (
                              <div
                                key={idx}
                                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                      Txn ID
                                    </p>
                                    <p className="text-[13px] font-black text-slate-800">
                                      {line.CREATE_TRANSACTION_ID}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                      Date Received
                                    </p>
                                    <p className="text-[12px] font-bold text-slate-700">
                                      {new Date(
                                        line.DATE_RECEIVED,
                                      ).toLocaleDateString("id-ID", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono inline-block">
                                      Org: {line.ORGANIZATION_CODE}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-black text-rose-600">
                                      {line.TRANSACTION_QUANTITY}{" "}
                                      <span className="text-[10px] text-slate-400">
                                        {line.TRANSACTION_UOM_CODE}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {row.original.LINES.length === 0 && (
                              <div className="col-span-full p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 italic text-xs">
                                No transaction lines available for this item.
                              </div>
                            )}
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
  const colorMap: Record<string, string> = {
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
        {value.toLocaleString()}
      </p>
    </div>
  );
};

export default InventoryVisibility;
