import React, { useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FaArrowRight } from "react-icons/fa";
import Button from "../../../../components/ui/button/Button";
import { GroupedSPBData } from "../MainTable";
import { DOSuggestionDetail } from "../../../../API/types/draftDOsuggestion";
import { FaPrint } from "react-icons/fa6";
import { formatDateTimeIndo } from "../../../../helper/FormatDateTime";
import { BaseTable } from "../component/BaseTable";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { getServerDayjs } from "../../Suggestion/global/allowedDate";
import dayjs from "dayjs";

interface SPBSubmittedPageProps {
  data: GroupedSPBData[];
  onProceed: () => void;
  onGoToPreparation: () => void;
}

// 1. KOMPONEN SUB-TABLE (Versi Scrollable - Tanpa Pagination)
// const StandardSubTable = ({
//   details,
// }: {
//   details: DOSuggestionDetail[];
//   status?: string;
// }) => {
//   const { fetchAll, list: itemList } = useStoreItem();

//   // Fetch master items saat komponen dimuat
//   useEffect(() => {
//     fetchAll();
//   }, []); // Anda bisa menambahkan dependency yang sesuai jika perlu

//   // Menggabungkan data details dengan master item untuk mendapatkan nama produk
//   const processedData = useMemo(() => {
//     const mappedData = details.map((item: any) => {
//       const matchedItem = itemList?.find(
//         (master: any) => master.sku === item.item_code,
//       );
//       const itemName = matchedItem ? matchedItem.description : item.item_code;

//       return { ...item, itemName };
//     });

//     return mappedData.sort((a, b) => {
//       return a.itemName.localeCompare(b.itemName);
//     });
//   }, [details, itemList]);

//   // Handle Empty State
//   if (!details?.length) {
//     return (
//       <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-sm italic mx-4 my-2">
//         Data product details kosong.
//       </div>
//     );
//   }

//   return (
//     // Wrapper luar menggunakan background sedikit gelap untuk membedakan dari baris utama
//     <div className="p-3 bg-slate-50/80 border-t border-slate-100 shadow-inner">
//       {/* Header Panel */}
//       <div className="flex justify-between items-center mb-3 px-1">
//         <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
//           Product Details
//           <span className="bg-blue-100 border border-blue-200 text-blue-700 py-0.5 px-2 rounded-full text-[10px] font-bold">
//             {processedData.length} Items
//           </span>
//         </h4>
//       </div>

//       {/* Scrollable Container untuk banyak item */}
//       {/* max-h-[300px] akan memunculkan scroll jika item terlalu banyak */}
//       <div className="max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
//         {/* Grid System: 1 kolom di mobile, 2 di tablet, 3-4 kolom di layar lebar */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pb-1">
//           {processedData.map((item, idx) => (
//             // Mini Card Item
//             <div
//               key={idx}
//               className="group flex flex-col p-2.5 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-default relative overflow-hidden"
//             >
//               {/* Highlight bar saat di-hover */}
//               <div className="absolute top-0 right-0 w-1 h-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />

//               {/* Bagian Kiri: Nomor & Nama SKU */}
//               <div className="flex items-start gap-2.5 mb-2 overflow-hidden">
//                 {/* Badge Nomor */}
//                 <span className="flex-shrink-0 flex items-center justify-center min-w-[24px] h-6 rounded-md bg-slate-50 border border-slate-100 text-slate-400 text-[10px] font-bold group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
//                   {idx + 1}
//                 </span>

//                 {/* Teks Nama Item & SKU */}
//                 <div className="flex flex-col w-full overflow-hidden">
//                   <span
//                     className="text-xs font-bold text-slate-800 truncate"
//                     title={item.itemName}
//                   >
//                     {item.itemName}
//                   </span>
//                   <span className="text-[10px] font-mono text-slate-400 mt-0.5">
//                     {item.item_code}
//                   </span>
//                 </div>
//               </div>

//               {/* Bagian Bawah: Qty Submitted */}
//               <div className="flex flex-col items-end pt-2 border-t border-slate-100 mt-auto">
//                 <span className="text-[9px] uppercase tracking-wide text-slate-400 font-medium mb-0.5">
//                   Locked Qty
//                 </span>
//                 <span className="text-xl font-bold text-blue-600">
//                   {item.item_qty_submitted}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

const StandardSubTable = ({
  details,
}: {
  details: DOSuggestionDetail[];
  status?: string;
}) => {
  const { fetchAll, list: itemList } = useStoreItem();

  useEffect(() => {
    fetchAll();
  }, []);

  const processedData = useMemo(() => {
    const mappedData = details.map((item: any) => {
      const matchedItem = itemList?.find(
        (master: any) => master.sku === item.item_code,
      );
      const itemName = matchedItem ? matchedItem.description : item.item_code;
      return { ...item, itemName };
    });

    return mappedData.sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [details, itemList]);

  if (!details?.length) {
    return (
      <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs italic mx-4 my-2">
        Data product details kosong.
      </div>
    );
  }

  return (
    <div className="p-3 bg-white border-t border-slate-100">
      {/* Header Panel */}
      <div className="flex justify-between items-center mb-2 px-1">
        <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-2">
          Product Details
          <span className="bg-blue-50 text-blue-600 py-0.5 px-2 rounded text-[10px] font-bold border border-blue-100">
            {processedData.length} Items
          </span>
        </h4>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden border border-slate-200 rounded-lg">
        <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold uppercase text-slate-500 text-xs w-12">
                  No
                </th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500 text-xs">
                  Item Name
                </th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500 text-xs">
                  SKU
                </th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500 text-xs text-right">
                  Qty
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedData.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {item.itemName}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {item.item_code}
                  </td>
                  <td className="px-4 py-3 font-bold text-blue-600 text-right">
                    {item.item_qty_submitted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 2. MAIN PAGE COMPONENT
export const SPBSubmittedPage = ({
  data,
  onProceed,
  onGoToPreparation,
}: SPBSubmittedPageProps) => {
  const [globalFilter, setGlobalFilter] = React.useState("");

  const allSalesmen = useMemo(() => {
    return data.flatMap((spvGroup) =>
      spvGroup.salesmenDO.map((salesman) => ({
        ...salesman,
        sales_spv_name: spvGroup.sales_spv_name,
        sales_spv_nik: spvGroup.sales_spv_nik,
      })),
    );
  }, [data]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: "callplan_number", header: "Callplan Number" },
      { accessorKey: "sales_nik", header: "NIK Sales" },
      { accessorKey: "sales_name", header: "Nama Sales" },
      { accessorKey: "sales_spv_name", header: "Nama SPV" },
      { accessorKey: "sales_spv_nik", header: "NIK SPV" },
      {
        id: "total_sku",
        header: "Total SKU",
        cell: ({ row }) => row.original.details?.length || 0,
      },
      {
        accessorKey: "callplan_date_start",
        header: "Start Date",
        cell: (info) => info.getValue<string>(),
      },
      {
        accessorKey: "callplan_date_end",
        header: "End Date",
        cell: (info) => info.getValue<string>(),
      },
      { accessorKey: "status", header: "status" },
    ],
    [],
  );

  const status = allSalesmen[0]?.status;
  // const now = dayjs("2026-07-03 09:00:00");
  const now = getServerDayjs();
  const hour = now.hour();

  // SUBMITTED : hanya 09:00 - 09:59
  const canCalculate = status === "SUBMITTED" && hour === 9;

  // FINAL : 09:00 - 08:59 (selalu selain jam 09-10 untuk calculate)
  const canPrint = status === "FINAL" && (hour >= 9 || hour < 9);

  const footerButton = useMemo(() => {
    const isPrint = status === "FINAL";

    return {
      label: isPrint ? "Proceed to Printing" : "Proceed to Calculation",
      icon: isPrint ? <FaPrint /> : <FaArrowRight />,
      action: isPrint ? onGoToPreparation : onProceed,
      className: isPrint
        ? "bg-emerald-600 hover:bg-emerald-700"
        : "bg-blue-600 hover:bg-blue-700",

      disabled: isPrint ? !canPrint : !canCalculate,
      tooltip: isPrint
        ? "Printing is available from 09:00 AM until 08:59 AM the next day."
        : "Calculation is only available from 09:00 AM to 10:00 AM.",
    };
  }, [status, canCalculate, canPrint, onProceed, onGoToPreparation]);

  return (
    <BaseTable
      data={allSalesmen}
      columns={columns}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      isExpandable={true}
      renderSubComponent={(row) => (
        <StandardSubTable details={row.details} status={row.status} />
      )}
      footerAction={
        <div title={footerButton.disabled ? footerButton.tooltip : ""}>
          <Button
            onClick={footerButton.action}
            disabled={footerButton.disabled}
            variant="primary"
            className={footerButton.className}
            endIcon={footerButton.icon}
          >
            {footerButton.label}
          </Button>
        </div>
      }
    />
  );
};
