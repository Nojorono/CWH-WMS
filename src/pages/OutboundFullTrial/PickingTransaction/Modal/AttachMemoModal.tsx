import React, { useEffect } from "react";
import Button from "../../../../components/ui/button/Button";
import { useStoreOutboundMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useNavigate } from "react-router-dom";

type AttachMemoModalProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  onAttach: (memoData: any) => Promise<void>; // Ganti dengan tipe data yang sesuai
  detailDO: any; // Ganti dengan tipe data yang sesuai
};

const AttachMemoModal: React.FC<AttachMemoModalProps> = ({
  isOpen,
  onRequestClose,
  onAttach,
  detailDO,
}) => {
  const navigate = useNavigate();
  const [memoData, setMemoData] = React.useState<any>({}); // Ganti dengan tipe data yang sesuai

  const { fetchUsingParam, list } = useStoreOutboundMemo();

  useEffect(() => {
    fetchUsingParam({ has_do: false });
  }, [fetchUsingParam]);

  const handleSubmit = async () => {
    const attachedMemoData = {
      memoId: memoData.id,
      do_id: detailDO.outbound_do_number,
      sequence: "", // Menyertakan sequence jika ada
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://10.0.29.47:9005/outbound-do/${detailDO.id}/attach-memo?memoId=${memoData.id}&sequence=${attachedMemoData.sequence}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      onRequestClose();
      navigate("/picking_transaction");
    } catch (error) {
      console.error("Error Attaching Memo:", error);
    }
  };

  if (!isOpen) return null; // Jika modal tidak terbuka, tidak render apa-apa

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/70">
      <div className="bg-white w-[90vw] max-w-[800px] max-h-[90vh] overflow-y-auto rounded-lg shadow-xl p-6">
        <h2 className="text-lg font-semibold">
          Attach Memo to {detailDO.outbound_do_number} - {detailDO.id}
        </h2>
        <div className="mt-4">
          {/* Dropdown select untuk memo data */}
          <select
            className="border rounded p-2 w-full mb-4"
            onChange={(e) => setMemoData({ ...memoData, id: e.target.value })}
          >
            <option value="">Select Memo</option>
            {list.map((memo: any) => (
              <option key={memo.id} value={memo.id}>
                {memo.outbound_memo_number} - {memo.id}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            type="button"
            className="bg-blue-500 text-white hover:bg-blue-600"
            onClick={handleSubmit}
          >
            Attach
          </Button>
          <Button
            type="button"
            className="bg-gray-300 text-black hover:bg-gray-400 ml-2"
            onClick={onRequestClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttachMemoModal;
