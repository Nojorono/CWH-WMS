import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  CellContext,
} from "@tanstack/react-table";
import { useFormContext, useWatch, Path } from "react-hook-form";
import { FormValues, ItemForm } from "../formTypes";
import { useMemo } from "react";

export default function ItemTable({
  itemsPath,
  doIndex,
  posIndex,
  removeItem,
  isEditMode,
}: {
  itemsPath: string;
  doIndex: number;
  posIndex: number;
  removeItem: (rowIndex: number) => void;
  isEditMode?: boolean;
}) {
  const { register, control } = useFormContext<FormValues>();

  // ✅ FIX TS 2769
  const items = useWatch({
    control,
    name: itemsPath as Path<FormValues>,
  }) as ItemForm[];

  const data = useMemo(() => items ?? [], [items]);

  const columns = useMemo<ColumnDef<ItemForm>[]>(
    () => [
      {
        accessorKey: "sku",
        header: "SKU",
      },
      {
        accessorKey: "description",
        header: "Description",
      },
      {
        accessorKey: "qty",
        header: "Qty Plan",
        cell: ({ row }) => {
          const rowIndex = row.index;

          return isEditMode ? (
            <input
              type="text"
              inputMode="numeric"
              className="border px-2 py-1 w-20 text-right rounded"
              {...register(
                `deliveryOrders.${doIndex}.pos.${posIndex}.items.${rowIndex}.qty`,
                {
                  setValueAs: (v) => {
                    if (v === "" || v === null || v === undefined) return 0;
                    return Number(v);
                  },
                }
              )}
            />
          ) : (
            <div>{row.original.qty}</div>
          );
        },
      },

      {
        accessorKey: "uom",
        header: "UoM",
      },
      ...(isEditMode
        ? [
            {
              id: "actions",
              header: "Action",
              cell: ({ row }: CellContext<ItemForm, unknown>) => (
                <button
                  type="button"
                  className="text-xs text-rose-600"
                  onClick={() => removeItem(row.index)}
                >
                  Remove
                </button>
              ),
            },
          ]
        : []),
    ],
    [doIndex, posIndex, isEditMode, register, removeItem]
  );

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.item_id, // 🔥 WAJIB
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div className="mt-3">
      <table className="min-w-full text-sm bg-white border rounded">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="bg-slate-100">
              {hg.headers.map((h) => (
                <th key={h.id} className="px-3 py-2 text-left">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
