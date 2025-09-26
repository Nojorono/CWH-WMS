import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { useFormContext } from "react-hook-form";
import { ItemForm, FormValues } from "../formTypes";
import {
  useStoreItem,
  useStoreUom,
} from "../../../../../../DynamicAPI/stores/Store/MasterStore";
import { useEffect } from "react";

export default function ItemTable({
  data,
  doIndex,
  posIndex,
  removeItem,
  isEditMode,
}: {
  data: ItemForm[];
  doIndex: number;
  posIndex: number;
  removeItem: (rowIndex: number) => void;
  isEditMode: boolean;
}) {
  const { register } = useFormContext<FormValues>();
  const { fetchAll: fetchAllUom, list: uomList } = useStoreUom();
  const { fetchAll: fetchAllItem, list: itemList } = useStoreItem();

  useEffect(() => {
    fetchAllUom();
    fetchAllItem();
  }, [fetchAllUom, fetchAllItem]);

  const columns: ColumnDef<ItemForm>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
      cell: (info) => <div>{info.getValue() as string}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: (info) => <div>{info.getValue() as string}</div>,
    },
    {
      accessorKey: "qty",
      header: "Qty Plan",
      cell: (info) => {
        const rowIndex = info.row.index;
        return isEditMode ? (
          <input
            type="number"
            className="border px-2 py-1 w-20 text-right rounded"
            {...register(
              `deliveryOrders.${doIndex}.pos.${posIndex}.items.${rowIndex}.qty` as const,
              { valueAsNumber: true }
            )}
          />
        ) : (
          <div>{info.getValue() as string}</div>
        );
      },
    },
    {
      accessorKey: "uom",
      header: "UoM",
      cell: (info) => {
        const rowIndex = info.row.index;
        return isEditMode ? (
          <select
            className="border px-2 py-1 rounded"
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
          <div>{info.getValue() as string}</div>
        );
      },
    },
    // Only show actions column in edit mode
    ...(isEditMode
      ? [
          {
            id: "actions",
            header: "Action",
            cell: (info: { row: { index: any } }) => {
              const rowIndex = info.row.index;
              return (
                <button
                  className="text-xs text-rose-600"
                  onClick={() => removeItem(rowIndex)}
                  disabled={!isEditMode}
                >
                  Remove
                </button>
              );
            },
          },
        ]
      : []),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table className="min-w-full text-sm bg-white rounded mt-3">
      <thead>
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id} className="bg-slate-100">
            {hg.headers.map((h) => (
              <th key={h.id} className="px-3 py-2 text-left border-b">
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="border-b">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-3 py-2">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
        {table.getRowModel().rows.length === 0 && (
          <tr>
            <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
              No items yet — click "Add Item".
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
