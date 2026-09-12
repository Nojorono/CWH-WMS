import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import Button from "../../../../components/ui/button/Button";
import { FaCheck, FaArrowLeft } from "react-icons/fa";
import { ReviewGroup } from "../Types/suggestTableTypes";

interface Props {
  open: boolean;
  data: ReviewGroup[];
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

const ModalReviewFinalSuggestion: React.FC<Props> = ({
  open,
  data,
  onClose,
  onConfirm,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!open) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const hasError = data.some(
    (g) => g.status === "OVER" || g.status === "UOM_MISMATCH",
  );

  const isDataEmpty = !data || data.length === 0;
  const isSubmitDisabled = hasError || isDataEmpty || isSubmitting;

  const handleSubmit = () => {
    if (isSubmittingRef.current || isSubmitDisabled) return;

    Swal.fire({
      icon: "question",
      title: "Confirm Submit?",
      text: "Apakah data sudah benar dan ingin dikirim?",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit",
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        await Promise.resolve(onConfirm());
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center backdrop-blur-md bg-transparent">
      <div className="bg-white w-2/5 max-h-[90vh] overflow-auto rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-bold mb-4">Review Final Suggestion</h2>

        {data.map((group) => (
          <div key={group.item_id} className="border rounded-lg p-4 mb-5">
            {/* ===== CARD SUMMARY ===== */}
            <div className="flex justify-between mb-3">
              <div>
                <div className="font-bold">
                  {group.item_code} – {group.item_name}
                </div>
              </div>

              <div className="text-right text-sm">
                <div>Required: {group.required_qty}</div>
                <div>Already Picked: {group.already_picked_qty}</div>
                <div className="font-bold">
                  Remaining: {group.remaining_qty}
                </div>
              </div>
            </div>

            {/* ===== STATUS ===== */}
            <div className="mb-2 font-bold">
              {group.status === "OK" && (
                <span className="text-green-600">
                  Qty Picked Suggestion sudah sama dengan Qty yang dibutuhkan
                  (diperbolehkan Submit).
                </span>
              )}
              {group.status === "LESS" && (
                <span className="text-yellow-600">
                  Qty Picked Suggestion kurang dari Qty yang dibutuhkan
                  (diperbolehkan Submit).
                </span>
              )}
              {group.status === "OVER" && (
                <span className="text-red-600">
                  Qty Picked Suggestion lebih dari Qty yang dibutuhkan! (Tidak
                  diperbolehkan Submit).
                </span>
              )}
              {group.status === "UOM_MISMATCH" && (
                <span className="text-red-700">UOM Tidak Sama</span>
              )}
            </div>

            {/* ===== DETAIL TABLE ===== */}
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Week</th>
                  <th className="border p-2">Zone</th>
                  <th className="border p-2">Bin</th>
                  <th className="border p-2">Picking Suggestion Qty</th>
                  <th className="border p-2">UoM</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {group.details.map((d, i) => (
                  <tr key={i}>
                    <td className="border p-2">{d.week_number}</td>
                    <td className="border p-2">{d.source_zone}</td>
                    <td className="border p-2">{d.source_bin}</td>
                    <td className="border p-2 font-bold">{d.picked_qty}</td>
                    <td className="border p-2 font-bold">{d.uom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            startIcon={<FaArrowLeft />}
          >
            Back to Edit
          </Button>

          <Button
            variant="action"
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
            startIcon={<FaCheck />}
          >
            {isSubmitting ? "Processing..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalReviewFinalSuggestion;
