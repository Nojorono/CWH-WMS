import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { MdCheck, MdClose, MdEdit, MdInbox } from "react-icons/md";

type DOSuggestionDetail = any;

interface TableProps {
  data: any[];
  revisions: Map<string, number>;
  handleRevisionChange: (sku: string, value: string) => void;
  editingRows: string[];
  toggleEditRow: (sku: string) => void;
  cancelEditRow: (sku: string) => void;
}

interface TableMeta {
  revisions: Map<string, number>;
  editingRows: string[];
  handleRevisionChange: (sku: string, value: string) => void;
  toggleEditRow: (sku: string) => void;
  cancelEditRow: (sku: string) => void;
}

const columnHelper = createColumnHelper<DOSuggestionDetail>();

export default function SuggestionTable({
  data,
  revisions,
  handleRevisionChange,
  editingRows,
  toggleEditRow,
  cancelEditRow,
}: TableProps) {
  // 1. LOGIKA AUTO-SORTING (Mendorong Additional & Revised ke Paling Atas)
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aAdditional = String(a.id).startsWith("temp-");
      const bAdditional = String(b.id).startsWith("temp-");

      // Prioritas 1: Item Baru (Additional) selalu di atas sekali
      if (aAdditional && !bAdditional) return -1;
      if (!aAdditional && bAdditional) return 1;

      const aModified =
        revisions.has(a.item_code) ||
        (a.item_qty_revision && a.item_qty_revision !== "0");
      const bModified =
        revisions.has(b.item_code) ||
        (b.item_qty_revision && b.item_qty_revision !== "0");

      // Prioritas 2: Item yang Sedang/Sudah Direvisi di atas item System biasa
      if (aModified && !bModified) return -1;
      if (!aModified && bModified) return 1;

      return 0; // Tetapkan urutan asli untuk sesama status
    });
  }, [data, revisions]);

  console.log("data", data);

  const columns = useMemo(
    () => [
      columnHelper.accessor("product_name", {
        header: "SKU Name",
        cell: (info) => (
          <div>
            <span className="font-mono font-bold text-slate-800">
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("item_code", {
        header: "SKU Code",
        cell: (info) => (
          <div>
            <span className="font-mono font-bold text-slate-800">
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("item_qty_suggestion", {
        header: "Suggest Qty",
        cell: (info) => (
          <div className=" font-bold text-slate-500">
            {info.getValue() || 0}
          </div>
        ),
      }),
      columnHelper.accessor("item_qty_revision", {
        header: "Qty Revision",
        cell: ({ row, getValue, table }) => {
          const meta = table.options.meta as TableMeta;
          const item = row.original;
          const isEditing = meta.editingRows.includes(item.item_code);

          const currentVal = meta.revisions.has(item.item_code)
            ? meta.revisions.get(item.item_code)
            : getValue();

          if (isEditing) {
            // UX Tweak: Kosongkan angka 0 agar user leluasa input
            const displayValue =
              currentVal === 0 || currentVal === "0" ? "" : currentVal;

            return (
              <input
                type="number"
                min="0"
                className="w-20 px-2 py-1.5 text-sm border-2 border-blue-400 rounded-md focus:outline-none focus:ring-4 focus:ring-blue-100  font-bold text-blue-700 bg-white shadow-sm transition-all"
                value={displayValue}
                onChange={(e) =>
                  meta.handleRevisionChange(item.item_code, e.target.value)
                }
                onFocus={(e) => e.target.select()} // Auto-block teks saat fokus
                placeholder="0"
                autoFocus
              />
            );
          }
          return <span className="font-bold text-slate-700">{currentVal}</span>;
        },
      }),
      columnHelper.accessor("item_qty_submitted", {
        header: "Submitted Qty",
        cell: (info) => (
          <div className=" font-bold text-slate-500">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.display({
        id: "status",
        header: "Status",
        cell: ({ row, table }) => {
          const meta = table.options.meta as TableMeta;
          const item = row.original;

          const isEdited = meta.revisions.has(item.item_code);
          const hasSavedRevision =
            item.item_qty_revision && item.item_qty_revision !== "0";

          // 1. Cek apakah ini item baru di layar (on action)
          const isTempAdditional = String(item.id).startsWith("temp-");

          const isDbAdditional = Number(item.item_qty_suggestion) === 0 && Number(item.item_qty_revision) != 0;

          // Gabungkan keduanya
          const isAdditional = isTempAdditional || isDbAdditional;

          if (isAdditional) {
            return (
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-purple-200">
                Additional
              </span>
            );
          }

          if (isEdited) {
            return (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.1)]">
                Edited
              </span>
            );
          }

          if (hasSavedRevision) {
            return (
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-200">
                Revised
              </span>
            );
          }

          return (
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider border border-slate-200">
              Generated by System
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "action",
        header: "Action",
        cell: ({ row, table }) => {
          const meta = table.options.meta as TableMeta;
          const item = row.original;
          const isEditing = meta.editingRows.includes(item.item_code);

          if (isEditing) {
            return (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => meta.toggleEditRow(item.item_code)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md transition shadow-sm font-bold text-xs"
                >
                  <MdCheck size={16} /> Save
                </button>
                <button
                  onClick={() => meta.cancelEditRow(item.item_code)}
                  className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md transition"
                  title="Cancel Edit"
                >
                  <MdClose size={16} />
                </button>
              </div>
            );
          }

          return (
            <button
              onClick={() => meta.toggleEditRow(item.item_code)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-md transition border border-blue-200 shadow-sm"
            >
              <MdEdit size={14} /> Revise
            </button>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: sortedData, // 2. Gunakan data yang SUDAH DI-SORT
    columns,
    getCoreRowModel: getCoreRowModel(),

    // CRITICAL UX FIX: Menggunakan item_code sebagai ID Baris permanen.
    // Ini mencegah baris kehilangan fokus input saat posisinya melompat ke atas secara realtime.
    getRowId: (row) => row.item_code,

    meta: {
      revisions,
      editingRows,
      handleRevisionChange,
      toggleEditRow,
      cancelEditRow,
    } as TableMeta,
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {sortedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
          <MdInbox size={48} className="mb-3 text-slate-300" />
          <p className="text-sm font-medium">Tidak ada data SKU Suggestion.</p>
          <p className="text-xs">Klik "+ Add Item" untuk menambahkan SKU.</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-800 text-white sticky top-0 z-10 shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left font-bold tracking-wide uppercase text-xs"
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
              {table.getRowModel().rows.map((row) => {
                const item = row.original;
                const isAdditional = String(item.id).startsWith("temp-");
                const isActivelyEdited = revisions.has(item.item_code);
                const isPreviouslyRevised =
                  item.item_qty_revision && item.item_qty_revision !== "0";

                let rowBg = "bg-white hover:bg-slate-50";

                if (isAdditional) {
                  rowBg = "bg-purple-50 hover:bg-purple-100";
                } else if (isActivelyEdited) {
                  rowBg = "bg-blue-50 hover:bg-blue-100";
                } else if (isPreviouslyRevised) {
                  rowBg = "bg-orange-50 hover:bg-orange-100";
                }

                return (
                  <tr
                    key={row.id} // ID ini dijamin stabil berkat getRowId
                    className={`transition-colors duration-200 ${rowBg}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 align-middle">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
