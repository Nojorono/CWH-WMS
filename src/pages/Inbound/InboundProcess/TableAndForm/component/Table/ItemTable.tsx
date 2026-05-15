import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  CellContext,
} from "@tanstack/react-table";
import { useFormContext } from "react-hook-form";
import { FormValues, ItemForm } from "../formTypes";
import { useMemo } from "react";

interface UomOption {
  id: any;
  code: string;
  name: string;
}

interface ItemTableProps {
  items: ItemForm[];
  itemsPath: string;
  doIndex: number;
  posIndex: number;
  removeItem: (rowIndex: number) => void;
  isEditMode?: boolean;
  uomList: UomOption[];
  inbType?: string;
}

export default function ItemTable({
  items,
  doIndex,
  posIndex,
  removeItem,
  isEditMode,
  uomList,
  inbType,
}: ItemTableProps) {
  const { register } = useFormContext<FormValues>();

  // Logic: Cek apakah kolom Qty Inspection perlu muncul (biasanya untuk mode Edit/Detail tertentu)
  const showQtyInspection = useMemo(
    () =>
      items.some(
        (item) =>
          item.quantity_inspection !== undefined &&
          item.quantity_inspection !== "" &&
          item.quantity_inspection !== 0,
      ),
    [items],
  );

  const columns = useMemo<ColumnDef<ItemForm>[]>(
    () => [
      {
        accessorKey: "sku",
        header: "Product Details",
        cell: ({ row }: CellContext<ItemForm, unknown>) => {
          const rowIndex = row.index;
          const basePath =
            `deliveryOrders.${doIndex}.pos.${posIndex}.items.${rowIndex}` as const;

          return (
            <div className="flex flex-col gap-0.5 py-1">
              <span className="font-semibold text-slate-900 leading-tight">
                {row.original.sku}
              </span>
              <span className="text-[11px] font-medium text-slate-500 tracking-wide uppercase">
                #{row.original.item_number}
              </span>

              {/* Hidden Fields remains for logic */}
              <input type="hidden" {...register(`${basePath}.item_id`)} />
              <input
                type="hidden"
                {...register(`${basePath}.line_number` as any)}
              />
              <input
                type="hidden"
                {...register(`${basePath}.classification_id` as any)}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="max-w-[220px] text-sm text-slate-600 leading-relaxed">
            {row.original.description || row.original.item_name || (
              <span className="italic text-slate-400">No description</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "qty_plan",
        header: () => <div className="text-right pr-2">Qty Plan</div>,
        cell: ({ row }: CellContext<ItemForm, unknown>) => {
          const rowIndex = row.index;
          return isEditMode ? (
            <div className="flex justify-end">
              <input
                type="number"
                className="h-9 w-24 rounded-md border border-slate-200 bg-white px-3 py-1 text-right text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none hover:border-slate-300"
                {...register(
                  `deliveryOrders.${doIndex}.pos.${posIndex}.items.${rowIndex}.qty`,
                  { valueAsNumber: true },
                )}
              />
            </div>
          ) : (
            <div className="text-right pr-2 font-bold text-slate-800">
              {row.original.qty?.toLocaleString() || 0}
            </div>
          );
        },
      },
      ...(showQtyInspection
        ? [
            {
              accessorKey: "quantity_inspection",
              header: () => (
                <div className="text-right pr-2 text-amber-700">
                  Qty Inspect
                </div>
              ),
              cell: ({ row }: CellContext<ItemForm, unknown>) => {
                const val = row.original.quantity_inspection;
                return (
                  <div className="flex justify-end pr-2 font-semibold text-amber-600">
                    {val ?? "-"}
                  </div>
                );
              },
            },
            {
              accessorKey: "quantity_difference",
              header: () => (
                <div className="text-right pr-2 text-rose-700">Difference</div>
              ),
              cell: ({ row }: CellContext<ItemForm, unknown>) => {
                const val = row.original.quantity_difference;
                const isDiff = Number(val) !== 0;
                return (
                  <div
                    className={`flex justify-end pr-2 font-bold ${isDiff ? "text-rose-500" : "text-slate-400"}`}
                  >
                    {val ?? "-"}
                  </div>
                );
              },
            },
          ]
        : []),
      {
        accessorKey: "uom",
        header: () => <div className="text-center">UOM</div>,
        cell: ({ row }: CellContext<ItemForm, unknown>) => {
          const rowIndex = row.index;
          const rawUom = row.original.uom ?? "";
          const matchedUom = uomList.find(
            (u) => u.code.toUpperCase() === rawUom.toUpperCase(),
          );
          const normalizedUomCode = matchedUom?.code ?? rawUom.toUpperCase();

          return (
            <div className="flex justify-center">
              {isEditMode ? (
                <select
                  className="h-9 w-full min-w-[100px] rounded-md border border-slate-200 bg-white px-2 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
                  defaultValue={normalizedUomCode}
                  {...register(
                    `deliveryOrders.${doIndex}.pos.${posIndex}.items.${rowIndex}.uom` as const,
                    { required: "UoM wajib" },
                  )}
                >
                  <option value="">-- UoM --</option>
                  {uomList.map((u) => (
                    <option key={u.id} value={u.code}>
                      {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                  {matchedUom?.name || rawUom}
                </span>
              )}
            </div>
          );
        },
      },
      ...(isEditMode
        ? [
            {
              id: "actions",
              header: () => <div className="text-center">Action</div>,
              cell: ({ row }: CellContext<ItemForm, unknown>) => (
                <div className="flex justify-center">
                  <button
                    type="button"
                    className="group flex items-center justify-center rounded-md p-2 text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => removeItem(row.index)}
                    title="Remove Item"
                  >
                    <span className="text-xs font-bold uppercase tracking-tighter">
                      Remove
                    </span>
                  </button>
                </div>
              ),
            },
          ]
        : []),
    ],
    [
      doIndex,
      posIndex,
      isEditMode,
      register,
      removeItem,
      uomList,
      showQtyInspection,
    ],
  );

  const table = useReactTable({
    data: items,
    columns,
    getRowId: (row, index) => `${doIndex}-${posIndex}-${row.item_id || index}`,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      <table className="min-w-full text-sm bg-white">
        <thead className="bg-slate-200 border-b border-slate-300">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody className="divide-y divide-slate-200">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 text-slate-600">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-slate-400 italic"
              >
                No items added yet. Please search by{" "}
                {inbType === "PO"
                  ? "PO"
                  : inbType === "SO_INTERNAL"
                    ? "SO Internal"
                    : "SO SubDist"}{" "}
                or add items manually.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
