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
}

export default function ItemTable({
  items,
  doIndex,
  posIndex,
  removeItem,
  isEditMode,
  uomList,
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
        accessorKey: "line_number",
        header: "Line Number",
        cell: ({ row }) => {
          // Kita cek apakah line_number memang ada nilainya (dari API)
          const hasLineNumber =
            row.original.line_number !== undefined &&
            row.original.line_number !== null &&
            row.original.line_number !== 0;

          return (
            <div className="text-slate-500 font-mono text-xs text-center">
              {hasLineNumber ? row.original.line_number : ""}
            </div>
          );
        },
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }: CellContext<ItemForm, unknown>) => {
          const rowIndex = row.index;
          const basePath =
            `deliveryOrders.${doIndex}.pos.${posIndex}.items.${rowIndex}` as const;

          return (
            <div className="flex flex-col">
              <span className="font-medium text-slate-700">
                {row.original.sku}
              </span>
              <span className="text-[10px] text-slate-400">
                {row.original.item_number}
              </span>

              {/* HIDDEN FIELDS: Tetap ada agar payload BE lengkap */}
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
          <div className="max-w-[200px] truncate md:whitespace-normal">
            {row.original.description || row.original.item_name || "-"}
          </div>
        ),
      },
      {
        accessorKey: "qty",
        header: () => <div className="text-right">Qty Plan</div>,
        cell: ({ row }: CellContext<ItemForm, unknown>) => {
          const rowIndex = row.index;
          return isEditMode ? (
            <div className="flex justify-end">
              <input
                type="number"
                className="border border-slate-300 px-2 py-1 w-24 text-right rounded focus:ring-1 focus:ring-blue-500 outline-none"
                {...register(
                  `deliveryOrders.${doIndex}.pos.${posIndex}.items.${rowIndex}.qty`,
                  { valueAsNumber: true },
                )}
              />
            </div>
          ) : (
            <div className="text-right font-semibold">{row.original.qty}</div>
          );
        },
      },
      ...(showQtyInspection
        ? [
            {
              accessorKey: "quantity_inspection",
              header: "Qty Inspect",
              cell: ({ row }: CellContext<ItemForm, unknown>) => {
                const val = row.original.quantity_inspection;
                return (
                  <div className="text-center font-medium text-amber-600">
                    {val !== undefined && val !== null && val !== ""
                      ? val
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
        cell: ({ row }: CellContext<ItemForm, unknown>) => {
          const rowIndex = row.index;
          const rawUom = row.original.uom ?? "";

          const matchedUom = uomList.find(
            (u) => u.code.toUpperCase() === rawUom.toUpperCase(),
          );
          const normalizedUomCode = matchedUom?.code ?? rawUom.toUpperCase();

          return isEditMode ? (
            <select
              className="border border-slate-300 px-2 py-1 rounded w-full bg-white focus:ring-1 focus:ring-blue-500 outline-none"
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
            <div className="bg-slate-100 px-2 py-0.5 rounded text-xs inline-block">
              {matchedUom?.name || rawUom}
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
                <div className="text-center">
                  <button
                    type="button"
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors"
                    onClick={() => removeItem(row.index)}
                  >
                    Remove
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
                No items added yet. Search PO to pull items.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// import {
//   useReactTable,
//   getCoreRowModel,
//   getPaginationRowModel,
//   flexRender,
//   ColumnDef,
//   CellContext,
// } from "@tanstack/react-table";
// import { useFormContext, useWatch, Path } from "react-hook-form";
// import { useFieldArray } from "react-hook-form";
// import { FormValues, ItemForm } from "../formTypes";
// import { useMemo } from "react";

// export default function ItemTable({
//   items,
//   itemsPath,
//   doIndex,
//   posIndex,
//   removeItem,
//   isEditMode,
//   uomList,
// }: {
//   items: ItemForm[];
//   itemsPath: string;
//   doIndex: number;
//   posIndex: number;
//   removeItem: (rowIndex: number) => void;
//   isEditMode?: boolean;
//   uomList: { id: any; code: string; name: string }[];
// }) {
//   const { register } = useFormContext<FormValues>();

//   // Cek apakah ada minimal satu quantity_inspection yang terisi
//   const showQtyInspection = useMemo(
//     () =>
//       items.some(
//         (item) =>
//           item.quantity_inspection !== undefined &&
//           item.quantity_inspection !== "" &&
//           item.quantity_inspection !== 0,
//       ),
//     [items],
//   );

//   const columns = useMemo<ColumnDef<ItemForm>[]>(
//     () => [
//       {
//         accessorKey: "sku",
//         header: "SKU",
//       },
//       {
//         accessorKey: "description",
//         header: "Description",
//       },
//       {
//         accessorKey: "qty",
//         header: "Qty Plan",
//         cell: ({ row }: CellContext<ItemForm, unknown>) => {
//           const rowIndex = row.index;
//           return isEditMode ? (
//             <input
//               type="number"
//               className="border px-2 py-1 w-20 text-right rounded"
//               {...register(
//                 `deliveryOrders.${doIndex}.pos.${posIndex}.items.${rowIndex}.qty`,
//                 { valueAsNumber: true },
//               )}
//             />
//           ) : (
//             <div>{row.original.qty}</div>
//           );
//         },
//       },
//       ...(showQtyInspection
//         ? [
//             {
//               accessorKey: "quantity_inspection",
//               header: "Qty Inspection",
//               cell: ({ row }: CellContext<ItemForm, unknown>) => {
//                 const value = row.original.quantity_inspection;
//                 return (
//                   <div>
//                     {value !== undefined && value !== null && value !== ""
//                       ? value
//                       : "-"}
//                   </div>
//                 );
//               },
//             },
//           ]
//         : []),
//       {
//         accessorKey: "uom",
//         header: "UOM",
//         cell: ({ row, getValue }: CellContext<ItemForm, unknown>) => {
//           const rowIndex = row.index;
//           const rawUom = row.original.uom ?? "";

//           // Normalize: cari code di uomList yang cocok secara case-insensitive
//           const matchedUom = uomList.find(
//             (u) => u.code.toUpperCase() === rawUom.toUpperCase(),
//           );
//           const normalizedUomCode = matchedUom?.code ?? rawUom.toUpperCase();

//           return isEditMode ? (
//             <select
//               className="border px-2 py-1 rounded w-full"
//               defaultValue={normalizedUomCode} // ← pakai matched code
//               {...register(
//                 `deliveryOrders.${doIndex}.pos.${posIndex}.items.${rowIndex}.uom` as const,
//                 { required: "UoM wajib dipilih" },
//               )}
//             >
//               <option value="">-- Select UoM --</option>
//               {uomList.map((u) => (
//                 <option key={u.id} value={u.code}>
//                   {u.name}
//                 </option>
//               ))}
//             </select>
//           ) : (
//             // Di view mode, tampilkan nama UOM yang matched, fallback ke raw value
//             <div>{matchedUom?.name ?? rawUom}</div>
//           );
//         },
//       },

//       ...(isEditMode
//         ? [
//             {
//               id: "actions",
//               header: "Action",
//               cell: ({ row }: CellContext<ItemForm, unknown>) => (
//                 <button
//                   type="button"
//                   className="text-xs text-rose-600"
//                   onClick={() => removeItem(row.index)}
//                 >
//                   Remove
//                 </button>
//               ),
//             },
//           ]
//         : []),
//     ],
//     [doIndex, posIndex, isEditMode, register, removeItem],
//   );

//   const table = useReactTable({
//     data: items,
//     columns,
//     getRowId: (_row, index) => `${doIndex}-${posIndex}-${items[index]?.id}`, // 🔥 STABIL
//     getCoreRowModel: getCoreRowModel(),
//   });

//   return (
//     <table className="min-w-full text-sm bg-white border rounded">
//       <thead className="bg-slate-100">
//         {table.getHeaderGroups().map((hg) => (
//           <tr key={hg.id}>
//             {hg.headers.map((h) => (
//               <th key={h.id} className="px-3 py-2 text-left">
//                 {flexRender(h.column.columnDef.header, h.getContext())}
//               </th>
//             ))}
//           </tr>
//         ))}
//       </thead>

//       <tbody>
//         {table.getRowModel().rows.map((row) => (
//           <tr key={row.id}>
//             {row.getVisibleCells().map((cell) => (
//               <td key={cell.id} className="px-3 py-2">
//                 {flexRender(cell.column.columnDef.cell, cell.getContext())}
//               </td>
//             ))}
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }
