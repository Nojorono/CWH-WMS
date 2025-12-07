import React, { useEffect, useMemo, useState } from "react";
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
import { showErrorToast } from "../../../../../components/toast";
import { FaArrowLeft } from "react-icons/fa";
import { EndPoint } from "../../../../../utils/EndPoint";
import { formatDate } from "../../../Memo/TableAndForm/MemoCreateProcess";

interface SuggestionTableProps {
  memoDetail: any;
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
  deliveryOrder,
  onBack,
}) => {
  const navigate = useNavigate();
  const { detail: binDataRaw, fetchById: fetchBINbyZoneId } =
    useStoreBinByZone();
  const { createBulkData } = useStoreTransactionPicking();
  const bins: Bin[] = Array.isArray(binDataRaw) ? (binDataRaw as Bin[]) : [];

  const [selectedDestination, setSelectedDestination] = useState("");
  const [sortMethod, setSortMethod] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    fetchBINbyZoneId("73b1e685-d258-440b-b3cf-d66f34dd8187");
  }, [fetchBINbyZoneId]);

  const compactRows = useCompactRows(suggestions);
  const { quantities, updateQty } = usePickingQuantities(compactRows);

  const selectedBin = bins.find((b) => b.id === selectedDestination);

  const fetchPickingSuggestionById = async () => {
    const memoId = memoDetail.id; // Ambil memo_id dari memoDetail.id
    if (!memoId) return; // Pastikan memoId ada sebelum fetch

    const token = localStorage.getItem("token");
    const API = `${EndPoint}picking-suggestion/memo/${memoId}?sortMethod=${sortMethod}`;

    try {
      const response = await fetch(API, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const sortedSuggestions = data.data.sort(
        (
          a: {
            suggested_locations: {
              week_number: any;
              production_date: string | number | Date;
            }[];
          },
          b: {
            suggested_locations: {
              week_number: any;
              production_date: string | number | Date;
            }[];
          }
        ) => {
          const weekDiff =
            a.suggested_locations[0].week_number -
            b.suggested_locations[0].week_number;
          if (weekDiff !== 0) return weekDiff;

          return (
            new Date(a.suggested_locations[0].production_date).getTime() -
            new Date(b.suggested_locations[0].production_date).getTime()
          );
        }
      );
      setSuggestions(sortedSuggestions);
    } catch (error) {
      console.error("Error fetching picking suggestion:", error);
    }
  };

  const handleFetchSuggestions = () => {
    fetchPickingSuggestionById();
  };

  const handleSubmit = async () => {
    if (!selectedDestination || !selectedBin) {
      return showErrorToast("Pilih destination BIN terlebih dahulu!");
    }

    const payload = buildPayload({
      compactRows,
      quantities,
      deliveryOrder,
      destinationBin: selectedBin,
    });

    const finalPayload = {
      data: payload,
    };

    console.log("Payload to submit:", payload);
    console.log("Final Payload to submit:", finalPayload);

    if (!Array.isArray(finalPayload.data) || finalPayload.data.length === 0) {
      showErrorToast("Picking List masih ada data yang kosong!");
      return;
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
        .filter(
          (bin: Bin) => bin.id !== undefined && typeof bin.code === "string"
        )
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
        Back
      </Button>

      <div className="bg-white rounded-xl shadow">
        <h3 className="font-semibold text-gray-700 text-lg mb-3 p-4 border-b">
          Suggestion Items
        </h3>

        <SuggestionItemHeader
          memoDetail={memoDetail}
          deliveryOrder={deliveryOrder}
          selectedDestination={selectedDestination}
          setSelectedDestination={setSelectedDestination}
          availableBins={availableBins}
          sortMethod={sortMethod}
          setSortMethod={setSortMethod}
          handleFetchSuggestions={handleFetchSuggestions}
        />

        {/* === List Item Picking === */}
        <PickingRowsTable
          compactRows={suggestions.flatMap((suggestion) =>
            suggestion.suggested_locations.map(
              (location: {
                location_priority: string;
                warehouse_sub_name: any;
                uom: any;
                bin_name: any;
                quantity_ready_to_pick: any;
                available_quantity: any;
                required_quantity: any;
                week_number: any;
                production_date: any;
                reserved_quantity: any;
              }) => ({
                note: suggestion.notes,
                item_id: suggestion.item_id,
                item_name: suggestion.item_name,
                item_code: suggestion.item_code,
                uom: location.uom,
                zone: location.warehouse_sub_name,
                bin: location.bin_name,
                qty_plan: location.quantity_ready_to_pick,
                required_quantity: location.required_quantity,
                available_quantity: location.available_quantity,
                remaining_quantity_needed: suggestion.remaining_quantity_needed,
                reserved_quantity: location.reserved_quantity,
                week_number: location.week_number,
                production_date: formatDate(location.production_date),
                location_priority: location.location_priority,
              })
            )
          )}
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
