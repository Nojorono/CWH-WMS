// "use client";

// import React, {
//   useEffect,
//   useMemo,
//   useState,
//   useCallback,
//   useRef,
// } from "react";
// import Button from "../../../../components/ui/button/Button";
// import {
//   useStorePickingTransactionList,
//   useStoreOutboundMemo,
// } from "../../../../DynamicAPI/stores/Store/MasterStore";
// // import TableComponent from "../../../../components/tables/";
// import { FaParachuteBox, FaPlus } from "react-icons/fa";
// import ModalSelectMemo from "../Modal/ModalSelectMemo";
// import Select from "../../../../components/form/Select";
// import DetailMemoModal from "../Modal/DetailMemoModal";
// import TableComponent from "../../../../components/tables/ActionTable/TableComponent";

// type AttachTransactionTableProps = {
//   onAttachSuccess?: (attachedIds: string[]) => void;
// };

// const AttachTransactionTable: React.FC<AttachTransactionTableProps> = ({
//   onAttachSuccess,
// }) => {
//   const { fetchUsingParam: fetchTransacList, list } =
//     useStorePickingTransactionList();

//   const { fetchUsingParam: fetchOutboundMemos, list: availableMemos } =
//     useStoreOutboundMemo();

//   // Table state
//   const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
//     []
//   );
//   const [pageIndex, setPageIndex] = useState(0);
//   const [pageSize, setPageSize] = useState(5);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedItemId, setSelectedItemId] = useState<string>("all");

//   // NEW: Modal Detail State
//   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
//   const [selectedDetail, setSelectedDetail] = useState<any>(null);

//   // Initial Fetch
//   const didFetchRef = useRef(false);
//   useEffect(() => {
//     if (!didFetchRef.current) {
//       didFetchRef.current = true;
//       fetchTransacList({ has_memo_id: false });
//     }
//   }, [fetchTransacList]);

//   // Ambil daftar item unik dari data
//   const itemOptions = useMemo(() => {
//     if (!list) return [];
//     const unique: { id: string; description: string }[] = [];
//     const seen = new Set();
//     list.forEach((trx) => {
//       const id = trx.item?.id;
//       if (id && !seen.has(id)) {
//         seen.add(id);
//         unique.push({ id, description: trx.item?.description ?? id });
//       }
//     });
//     return unique;
//   }, [list]);

//   // Filter data sesuai item yang dipilih
//   const tableData = useMemo(() => {
//     if (selectedItemId === "all") return list || [];
//     return (list || []).filter((trx) => trx.item?.id === selectedItemId);
//   }, [list, selectedItemId]);

//   // DEFINISI KOLOM
//   const columns = useMemo(
//     () => [
//       {
//         accessorKey: "id",
//         header: "Select",
//         selectedRow: true,
//       },
//       {
//         accessorKey: "item.description",
//         header: "Item",
//         cell: ({ row }: any) => row.original.item?.description ?? "-",
//       },
//       {
//         accessorKey: "quantity",
//         header: "Qty",
//       },
//       {
//         accessorKey: "uom",
//         header: "UOM",
//       },
//       {
//         accessorKey: "has_memo_id",
//         header: "Has Memo",
//         cell: ({ row }: any) => (row.original.has_memo_id ? "Yes" : "No"),
//       },
//       {
//         id: "scanFlag",
//         header: "Scan Status",
//         cell: ({ row }: any) => {
//           const hasScans = row.original.transactionScanPicking?.length > 0;
//           return hasScans ? "Scanned" : "Not Scanned";
//         },
//       },
//       {
//         accessorKey: "status",
//         header: "Status",
//       },
//       {
//         id: "detail",
//         header: "Detail",
//         cell: ({ row }: any) => {
//           const trx = row.original;
//           return (
//             <Button
//               size="xsm"
//               type="button"
//               variant="secondary"
//               onClick={() => {
//                 setSelectedDetail(trx);
//                 setIsDetailModalOpen(true);
//               }}
//             >
//               Detail
//             </Button>
//           );
//         },
//       },
//     ],
//     []
//   );

//   // Pagination Handler
//   const handlePageChange = useCallback((page: number, size: number) => {
//     setPageIndex(page);
//     setPageSize(size);
//   }, []);

//   // Selection Handler
//   const handleSelectionChange = useCallback(
//     (ids: string[] | number[]) => {
//       const next = (ids as string[]) ?? [];
//       const same =
//         next.length === selectedTransactions.length &&
//         next.every((id, i) => id === selectedTransactions[i]);
//       if (!same) {
//         setSelectedTransactions(next);
//       }
//     },
//     [selectedTransactions]
//   );

//   // Item Filter
//   const itemSelectOptions = [
//     { value: "all", label: "All Items" },
//     ...itemOptions.map((i) => ({ value: i.id, label: i.description })),
//   ];

//   const handleItemSelectChange = (value: string) => {
//     if (!value || value === "all") {
//       setSelectedItemId("all");
//       fetchOutboundMemos({});
//       return;
//     }
//     fetchOutboundMemos({ item_id: value });
//     setSelectedItemId(value);
//   };

//   return (
//     <div className="w-full">
//       <div className="flex justify-between items-center mb-3">
//         <div>
//           <Select
//             options={itemSelectOptions}
//             value={selectedItemId}
//             onChange={handleItemSelectChange}
//             placeholder="Select Item for Attach"
//             width={220}
//           />
//         </div>

//         <div className="flex justify-between space-x-2">
//           <Button
//             type="button"
//             variant="primary"
//             startIcon={<FaParachuteBox />}
//             onClick={() => {}}
//             disabled={true}
//           >
//             Move Location
//           </Button>

//           <Button
//             type="button"
//             variant="action"
//             onClick={() => setIsModalOpen(true)}
//             disabled={
//               selectedTransactions.length === 0 || selectedItemId === "all"
//             }
//             startIcon={<FaPlus />}
//           >
//             Attach to Memo
//           </Button>
//         </div>
//       </div>

      <TableComponent
        data={tableData}
        columns={columns as any}
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalPages={Math.max(1, Math.ceil(tableData.length / pageSize))}
        onPageChange={handlePageChange}
        onSelectionChange={handleSelectionChange}
        selectColumn={false}
      />

//       {/* Modal Select Memo */}
//       <ModalSelectMemo
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         memos={availableMemos}
//         selectedTransactions={selectedTransactions}
//       />

//       {/* ⭐ NEW MODAL DETAIL */}
//       <DetailMemoModal
//         isOpen={isDetailModalOpen}
//         onRequestClose={() => setIsDetailModalOpen(false)}
//         items={selectedDetail}
//       />
//     </div>
//   );
// };

// export default AttachTransactionTable;
