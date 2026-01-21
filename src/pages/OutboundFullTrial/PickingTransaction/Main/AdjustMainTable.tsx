import { useEffect, useMemo, useState, useRef } from "react";
import { FaPrint, FaTasks } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../Table/TableComponent";
import { useNavigate, useSearchParams } from "react-router-dom"; // Tambahkan useSearchParams
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_DO } from "../../../../constants/statusMaps";
import { OutboundDo } from "../Helper/doTypes";
import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { mapPickingTransactions } from "../Helper/mappedList";
import { formatDateIndo } from "../../../../helper/FormatDate";

type Props = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  filteredStatus?: any;
};

const AdjustTableTransactionPicking = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
}: Props) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // 🔹 Gunakan URL params

  const { fetchUsingPagination, list, pagination } =
    useStoreOutboundDeliveryOrder();

  // 🔹 Sinkronisasi State dengan URL
  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageIndex = currentPage - 1;
  const [pageSize, setPageSize] = useState(5);

  // 🔹 Ref untuk mencegah reset saat Back navigasi
  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef({
    globalFilter,
    filteredStatus,
  });

  // 🔹 Handler untuk update URL ketika halaman berubah
  const handlePageChange = (newPageIndex: number, newSize: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", (newPageIndex + 1).toString());
    setSearchParams(newParams);

    if (newSize !== pageSize) {
      setPageSize(newSize);
    }
  };

  // 🔹 Reset ke halaman 1 HANYA jika filter diubah manual
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const hasFilterChanged =
      prevFiltersRef.current.globalFilter !== globalFilter ||
      prevFiltersRef.current.filteredStatus !== filteredStatus;

    if (hasFilterChanged) {
      prevFiltersRef.current = {
        globalFilter,
        filteredStatus,
      };

      // Reset ke halaman 1 di URL (trigger fetch baru)
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", "1");
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter, filteredStatus]);

  // 🔹 Fetch data menggunakan nilai dari URL (currentPage)
  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: currentPage,
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
    });
  }, [
    fetchUsingPagination,
    currentPage, // 🔹 Trigger fetch saat URL param 'page' berubah
    pageSize,
    globalFilter,
    filteredStatus,
  ]);

  const mappedList: OutboundDo[] = useMemo(() => {
    return mapPickingTransactions(list || []).map((item, index) => ({
      ...item,
      // Tambahkan nomor urut yang sinkron dengan pagination
      no: pageIndex * pageSize + (index + 1),
    }));
  }, [list, pageIndex, pageSize]);

  const MemoCell = ({ memos }: { memos: any[] }) => {
    const [openMemoId, setOpenMemoId] = useState<string | null>(null);

    if (!memos || memos.length === 0) {
      return (
        <span className="text-slate-400 italic text-xs">
          No memos available
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-2 min-w-[280px]">
        {memos.map((memo) => {
          const isOpen = openMemoId === memo.id;

          const pickings = Array.isArray(memo.transaction_pickings)
            ? memo.transaction_pickings
            : memo.transaction_pickings
            ? [memo.transaction_pickings]
            : [];

          return (
            <div
              key={memo.id}
              className={`group transition-all duration-200 border rounded-lg overflow-hidden ${
                isOpen
                  ? "border-blue-400 shadow-md ring-1 ring-blue-100"
                  : "border-slate-200 hover:border-slate-300 shadow-sm"
              }`}
            >
              <div
                onClick={() => setOpenMemoId(isOpen ? null : memo.id)}
                className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${
                  isOpen ? "bg-blue-50" : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Memo Number
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {memo.outbound_memo_number || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      pickings.length > 0
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {pickings.length} Items
                  </span>

                  <div
                    className={`transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="bg-white border-t border-blue-100 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-100">
                    {pickings.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 italic">
                        No items in this memo
                      </div>
                    ) : (
                      pickings.map((tp: any) => (
                        <div
                          key={tp.id}
                          className="p-2.5 hover:bg-blue-50/30 transition-colors"
                        >
                          <div className="text-xs font-bold text-slate-800 mb-1.5 flex justify-between items-center">
                            <span className="text-blue-600 truncate ml-2">
                              {tp.item?.sku}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            <div className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 flex items-center">
                              <span className="text-[9px] text-slate-500 mr-1 font-medium uppercase">
                                Qty
                              </span>
                              <span className="text-xs font-bold text-slate-700">
                                {tp.quantity}
                              </span>
                            </div>

                            <div className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 flex items-center">
                              <span className="text-[9px] text-slate-500 mr-1 font-medium uppercase">
                                UOM
                              </span>
                              <span className="text-xs font-bold text-slate-700">
                                {tp.uom}
                              </span>
                            </div>

                            <div className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 flex items-center">
                              <span className="text-[9px] text-slate-500 mr-1 font-medium uppercase">
                                Week
                              </span>
                              <span className="text-xs font-bold text-slate-700">
                                {tp.week_number}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const columns: ColumnDef<OutboundDo>[] = useMemo(
    () => [
      { accessorKey: "outbound_do_number", header: "DO Number" },
      {
        accessorKey: "outbound_memos",
        header: "Memo Number",
        cell: ({ row }) => (
          <MemoCell memos={row.original.outbound_memos || []} />
        ),
      },
      { accessorKey: "outbound_type", header: "Type" },
      { accessorKey: "origin", header: "Origin" },
      {
        accessorKey: "delivery_date",
        header: "Delivery Date",
        cell: ({ row }) => formatDateIndo(row.original.delivery_date),
      },
      {
        accessorKey: "status",
        header: "Status DO",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            colorMap={STATUS_MAP_DO}
            variant="solid"
            size="sm"
          />
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-3">
            <FaTasks
              className={`size-5 cursor-pointer text-blue-600 ${
                row.original.status === "PENDING"
                  ? "opacity-20 cursor-not-allowed"
                  : ""
              }`}
              onClick={() =>
                row.original.status !== "PENDING" && handleAdjust(row.original)
              }
              title="Adjust Picking Transaction"
            />

            <FaPrint
              className={`size-5 cursor-pointer text-blue-600 ${
                row.original.status !== "APPROVED_LOAD"
                  ? "opacity-20 cursor-not-allowed"
                  : ""
              }`}
              onClick={() =>
                row.original.status === "APPROVED_LOAD" &&
                handlePrintSJ(row.original)
              }
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPage, pageSize]
  );

  const handleAdjust = (data: OutboundDo) => {
    navigate("/outbound_do/detach_attach", {
      state: {
        params: data,
        mode: "adjust",
        title: "Adjust Picking Transaction",
      },
    });
  };

  const handlePrintSJ = (data: OutboundDo) => {
    navigate("/outbound_do/print_surat_jalan", { state: { params: data.id } });
  };

  return (
    <div className="flex flex-col gap-4">
      <TableComponent
        data={mappedList}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default AdjustTableTransactionPicking;

// import { useEffect, useMemo, useState } from "react";
// import { FaPrint, FaTasks } from "react-icons/fa";
// import { ColumnDef } from "@tanstack/react-table";
// import TableComponent from "../Table/TableComponent";
// import { useNavigate } from "react-router-dom";
// import StatusBadge from "../../../../common/statusBadge";
// import { STATUS_MAP_DO } from "../../../../constants/statusMaps";
// import { OutboundDo } from "../Helper/doTypes";
// import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";
// import { mapPickingTransactions } from "../Helper/mappedList";
// import { formatDateIndo } from "../../../../helper/FormatDate";

// type Props = {
//   globalFilter?: string;
//   setGlobalFilter?: (value: string) => void;
//   filteredStatus?: any;
// };

// const AdjustTableTransactionPicking = ({
//   globalFilter,
//   setGlobalFilter,
//   filteredStatus,
// }: Props) => {
//   const navigate = useNavigate();
//   const { fetchUsingPagination, list, pagination } =
//     useStoreOutboundDeliveryOrder();

//   const [pageIndex, setPageIndex] = useState(0);
//   const [pageSize, setPageSize] = useState(5);

//   useEffect(() => {
//     if (!fetchUsingPagination) return;
//     fetchUsingPagination({
//       page: pageIndex + 1,
//       limit: pageSize,
//       search: globalFilter || "",
//       status: filteredStatus || "",
//     });
//   }, [fetchUsingPagination, pageIndex, pageSize, globalFilter, filteredStatus]);

//   const mappedList: OutboundDo[] = useMemo(() => {
//     return mapPickingTransactions(list || []);
//   }, [list]);

//   const MemoCell = ({ memos }: { memos: any[] }) => {
//     const [openMemoId, setOpenMemoId] = useState<string | null>(null);

//     if (!memos || memos.length === 0) {
//       return (
//         <span className="text-slate-400 italic text-xs">
//           No memos available
//         </span>
//       );
//     }

//     return (
//       <div className="flex flex-col gap-2 min-w-[280px]">
//         {memos.map((memo) => {
//           const isOpen = openMemoId === memo.id;

//           const pickings = Array.isArray(memo.transaction_pickings)
//             ? memo.transaction_pickings
//             : memo.transaction_pickings
//             ? [memo.transaction_pickings]
//             : [];

//           return (
//             <div
//               key={memo.id}
//               className={`group transition-all duration-200 border rounded-lg overflow-hidden ${
//                 isOpen
//                   ? "border-blue-400 shadow-md ring-1 ring-blue-100"
//                   : "border-slate-200 hover:border-slate-300 shadow-sm"
//               }`}
//             >
//               {/* HEADER - Clickable for better UX */}
//               <div
//                 onClick={() => setOpenMemoId(isOpen ? null : memo.id)}
//                 className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${
//                   isOpen ? "bg-blue-50" : "bg-white hover:bg-slate-50"
//                 }`}
//               >
//                 <div className="flex flex-col">
//                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
//                     Memo Number
//                   </span>
//                   <span className="text-xs font-bold text-slate-700">
//                     {memo.outbound_memo_number || "N/A"}
//                   </span>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <span
//                     className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
//                       pickings.length > 0
//                         ? "bg-blue-100 text-blue-700 border-blue-200"
//                         : "bg-slate-100 text-slate-500 border-slate-200"
//                     }`}
//                   >
//                     {pickings.length} Items
//                   </span>

//                   {/* Arrow Icon Indicator */}
//                   <div
//                     className={`transition-transform duration-300 ${
//                       isOpen ? "rotate-180 text-blue-600" : "text-slate-400"
//                     }`}
//                   >
//                     <svg
//                       width="14"
//                       height="14"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="3"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                     >
//                       <path d="m6 9 6 6 6-6" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>

//               {/* EXPANDED CONTENT */}
//               {isOpen && (
//                 <div className="bg-white border-t border-blue-100 animate-in fade-in slide-in-from-top-1 duration-200">
//                   <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-100">
//                     {pickings.length === 0 ? (
//                       <div className="p-4 text-center text-xs text-slate-400 italic">
//                         No items in this memo
//                       </div>
//                     ) : (
//                       pickings.map((tp: any) => (
//                         <div
//                           key={tp.id}
//                           className="p-2.5 hover:bg-blue-50/30 transition-colors"
//                         >
//                           <div className="text-xs font-bold text-slate-800 mb-1.5 flex justify-between items-center">
//                             <span className="text-blue-600 truncate ml-2">
//                               {tp.item?.sku}
//                             </span>
//                           </div>

//                           <div className="flex flex-wrap gap-1.5">
//                             <div className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 flex items-center">
//                               <span className="text-[9px] text-slate-500 mr-1 font-medium uppercase">
//                                 Qty
//                               </span>
//                               <span className="text-xs font-bold text-slate-700">
//                                 {tp.quantity}
//                               </span>
//                             </div>

//                             <div className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 flex items-center">
//                               <span className="text-[9px] text-slate-500 mr-1 font-medium uppercase">
//                                 UOM
//                               </span>
//                               <span className="text-xs font-bold text-slate-700">
//                                 {tp.uom}
//                               </span>
//                             </div>

//                             <div className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 flex items-center">
//                               <span className="text-[9px] text-slate-500 mr-1 font-medium uppercase">
//                                 Week
//                               </span>
//                               <span className="text-xs font-bold text-slate-700">
//                                 {tp.week_number}
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                       ))
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   // const MemoCell = ({ memos }: { memos: any[] }) => {
//   //   const [openMemoId, setOpenMemoId] = useState<string | null>(null);

//   //   return (
//   //     <ul className="space-y-2">
//   //       {memos.map((memo) => {
//   //         const isOpen = openMemoId === memo.id;

//   //         const pickings = Array.isArray(memo.transaction_pickings)
//   //           ? memo.transaction_pickings
//   //           : memo.transaction_pickings
//   //           ? [memo.transaction_pickings]
//   //           : [];

//   //         return (
//   //           <li key={memo.id} className="border border-gray-200 rounded-md p-2">
//   //             {/* HEADER */}
//   //             <div className="flex items-center justify-between">
//   //               <div className="text-xs font-semibold">
//   //                 {memo.outbound_memo_number}
//   //               </div>

//   //               {/* TOGGLE */}
//   //               <button
//   //                 type="button"
//   //                 onClick={() => setOpenMemoId(isOpen ? null : memo.id)}
//   //                 className="text-xs text-blue-600 hover:underline"
//   //               >
//   //                 {isOpen
//   //                   ? "Hide Items"
//   //                   : `Show Items (${memo.transaction_pickings?.length ?? 0})`}
//   //               </button>
//   //             </div>

//   //             {/* EXPANDED CONTENT */}
//   //             {isOpen && (
//   //               <ul className="mt-2 ml-4 list-disc space-y-1 text-xs">
//   //                 {pickings.map((tp: any) => (
//   //                   <li key={tp.id}>
//   //                     <span className="font-medium">{tp.item?.sku}</span>
//   //                     <span className="ml-2 text-xs text-gray-500">
//   //                       | Qty {tp.quantity}
//   //                     </span>
//   //                     <span className="ml-2 text-xs text-gray-500">
//   //                       | UOM {tp.uom}
//   //                     </span>
//   //                     <span className="ml-2 text-xs text-gray-500">
//   //                       | Week {tp.week_number}
//   //                     </span>
//   //                   </li>
//   //                 ))}
//   //               </ul>
//   //             )}
//   //           </li>
//   //         );
//   //       })}
//   //     </ul>
//   //   );
//   // };

//   const columns: ColumnDef<OutboundDo>[] = useMemo(
//     () => [
//       { accessorKey: "outbound_do_number", header: "DO Number" },
//       {
//         accessorKey: "outbound_memos",
//         header: "Memo Number",
//         cell: ({ row }) => (
//           <MemoCell memos={row.original.outbound_memos || []} />
//         ),
//       },

//       { accessorKey: "outbound_type", header: "Type" },
//       { accessorKey: "origin", header: "Origin" },
//       {
//         accessorKey: "delivery_date",
//         header: "Delivery Date",
//         cell: ({ row }) => formatDateIndo(row.original.delivery_date),
//       },
//       {
//         accessorKey: "status",
//         header: "Status DO",
//         cell: ({ row }) => (
//           <StatusBadge
//             status={row.original.status}
//             colorMap={STATUS_MAP_DO}
//             variant="solid"
//             size="sm"
//           />
//         ),
//       },
//       {
//         id: "actions",
//         header: "Action",
//         cell: ({ row }) => (
//           <div className="flex gap-3">
//             <FaTasks
//               className={`size-5 cursor-pointer text-blue-600 ${
//                 row.original.status === "PENDING"
//                   ? "opacity-20 cursor-not-allowed"
//                   : ""
//               }`}
//               onClick={() =>
//                 row.original.status !== "PENDING" && handleAdjust(row.original)
//               }
//               title="Adjust Picking Transaction"
//             />

//             <FaPrint
//               className={`size-5 cursor-pointer text-blue-600 ${
//                 row.original.status != "APPROVED_LOAD"
//                   ? "opacity-20 cursor-not-allowed"
//                   : ""
//               }`}
//               onClick={() =>
//                 row.original.status == "APPROVED_LOAD" &&
//                 handlePrintSJ(row.original)
//               }
//             />
//           </div>
//         ),
//       },
//     ],
//     []
//   );

//   const handleAdjust = (data: OutboundDo) => {
//     navigate("/outbound_do/detach_attach", {
//       state: {
//         params: data,
//         mode: "adjust",
//         title: "Adjust Picking Transaction",
//       },
//     });
//   };

//   // paste di file tempat handlePrintSJ dideklarasikan
//   const handlePrintSJ = (data: OutboundDo) => {
//     console.log("Navigating to Print Surat Jalan with data:", data);
//     // gunakan leading slash supaya navigasi absolute ke route yg diharapkan
//     navigate("/outbound_do/print_surat_jalan", { state: { params: data.id } });
//   };

//   return (
//     <div className="flex flex-col gap-4">
//       <TableComponent
//         data={mappedList}
//         columns={columns}
//         globalFilter={globalFilter}
//         setGlobalFilter={setGlobalFilter}
//         pageSize={pageSize}
//         pageIndex={pageIndex}
//         totalPages={pagination.totalPages}
//         onPageChange={(page, size) => {
//           setPageIndex(page);
//           setPageSize(size);
//         }}
//       />
//     </div>
//   );
// };

// export default AdjustTableTransactionPicking;
