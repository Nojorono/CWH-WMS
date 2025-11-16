// SuggestionTable.tsx

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import Button from "../../../../../components/ui/button/Button";
import { formatDateIndo } from "../../../../../helper/FormatDate";
import {
  useStoreBin,
  useStoreTransactionPicking,
} from "../../../../../DynamicAPI/stores/Store/MasterStore";
import Select from "../../../../../components/form/Select";
import { showErrorToast } from "../../../../../components/toast";
import { useNavigate } from "react-router";

// Tipe data untuk BIN yang di-fetch (sesuai respons API)
interface BinData {
  id: string; // destination_bin_id
  warehouse_sub_id: string; // destination_warehouse_sub_id
  name: string;
  code: string;
  description: string;
  capacity_pallet: number;
}

// Tipe data untuk SuggestedLocation
interface SuggestedLocation {
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  quantity_ready_to_pick: number;
  uom: string;
  warehouse_name: string;
  warehouse_sub_name: string;
  warehouse_sub_code: string;
  warehouse_sub_id: string; // Diperlukan untuk source_warehouse_sub_id
  bin_id: string;
  bin_name: string;
  bin_code: string;
  search_level: string;
  location_type: string;
  location_priority: number;
  week_number: number;
  production_date: string;
  place: string;
}

// Tipe data untuk SuggestedItem
interface SuggestedItem {
  memo_id: string;
  item_id: string;
  item_name: string;
  item_code: string;
  required_quantity: number;
  already_picked_quantity: number;
  remaining_quantity_needed: number;
  available_quantity: number;
  suggested_locations: SuggestedLocation[];
  total_suggested_quantity: number;
  priority: number;
  notes: string;
}

// Tipe data untuk Props
interface SuggestionTableProps {
  memoDetail: any; // Detail memo yang dipilih
  suggestionItems: SuggestedItem[]; // Data item/suggestion dari API
  deliveryOrder: any; // Detail DO untuk header
  onBack: () => void;
}

// Tipe data untuk baris di tabel kompak
interface CompactPickingRow {
  required_quantity: number;
  memo_id: string;
  item_id: string;
  item_name: string;
  item_code: string;
  classification: string;
  qty_plan: string;
  available_quantity: number;
  uom: string;
  production_code: string;
  zone: string;
  bin: string;
  qty_ready_to_pick: number;
  location_data: SuggestedLocation;
  note: string;
}

const SuggestionTable: React.FC<SuggestionTableProps> = ({
  memoDetail,
  suggestionItems,
  deliveryOrder,
  onBack,
}) => {
  const navigate = useNavigate();
  // ⬇️ PENGGUNAAN HOOK API BIN ⬇️
  const { list: binData, fetchAll } = useStoreBin();
  const { createBulkData } = useStoreTransactionPicking();

  // Efek untuk memuat data BIN saat komponen di-mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  console.log("suggestionItems", suggestionItems);

  const availableBins = binData as BinData[];
  // ⬆️ PENGGUNAAN HOOK API BIN ⬆️

  // STATE BARU: DESTINATION BIN (Menyimpan ID Bin yang dipilih)
  const [selectedDestination, setSelectedDestination] = useState<string>("");

  // Temukan objek BIN yang dipilih
  const selectedBin = useMemo(() => {
    if (!selectedDestination) return null;
    const binId = selectedDestination;
    return availableBins.find((bin) => bin.id === binId) || null;
  }, [selectedDestination, availableBins]);

  // 1. Flatten Data: Gabungkan Item dan Loc menjadi satu Array untuk tabel kompak
    const compactRows: CompactPickingRow[] = useMemo(() => {
      return suggestionItems.flatMap((item) => {
        // Jika tidak ada saran lokasi, buat satu baris
        if (item.suggested_locations.length === 0) {
          return [
            {
              memo_id: item.memo_id,
              item_id: item.item_id,
              item_name: item.item_name,
              item_code: item.item_code,
              classification: "ROKOK",
              qty_plan: item.required_quantity.toString(),
              required_quantity: item.required_quantity,
              available_quantity: item.available_quantity,
              uom: "-",
              production_code: "-",
              zone: "-",
              bin: "-",
              qty_ready_to_pick: 0,
              location_data: {} as SuggestedLocation,
              note: item.notes,
            },
          ];
        }
  
        // Jika ada saran lokasi, buat baris untuk setiap lokasi
        return item.suggested_locations.map((loc) => ({
          memo_id: item.memo_id,
          item_id: item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          classification: "ROKOK",
          qty_plan: item.required_quantity.toString(),
          required_quantity: item.required_quantity,
          available_quantity: loc.available_quantity,
          uom: loc.uom,
          production_code: `WEEK ${loc.week_number}`,
          zone: loc.warehouse_sub_code,
          bin: loc.bin_code === "" ? "" : loc.bin_code,
          qty_ready_to_pick: loc.quantity_ready_to_pick,
          location_data: loc,
          note: item.notes,
        }));
      });
    }, [suggestionItems]);

  // 2. State untuk menyimpan kuantitas pick yang akan di-assign
  const [pickingQuantities, setPickingQuantities] = useState<
    Record<string, number>
  >(() => {
    const initialQuantities: Record<string, number> = {};
    compactRows.forEach((row, index) => {
      initialQuantities[`${row.item_id}-${index}`] = row.qty_ready_to_pick;
    });
    return initialQuantities;
  });

  const handleQtyChange = (key: string, value: number, maxQty: number) => {
    const clampedValue = Math.max(0, Math.min(value, maxQty));
    setPickingQuantities((prev) => ({
      ...prev,
      [key]: clampedValue,
    }));
  };

  /**
   * Mengolah data menjadi payload Picking List sesuai skema API.
   */
  const handleSubmit = async () => {
    const doId = deliveryOrder.id || deliveryOrder.delivery_order_id;

    // Validasi Destination
    if (!selectedDestination || !selectedBin) {
      alert("Pilih Destination BIN terlebih dahulu!");
      return;
    }

    // Ambil Destination ID dari Bin yang dipilih
    const destinationBinId = selectedBin.id;
    const destinationSubId = selectedBin.warehouse_sub_id;

    if (!doId) {
      console.error("Error: Delivery Order ID tidak ditemukan.");
      alert("Gagal submit: Delivery Order ID tidak ditemukan.");
      return;
    }

    const pickingListPayload = compactRows
      .map((row, index) => {
        const key = `${row.item_id}-${index}`;
        const assignedQty = pickingQuantities[key] || 0;

        // Abaikan baris yang tidak memiliki lokasi saran atau quantity 0
        if (row.zone === "-" || assignedQty <= 0) {
          return null;
        }

        // Tentukan Source IDs
        const sourceBinId =
          row.location_data.bin_id && row.location_data.bin_id !== "N/A"
            ? row.location_data.bin_id
            : null;

        const sourceSubId = row.location_data.warehouse_sub_id || null;

        if (!sourceSubId) {
          console.warn(
            `Source Warehouse Sub ID missing for item ${row.item_name}. Skipping.`
          );
          return null;
        }

        // Skema Payload yang diminta:
        return {
          do_id: doId,
          memo_id: row.memo_id,
          item_id: row.item_id,
          source_warehouse_sub_id: sourceSubId,
          source_bin_id: sourceBinId,

          // ✅ Menggunakan Destination yang dipilih user
          destination_warehouse_sub_id: destinationSubId,
          destination_bin_id: destinationBinId,

          quantity: assignedQty,
          uom: row.uom,
          week_number: row.location_data.week_number || 0,
          status: "PENDING",
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null); // Hapus item null dan quantity 0

    const finalPayload = {
      data: pickingListPayload,
    };

    console.log("Final Picking List Payload:", finalPayload);
    

    // // === VALIDASI: data tidak boleh kosong ===
    // if (!Array.isArray(finalPayload.data) || finalPayload.data.length === 0) {
    //   showErrorToast("Picking List masih ada data yang kosong!");
    //   return; // stop proses di sini
    // }

    // if (typeof createBulkData === "function") {
    //   const res = await createBulkData(finalPayload as any);
    //   console.log("Response from createBulkData:", res);

    //   if (res?.success) {
    //     navigate("/outbound_do");
    //     console.log("Picking List created successfully.");
    //   }
    // } else {
    //   showErrorToast("Put Away creation function is not available.");
    // }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Tombol Kembali */}
      <Button
        type="button"
        variant="secondary"
        className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 mb-6"
        onClick={onBack}
      >
        <FaArrowLeft className="size-4" />
        Kembali ke Memo List
      </Button>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header Detail Memo */}
        <div className="bg-orange-500 text-white rounded-t-xl px-5 py-3 font-semibold flex justify-between items-center">
          Detail MEMO: {memoDetail.memo_id || memoDetail.id}
        </div>

        {/* Info Memo (Termasuk Pemilihan Destination) */}
        <div className="p-5 border-b border-gray-200 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          {/* Baris Info DO/Memo yang sudah ada */}
          <div>
            <span className="text-gray-500 block">Delivery Order ID</span>
            <span className="font-medium text-gray-800">
              {deliveryOrder.id || deliveryOrder.delivery_order_id}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Origin</span>
            <span className="font-medium text-gray-800">
              {memoDetail.origin}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Ship To</span>
            <span className="font-medium text-gray-800">
              {memoDetail.ship_to}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Delivery Date</span>
            <span className="font-medium text-gray-800">
              {formatDateIndo(memoDetail.delivery_date)}
            </span>
          </div>

          {/* ✅ FIELD Destination BIN */}
          <div className="md:col-span-1">
            <label
              htmlFor="destination-bin"
              className="text-gray-500 block mb-1"
            >
              **Destination BIN**
            </label>
            <Select
              value={selectedDestination}
              onChange={(val) => setSelectedDestination(val)}
              className="w-full font-medium text-gray-800"
              options={[
                {
                  value: "",
                  label: "select bin destination...",
                },
                ...availableBins.map((bin) => ({
                  value: bin.id,
                  label: `${bin.code}`,
                })),
              ]}
              placeholder="select bin destination..."
              width="100%"
              disabled={availableBins.length === 0}
            />
            {/* Tampilkan indikator loading jika daftar kosong dan diasumsikan sedang fetching */}
            {availableBins.length === 0 && selectedDestination === "" && (
              <p className="text-xs text-orange-500 mt-1">
                Memuat daftar BIN...
              </p>
            )}
          </div>
        </div>

        {/* Sugggestion Item List / Picking Table (Compact View) */}
        <div className="p-4">
          <h4 className="font-semibold text-gray-700 text-lg mb-3">
            Suggested Picking Locations
          </h4>

          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-orange-500 text-white">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider min-w-[200px]">
                    Item Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    UoM
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider min-w-[100px]">
                    Week No
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    Bin
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    Required Qty
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    Available Qty
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider min-w-[120px] bg-red-600">
                    Qty to Pick
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {compactRows.length > 0 ? (
                  compactRows.map((row, index) => {
                    const key = `${row.item_id}-${index}`;
                    const isNoLocation = row.zone === "-";

                    return (
                      <tr
                        key={key}
                        className={
                          isNoLocation ? "bg-red-50/50" : "hover:bg-gray-50"
                        }
                      >
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">
                          {row.item_name}
                        </td>

                        <td className="px-3 py-2 text-sm text-gray-500">
                          {row.uom}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500">
                          {row.production_code}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500">
                          {row.zone}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500">
                          {row.bin}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-800 font-semibold">
                          {row.qty_plan}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-800 font-semibold">
                          {row.available_quantity}
                        </td>
                        <td className="px-3 py-2 text-center text-sm">
                          {isNoLocation ? (
                            <span className="text-red-500 italic text-xs">
                              Not Available
                            </span>
                          ) : (
                            <input
                              type="number"
                              value={pickingQuantities[key]}
                              onChange={(e) =>
                                handleQtyChange(
                                  key,
                                  parseInt(e.target.value) || 0,
                                  row.required_quantity // ✅ GANTI: Batas adalah required_quantity
                                )
                              }
                              className="w-20 p-1 border border-orange-400 rounded text-right text-sm focus:ring-orange-500 focus:border-orange-500"
                              min="0"
                              max={row.required_quantity}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-4 text-center text-sm text-red-500 italic"
                    >
                      Tidak ada saran lokasi atau item tidak tersedia di
                      inventaris.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Notes di bawah tabel */}
          {suggestionItems.map((item) => (
            <p key={item.item_id} className="text-xs text-gray-600 italic mt-2">
              **Item {item.item_name} Note:** {item.notes}
            </p>
          ))}
        </div>

        {/* Tombol Assign Picker */}
        <div className="flex justify-end p-4 border-t border-gray-200">
          <Button
            type="button"
            className="bg-orange-500 text-white hover:bg-orange-600 px-6 py-2"
            onClick={handleSubmit}
            disabled={compactRows.length === 0 || !selectedDestination} // Disable jika belum memilih Destination
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionTable;
