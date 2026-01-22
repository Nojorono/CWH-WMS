import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  CellContext,
} from "@tanstack/react-table";
import { useFormContext, useWatch, Path } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { FormValues, ItemForm } from "../formTypes";
import { useMemo } from "react";

export default function ItemTable({
  items,
  itemsPath,
  doIndex,
  posIndex,
  removeItem,
  isEditMode,
  uomList,
}: {
  items: ItemForm[];
  itemsPath: string;
  doIndex: number;
  posIndex: number;
  removeItem: (rowIndex: number) => void;
  isEditMode?: boolean;
  uomList: { id: any; code: string; name: string }[];
}) {
  const { register } = useFormContext<FormValues>();

  // Cek apakah ada minimal satu quantity_inspection yang terisi
  const showQtyInspection = useMemo(
    () =>
      items.some(
        (item) =>
          item.quantity_inspection !== undefined &&
          item.quantity_inspection !== "" &&
          item.quantity_inspection !== 0
      ),
    [items]
  );

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
        cell: ({ row }: CellContext<ItemForm, unknown>) => {
          const rowIndex = row.index;
          return isEditMode ? (
            <input
              type="number"
              className="border px-2 py-1 w-20 text-right rounded"
              {...register(
                `deliveryOrders.${doIndex}.pos.${posIndex}.items.${rowIndex}.qty`,
                { valueAsNumber: true }
              )}
            />
          ) : (
            <div>{row.original.qty}</div>
          );
        },
      },
      ...(showQtyInspection
        ? [
            {
              accessorKey: "quantity_inspection",
              header: "Qty Inspection",
              cell: ({ row }: CellContext<ItemForm, unknown>) => {
                const value = row.original.quantity_inspection;
                return (
                  <div>
                    {value !== undefined && value !== null && value !== ""
                      ? value
                      : "-"}
                  </div>
                );
              },
            },
          ]
        : []),
      {
        accessorKey: "uom",
        header: "UOM",
        cell: ({ row, getValue }: CellContext<ItemForm, unknown>) => {
          const rowIndex = row.index;

          return isEditMode ? (
            <select
              className="border px-2 py-1 rounded w-full"
              {...register(
                `deliveryOrders.${doIndex}.pos.${posIndex}.items.${rowIndex}.uom` as const,
                { required: "UoM wajib dipilih" }
              )}
            >
              <option value="">-- Select UoM --</option>
              {uomList.map((u) => (
                <option key={u.id} value={u.code}>
                  {u.name}
                </option>
              ))}
            </select>
          ) : (
            <div>{getValue() as string}</div>
          );
        },
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
    data: items,
    columns,
    getRowId: (_row, index) => `${doIndex}-${posIndex}-${items[index]?.id}`, // 🔥 STABIL
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table className="min-w-full text-sm bg-white border rounded">
      <thead className="bg-slate-100">
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id}>
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
  );
}
