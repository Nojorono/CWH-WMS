import React from "react";
import Swal from "sweetalert2";
import Button from "../../../../components/ui/button/Button";
import { FaCheck, FaArrowLeft } from "react-icons/fa";
import { ReviewSuggestionRow } from "../Types/suggestTableTypes";

interface ReviewItem {
  do_id: string | null;
  memo_id: string;
  item_id: string;
  quantity: number;
  uom: string;
  week_number: number;
  source_warehouse_sub_id: string;
  source_bin_id?: string;
  status: string;
}

interface Props {
  open: boolean;
  data: ReviewSuggestionRow[];
  onClose: () => void;
  onConfirm: () => void;
}

const ModalReviewFinalSuggestion: React.FC<Props> = ({
  open,
  data,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  console.log("Review Data:", data);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-transparent">
      <div className="bg-white w-4/5 max-h-[80vh] overflow-auto rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-bold mb-4">Review Final Suggestion</h2>

        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">SKU</th>
              <th className="border p-2">Item Name</th>
              <th className="border p-2 text-right">Qty</th>
              <th className="border p-2">UOM</th>
              <th className="border p-2">Week</th>
              <th className="border p-2">Source Zone</th>
              <th className="border p-2">Source Bin</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td className="border p-2 font-mono">{row.item_code}</td>
                <td className="border p-2">{row.item_name}</td>
                <td className="border p-2 text-right font-bold">{row.qty}</td>
                <td className="border p-2">{row.uom}</td>
                <td className="border p-2 text-center">{row.week_number}</td>
                <td className="border p-2">{row.source_zone}</td>
                <td className="border p-2">{row.source_bin}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            startIcon={<FaArrowLeft />}
          >
            Back to Edit
          </Button>

          <Button
            variant="action"
            onClick={() => {
              Swal.fire({
                icon: "question",
                title: "Confirm Submit?",
                text: "Apakah data sudah benar dan ingin dikirim?",
                showCancelButton: true,
                confirmButtonText: "Yes, Submit",
              }).then((res) => {
                if (res.isConfirmed) {
                  onConfirm();
                }
              });
            }}
            startIcon={<FaCheck />}
          >
            Confirm & Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalReviewFinalSuggestion;
