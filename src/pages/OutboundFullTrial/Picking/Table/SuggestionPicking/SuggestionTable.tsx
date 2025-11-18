import Button from "../../../../../components/ui/button/Button";
import { useCompactRows } from "./hooks/useCompactRows";
import { usePickingQuantities } from "./hooks/usePickingQuantities";
import { buildPayload } from "./hooks/usePickingPayload";
import { PickingRowsTable } from "./components/PickingRowsTable";
import { SuggestionItemHeader } from "./components/SuggestionItemHeader";
import {
  useStoreTransactionPicking,
  useStoreBinByZone,
} from "../../../../../DynamicAPI/stores/Store/MasterStore";
import { useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { showErrorToast } from "../../../../../components/toast";
import { FaArrowLeft } from "react-icons/fa";

interface SuggestionTableProps {
  memoDetail: any;
  suggestionItems: any[];
  deliveryOrder: any;
  onBack: () => void;
}

type Bin = {
  id?: any;
  code?: string;
  [key: string]: any;
};

const SuggestionTable: React.FC<SuggestionTableProps> = ({
  memoDetail,
  suggestionItems,
  deliveryOrder,
  onBack,
}) => {
  const { detail: binDataRaw, fetchById: fetchBINbyZoneId } =
    useStoreBinByZone();
  const { createBulkData } = useStoreTransactionPicking();
  const navigate = useNavigate();

  const bins: Bin[] = Array.isArray(binDataRaw) ? (binDataRaw as Bin[]) : [];

  // === Destination BIN dipilih di SuggestionItemHeader ===
  const [selectedDestination, setSelectedDestination] = useState("");

  useEffect(() => {
    fetchBINbyZoneId("73b1e685-d258-440b-b3cf-d66f34dd8187");
  }, [fetchBINbyZoneId]);

  const compactRows = useCompactRows(suggestionItems);
  const { quantities, updateQty } = usePickingQuantities(compactRows);

  // Ambil object bin yang dipilih
  const selectedBin = bins.find((b) => b.id === selectedDestination);

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

  const availableBins = useMemo(
    () =>
      bins
        .filter((bin: Bin) => bin.id !== undefined && typeof bin.code === "string")
        .map((bin: Bin) => ({ id: bin.id!, code: bin.code as string })),
    [bins]
  );

  return (
    <div className="p-6 space-y-6">
      <Button
        onClick={onBack}
        variant="danger"
        size="sm"
        startIcon={<FaArrowLeft />}
      >
        Back to Memo List
      </Button>

      <div className="bg-white rounded-xl shadow">
        {/* === Memo Header + Destination BIN === */}

        <h3 className="font-semibold text-gray-700 text-lg mb-3 p-4 border-b">
          Suggestion Items
        </h3>

        <SuggestionItemHeader
          memoDetail={memoDetail}
          deliveryOrder={deliveryOrder}
          selectedDestination={selectedDestination}
          setSelectedDestination={setSelectedDestination}
          availableBins={availableBins}
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
            Submit Suggestion
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionTable;
