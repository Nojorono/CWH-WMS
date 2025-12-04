// import React from "react";
// import Button from "../../../../components/ui/button/Button";

// interface TransactionPickingsModalProps {
//   isOpen: boolean;
//   onRequestClose: () => void;
//   items: any[];
// }

// const TransactionPickingsModal: React.FC<TransactionPickingsModalProps> = ({
//   isOpen,
//   onRequestClose,
//   items,
// }) => {
//   console.log("Transaction Items:", items);

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
//       <div className="bg-white w-[95vw] max-w-[950px] rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[85vh]">
//         <h2 className="text-xl font-bold text-gray-800 mb-4">
//           Transaction Picking Details
//         </h2>

//         {items.length === 0 ? (
//           <p className="text-gray-500 text-sm">
//             No transaction items available
//           </p>
//         ) : (
//           <div className="space-y-5">
//             {items.map((trx: any) => (
//               <div
//                 key={trx.id}
//                 className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm"
//               >
//                 {/* ITEM HEADER */}
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <p className="text-sm text-gray-500">Item</p>
//                     <p className="font-semibold text-gray-800">
//                       {trx.item?.description} ({trx.item?.sku})
//                     </p>
//                     <p className="text-xs text-gray-600">
//                       Item Number: {trx.item?.item_number}
//                     </p>
//                   </div>
//                   <span
//                     className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                       trx.status === "PENDING"
//                         ? "bg-yellow-100 text-yellow-700"
//                         : "bg-blue-100 text-blue-700"
//                     }`}
//                   >
//                     {trx.status}
//                   </span>
//                 </div>

//                 {/* GRID INFO */}
//                 <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
//                   <div>
//                     <strong>Quantity:</strong> {trx.quantity} {trx.uom}
//                   </div>

//                   <div>
//                     <strong>Week Number:</strong> {trx.week_number}
//                   </div>

//                   <div>
//                     <strong>Source Warehouse Sub:</strong>{" "}
//                     {trx.sourceWarehouseSub?.name}
//                   </div>

//                   <div>
//                     <strong>Source Bin:</strong> {trx.sourceBin?.name}
//                   </div>

//                   <div>
//                     <strong>Destination Warehouse Sub:</strong>{" "}
//                     {trx.destinationWarehouseSub?.name}
//                   </div>

//                   <div>
//                     <strong>Destination Bin:</strong> {trx.destinationBin?.name}
//                   </div>
//                 </div>

//                 {/* LINE BREAK */}
//                 <hr className="my-4" />

//                 {/* SCAN TRANSACTION */}
//                 <div>
//                   <p className="font-semibold text-gray-700 mb-2">
//                     Transaction Scan Picking:
//                   </p>

//                   {trx.transactionScanPicking.length === 0 ? (
//                     <p className="text-red-500 text-sm">
//                       Belum ada data scan picking
//                     </p>
//                   ) : (
//                     <div className="space-y-3">
//                       {trx.transactionScanPicking.map((scan: any) => (
//                         <div
//                           key={scan.id}
//                           className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
//                         >
//                           <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
//                             <div>
//                               <strong>Pallet Source:</strong>{" "}
//                               {scan.palletSource?.pallet_code}
//                             </div>

//                             <div>
//                               <strong>Pallet Use:</strong>{" "}
//                               {scan.palletUse?.pallet_code}
//                             </div>

//                             <div>
//                               <strong>Qty Picked:</strong>{" "}
//                               {scan.quantity_picked}
//                             </div>

//                             <div>
//                               <strong>UOM:</strong> {scan.uom}
//                             </div>

//                             <div>
//                               <strong>User:</strong> {scan.user_name}
//                             </div>

//                             <div>
//                               <strong>Inspection By:</strong>{" "}
//                               {scan.inspection_by}
//                             </div>

//                             <div>
//                               <strong>Status:</strong>{" "}
//                               <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
//                                 {scan.status}
//                               </span>
//                             </div>

//                             <div>
//                               <strong>Week:</strong> {scan.week_number}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         <div className="p-4 text-right rounded-b-2xl sticky bottom-0">
//           <Button onClick={onRequestClose} variant="danger">
//             Close
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TransactionPickingsModal;



import React from "react";
import Button from "../../../../components/ui/button/Button";

interface TransactionPickingsModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  items: any[] | any; // bisa single object atau array
}

const TransactionPickingsModal: React.FC<TransactionPickingsModalProps> = ({
  isOpen,
  onRequestClose,
  items,
}) => {
  if (!isOpen) return null;

  // --- NORMALISASI DATA (SELALU JADI ARRAY) ---
  const normalizedItems = Array.isArray(items)
    ? items
    : items
    ? [items]
    : [];

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-white w-[95vw] max-w-[950px] rounded-2xl shadow-2xl p-8 overflow-hidden max-h-[85vh] flex flex-col">

        {/* HEADER */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Transaction Picking Details
        </h2>

        {/* BODY */}
        <div className="overflow-y-auto pr-2 space-y-5 flex-1">

          {normalizedItems.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No transaction items available
            </p>
          ) : (
            normalizedItems.map((trx: any, idx: number) => (
              <div
                key={trx.id || idx}
                className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm"
              >
                {/* ITEM HEADER */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Item</p>
                    <p className="font-semibold text-gray-800">
                      {trx?.item?.description ?? "-"} ({trx?.item?.sku ?? "-"})
                    </p>
                    <p className="text-xs text-gray-600">
                      Item Number: {trx?.item?.item_number ?? "-"}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      trx?.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {trx?.status ?? "-"}
                  </span>
                </div>

                {/* GRID INFO */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                  <div>
                    <strong>Quantity:</strong> {trx?.quantity ?? "-"} {trx?.uom}
                  </div>

                  <div>
                    <strong>Week Number:</strong> {trx?.week_number ?? "-"}
                  </div>

                  <div>
                    <strong>Source Warehouse Sub:</strong>{" "}
                    {trx?.sourceWarehouseSub?.name ?? "-"}
                  </div>

                  <div>
                    <strong>Source Bin:</strong>{" "}
                    {trx?.sourceBin?.name ?? trx?.sourceBin?.code ?? "-"}
                  </div>

                  <div>
                    <strong>Destination Warehouse Sub:</strong>{" "}
                    {trx?.destinationWarehouseSub?.name ?? "-"}
                  </div>

                  <div>
                    <strong>Destination Bin:</strong>{" "}
                    {trx?.destinationBin?.name ?? trx?.destination_bin_id ?? "-"}
                  </div>
                </div>

                <hr className="my-4" />

                {/* SCAN TRANSACTION */}
                <div>
                  <p className="font-semibold text-gray-700 mb-2">
                    Transaction Scan Picking:
                  </p>

                  {(!trx?.transactionScanPicking ||
                    trx.transactionScanPicking.length === 0) ? (
                    <p className="text-red-500 text-sm">
                      Belum ada data scan picking
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {trx.transactionScanPicking.map((scan: any) => (
                        <div
                          key={scan.id}
                          className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
                        >
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div>
                              <strong>Pallet Source:</strong>{" "}
                              {scan?.palletSource?.pallet_code ?? "-"}
                            </div>

                            <div>
                              <strong>Pallet Use:</strong>{" "}
                              {scan?.palletUse?.pallet_code ?? "-"}
                            </div>

                            <div>
                              <strong>Qty Picked:</strong>{" "}
                              {scan?.quantity_picked ?? "-"}
                            </div>

                            <div>
                              <strong>UOM:</strong> {scan?.uom ?? "-"}
                            </div>

                            <div>
                              <strong>User:</strong> {scan?.user_name ?? "-"}
                            </div>

                            <div>
                              <strong>Inspection By:</strong>{" "}
                              {scan?.inspection_by ?? "-"}
                            </div>

                            <div>
                              <strong>Status:</strong>{" "}
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                                {scan?.status ?? "-"}
                              </span>
                            </div>

                            <div>
                              <strong>Week:</strong> {scan?.week_number ?? "-"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER STICKY */}
        <div className="pt-4 text-right bg-white sticky bottom-0 border-t">
          <Button onClick={onRequestClose} variant="danger">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionPickingsModal;
