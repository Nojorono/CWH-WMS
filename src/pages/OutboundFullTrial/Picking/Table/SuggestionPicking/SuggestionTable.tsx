import Button from "../../../../../components/ui/button/Button";
import { useCompactRows } from "./hooks/useCompactRows";
import { usePickingQuantities } from "./hooks/usePickingQuantities";
import { buildPayload } from "./hooks/usePickingPayload";
import { PickingRowsTable } from "./components/PickingRowsTable";
import { MemoHeader } from "./components/MemoHeader";
import {
  useStoreTransactionPicking,
  useStoreBin,
} from "../../../../../DynamicAPI/stores/Store/MasterStore";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { showErrorToast } from "../../../../../components/toast";

interface SuggestionTableProps {
  memoDetail: any;
  suggestionItems: any[];
  deliveryOrder: any;
  onBack: () => void;
}

const SuggestionTable: React.FC<SuggestionTableProps> = ({
  memoDetail,
  suggestionItems,
  deliveryOrder,
  onBack,
}) => {
  const { list: binData, fetchAll } = useStoreBin();
  const { createBulkData } = useStoreTransactionPicking();
  const navigate = useNavigate();

  // === Destination BIN dipilih di MemoHeader ===
  const [selectedDestination, setSelectedDestination] = useState("");

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const compactRows = useCompactRows(suggestionItems);
  const { quantities, updateQty } = usePickingQuantities(compactRows);

  // Ambil object bin yang dipilih
  const selectedBin = binData.find((b) => b.id === selectedDestination);

  const handleSubmit = async () => {
    // === VALIDASI DESTINATION BIN ===
    if (!selectedDestination || !selectedBin) {
      return showErrorToast("Pilih destination BIN terlebih dahulu!");
    }

    // Bangun payload
    const payload = buildPayload({
      compactRows,
      quantities,
      deliveryOrder,
      destinationBin: selectedBin,
    });

    const finalPayload = {
      data: payload,
    };

    console.log("Final Payload to submit:", finalPayload);

    // === VALIDASI: data tidak boleh kosong ===
    if (!Array.isArray(finalPayload.data) || finalPayload.data.length === 0) {
      showErrorToast("Picking List masih ada data yang kosong!");
      return; // stop proses di sini
    }

    if (typeof createBulkData === "function") {
      const res = await createBulkData(finalPayload as any);
      console.log("Response from createBulkData:", res);

      if (res?.success) {
        navigate("/outbound_do");
        console.log("Picking List created successfully.");
      }
    } else {
      showErrorToast("Put Away creation function is not available.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Button onClick={onBack}>Back</Button>

      <div className="bg-white rounded-xl shadow">
        {/* === Memo Header + Destination BIN === */}
        <MemoHeader
          memoDetail={memoDetail}
          deliveryOrder={deliveryOrder}
          selectedDestination={selectedDestination}
          setSelectedDestination={setSelectedDestination}
          availableBins={binData
            .filter((bin) => bin.id !== undefined)
            .map((bin) => ({ id: bin.id!, code: bin.code }))}
        />

        {/* === List Item Picking === */}
        <PickingRowsTable
          compactRows={compactRows}
          quantities={quantities}
          updateQty={updateQty}
        />

        {/* === Submit Button === */}
        <div className="flex justify-end p-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={!selectedDestination || !selectedBin}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionTable;
