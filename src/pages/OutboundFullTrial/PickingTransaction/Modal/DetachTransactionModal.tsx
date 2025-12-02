import React from "react";
import Button from "../../../../components/ui/button/Button";
import { formatDateIndo } from "../../../../helper/FormatDate";

type DetachTransactionProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  transactionData: any; // Ganti dengan tipe data yang sesuai
  onDetach: (transactionId: string) => Promise<void>;
};

const DetachTransaction: React.FC<DetachTransactionProps> = ({
  isOpen,
  onRequestClose,
  transactionData,
  onDetach,
}) => {
  const handleDetach = async () => {
    if (transactionData) {
      await onDetach(transactionData.id);
      onRequestClose(); // Tutup modal setelah detach
    }
  };

  if (!isOpen) return null; // Jika modal tidak terbuka, tidak render apa-apa

  const mappedList = (transactionData: any) => {
    return {
      memoId: transactionData.id,
      outboundMemoNumber: transactionData.outbound_memo_number,
      requestor: transactionData.requestor,
      origin: transactionData.origin,
      destination: transactionData.destination,
      deliveryDate: formatDateIndo(transactionData.delivery_date),
      status: transactionData.status,
      sequence: transactionData.sequence,
      items: transactionData.outbound_memo_items.map((item: any) => ({
        itemId: item.item_id,
        quantityPlanned: item.quantity_plan,
        uom: item.uom,
      })),
      pickings: transactionData.transaction_pickings.map((picking: any) => ({
        pickingId: picking.id,
        doId: picking.do_id,
        quantity: picking.quantity,
        uom: picking.uom,
        status: picking.status,
        transactionScanPicking: picking.transactionScanPicking.map(
          (scan: any) => ({
            scanId: scan.id,
            quantityPicked: scan.quantity_picked,
            userName: scan.user_name,
            inspectionBy: scan.inspection_by,
            weekNumber: scan.week_number,
            UOM: scan.uom,
          })
        ),
      })),
      assignedPickings: transactionData.assigned_pickings.map(
        (assigned: any) => ({
          assignedId: assigned.id,
          pickingName: assigned.picking_name,
          pickingPhone: assigned.picking_phone,
        })
      ),
    };
  };

  const mappedData = mappedList(transactionData); // Memanggil fungsi mappedList

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/70">
      <div className="bg-white w-[90vw] max-w-[800px] max-h-[90vh] overflow-y-auto rounded-lg shadow-xl p-6">
        <h2 className="text-2xl font-bold text-center mb-4">
          Detach Transaction
        </h2>

        {/* Kartu untuk menampilkan detail transaksi */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-md mb-4">
          <h3 className="text-lg font-semibold mb-2">Transaction Details</h3>
          <p className="text-lg">
            <strong>Memo ID:</strong> {mappedData.memoId}
          </p>
          <p className="text-lg">
            <strong>Status:</strong> {mappedData.status}
          </p>
          <p className="text-lg">
            <strong>Sequence:</strong> {mappedData.sequence}
          </p>
        </div>

        {/* Kartu untuk menampilkan transaction pickings */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-md mb-4">
          <h3 className="text-lg font-semibold mb-2">Transaction Pickings</h3>
          {mappedData.pickings.map((picking: any) => (
            <div key={picking.pickingId} className="mb-4 border-b pb-2">
              <p className="text-lg">
                <strong>Picking Transaction ID:</strong> {picking.pickingId}
              </p>
              <p className="text-lg">
                <strong>Processed From DO ID:</strong> {picking.doId}
              </p>
              <p className="text-lg">
                <strong>Status:</strong> {picking.status}
              </p>
              {/* Menampilkan detail scan picking */}
              {picking.transactionScanPicking.map((scan: any) => (
                <div key={scan.scanId} className="ml-4">
                  <p className="text-lg">
                    <strong>Scan ID:</strong> {scan.scanId}
                  </p>
                  <p className="text-lg">
                    <strong>Quantity Picked:</strong> {scan.quantityPicked}
                  </p>
                  <p className="text-lg">
                    <strong>UOM:</strong> {scan.UOM}
                  </p>
                  <p className="text-lg">
                    <strong>Week Number:</strong> {scan.weekNumber}
                  </p>
                  <p className="text-lg">
                    <strong>User Name:</strong> {scan.userName}
                  </p>
                  <p className="text-lg">
                    <strong>Inspection By:</strong> {scan.inspectionBy}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6 space-x-2">
          <Button
            type="button"
            className="bg-red-600 text-white hover:bg-red-700 transition duration-200"
            onClick={handleDetach}
          >
            Confirm Detach
          </Button>
          <Button
            type="button"
            className="bg-gray-300 text-black hover:bg-gray-400 transition duration-200"
            onClick={onRequestClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DetachTransaction;
