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
import { FaArrowLeft, FaCheck, FaUndo } from "react-icons/fa";
import { EndPoint } from "../../../../../utils/EndPoint";
import formatDate from "../../../Memo/TableAndForm/MemoCreateProcess";
import ActIndicator from "../../../../../components/ui/activityIndicator";
import axiosInstance from "../../../../../DynamicAPI/AxiosInstance";

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
  const [isLoadingFetch, setLoadingFetch] = useState<boolean>(false);

  useEffect(() => {
    fetchBINbyZoneId("73b1e685-d258-440b-b3cf-d66f34dd8187");
  }, [fetchBINbyZoneId]);

  const compactRows = useCompactRows(suggestions);
  const { quantities, updateQty } = usePickingQuantities(compactRows);
  const selectedBin = bins.find((b) => b.id === selectedDestination);

  const fetchPickingSuggestionById = async () => {
    const memoId = memoDetail.id; // Ambil memo_id dari memoDetail.id
    if (!memoId) return; // Pastikan memoId ada sebelum fetch

    setLoadingFetch(true);

    try {
      // KUNCI REFAKTOR: Menggunakan axiosInstance.get dengan path relatif.
      // Query string 'sortMethod' dikirim dengan rapi melalui objek 'params' bawaan Axios.
      const res = await axiosInstance.get(`picking-suggestion/memo/${memoId}`, {
        params: {
          sortMethod: sortMethod,
        },
      });

      // Pada Axios, response body murni berada di dalam 'res.data'
      // Sehingga data.data di fetch lama sekarang diakses melalui res.data.data
      setSuggestions(res.data.data);
    } catch (error) {
      console.error(
        "Error fetching picking suggestion via axiosInstance:",
        error,
      );
    } finally {
      // Menjamin loading spinner pasti mati (false) baik saat proses sukses maupun gagal
      setLoadingFetch(false);
    }
  };

  const handleFetchSuggestions = () => {
    fetchPickingSuggestionById();
  };

  const handleReset = () => {
    setSortMethod("");
    setSelectedDestination("");
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    if (!selectedDestination || !selectedBin) {
      return showErrorToast("Pilih destination BIN terlebih dahulu!");
    }

    if (compactRows.length === 0) {
      return showErrorToast("Tidak ada Item Suggestion!");
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

    if (!Array.isArray(finalPayload.data) || finalPayload.data.length === 0) {
      showErrorToast("Picking List masih ada data yang kosong!");
      return;
    }

    if (typeof createBulkData === "function") {
      const res = await createBulkData(finalPayload as any);

      if (res?.success) {
        navigate("/outbound_do");
      }
    } else {
      showErrorToast("Put Away creation function is not available.");
    }
  };

  const availableBins = useMemo(
    () =>
      bins
        .filter(
          (bin: Bin) => bin.id !== undefined && typeof bin.code === "string",
        )
        .map((bin: Bin) => ({ id: bin.id!, code: bin.code as string })),
    [bins],
  );

  const allRowsEmpty = compactRows.every(
    (row) =>
      row.uom === "-" &&
      row.zone === "-" &&
      row.bin === "-" &&
      row.production_date === "-",
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

        {isLoadingFetch ? (
          <div className="flex justify-center py-4">
            <ActIndicator />
          </div>
        ) : (
          <PickingRowsTable
            compactRows={suggestions.flatMap((suggestion) => {
              if (suggestion.suggested_locations.length > 0) {
                return suggestion.suggested_locations.map((location: any) => ({
                  note: suggestion.notes,
                  item_id: suggestion.item_id,
                  item_name: suggestion.item_name,
                  item_code: suggestion.item_code,
                  uom: location.uom ?? "-",
                  zone: location.warehouse_sub_name ?? "-",
                  bin: location.bin_name ?? "-",
                  qty_plan: location.quantity_ready_to_pick ?? 0,
                  required_quantity:
                    location.required_quantity ?? suggestion.required_quantity,
                  available_quantity: location.available_quantity ?? 0,
                  remaining_quantity_needed:
                    suggestion.remaining_quantity_needed,
                  reserved_quantity: location.reserved_quantity ?? 0,
                  week_number: location.week_number ?? 0,
                  production_date: formatDate(location.production_date),
                  location_priority: location.location_priority ?? "-",
                }));
              }

              // fallback kalau tidak ada lokasi
              return [
                {
                  note: suggestion.notes,
                  item_id: suggestion.item_id,
                  item_name: suggestion.item_name,
                  item_code: suggestion.item_code,
                  uom: "-",
                  zone: "-",
                  bin: "-",
                  qty_plan: suggestion.required_quantity,
                  required_quantity: suggestion.required_quantity,
                  available_quantity: 0,
                  remaining_quantity_needed:
                    suggestion.remaining_quantity_needed,
                  reserved_quantity: 0,
                  week_number: 0,
                  production_date: "-",
                  location_priority: "-",
                },
              ];
            })}
            quantities={quantities}
            updateQty={updateQty}
          />
        )}

        {/* === Submit Button === */}
        <div className="flex justify-end p-4 border-t">
          <Button
            onClick={handleReset}
            variant="danger"
            size="sm"
            className="mr-3"
            startIcon={<FaUndo />}
          >
            Reset
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!selectedDestination || !selectedBin || allRowsEmpty}
            startIcon={<FaCheck />}
          >
            Submit Suggestion
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionTable;
