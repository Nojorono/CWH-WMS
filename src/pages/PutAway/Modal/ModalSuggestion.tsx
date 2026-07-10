"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FaTimes } from "react-icons/fa";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import { useStoreSubWarehouseWithBins } from "../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast } from "../../../components/toast";

type AdjustmentForm = {
  destinationWarehouseSubName: string | undefined;
  palletId: string;
  palletCode: string;
  totalQty: number;
  stagingArea: string;
  suggestZone: string;
  suggestBin: string;
  bin_id?: string;
  zone_id?: string;
  destinationWarehouseSubCode?: string;
  destinationBinCode?: string;
};

interface AdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  data: AdjustmentForm | null;
  onSave: (updated: AdjustmentForm) => void;
  mode?: "edit" | "create";
}

// 📦 Strict Interfaces sesuai response API
interface Bin {
  id: string;
  locator_id?: string | null;
  locator_name?: string | null;
  warehouse_sub_id: string;
  name: string;
  code: string;
  description?: string;
  capacity_pallet: number | null;
  current_pallet?: string | null;
  current_pallet_count: number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Zone {
  id: string;
  locator_id?: string | null;
  locator_name?: string | null;
  warehouse_id: string;
  name: string;
  code: string;
  description?: string;
  capacity_bin?: number | null;
  is_staging?: string | null;
  is_good_stock?: boolean;
  is_gate?: boolean;
  createdAt?: string;
  updatedAt?: string;
  bins: Bin[];
}

// 🔹 Default form value
const defaultFormValues: AdjustmentForm = {
  palletId: "",
  palletCode: "",
  totalQty: 0,
  stagingArea: "",
  suggestZone: "",
  suggestBin: "",
  bin_id: "",
  zone_id: "",
  destinationBinCode: "",
  destinationWarehouseSubCode: "",
  destinationWarehouseSubName: "",
};

const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  open,
  onClose,
  data,
  onSave,
  mode = "create",
}) => {
  // Ambil list dan status loading dari store utama
  const {
    list: subWarehouseWithBinList,
    fetchUsingParam,
    isLoading,
  } = useStoreSubWarehouseWithBins();

  useEffect(() => {
    if (open) {
      fetchUsingParam({
        is_staging: "null",
        is_good_stock: true,
        is_gate: false,
      });
    }
  }, [open, fetchUsingParam]);

  const [formValues, setFormValues] = useState<AdjustmentForm>(
    data ?? defaultFormValues,
  );

  useEffect(() => {
    if (open) {
      if (data) {
        // Isi fallback jika suggestZone / suggestBin kosong
        setFormValues({
          ...data,
          suggestZone:
            data.suggestZone ||
            data.destinationWarehouseSubCode ||
            data.destinationWarehouseSubName ||
            "",
          suggestBin:
            data.suggestBin ||
            data.destinationBinCode ||
            data.destinationWarehouseSubName ||
            "",
        });
      } else {
        setFormValues(defaultFormValues);
      }
    }
  }, [open, data]);

  // 🔄 Reset form saat modal ditutup
  useEffect(() => {
    if (!open) {
      setFormValues(defaultFormValues);
    }
  }, [open]);

  // 🧠 Daftar Zone dari store utama
  const availableZones = useMemo(() => {
    return subWarehouseWithBinList.map((zone) => ({
      value: zone.id,
      label: `${zone.name}`,
    }));
  }, [subWarehouseWithBinList]);

  // 🧠 Daftar Bin diambil secara dinamis dari Zone terpilih
  const availableBins = useMemo(() => {
    if (!formValues.zone_id) return [];

    const selectedZone = subWarehouseWithBinList.find(
      (zone) => zone.id === formValues.zone_id,
    );

    const binsArray = Array.isArray(selectedZone?.bins)
      ? selectedZone.bins
      : [];

    return binsArray.map((bin: Bin) => ({
      value: bin.id,
      label: bin.code,
      code: bin.code,
      zoneId: bin.warehouse_sub_id,
      capacity_pallet: bin.capacity_pallet,
      current_pallet: bin.current_pallet ?? null,
      current_pallet_count: bin.current_pallet_count ?? 0,
    }));
  }, [subWarehouseWithBinList, formValues.zone_id]);

  const selectedBinInfo = useMemo(() => {
    if (!formValues.bin_id) return null;
    return availableBins.find((bin) => bin.value === formValues.bin_id) ?? null;
  }, [availableBins, formValues.bin_id]);

  // ⚙️ Handle Zone Change
  const handleZoneChange = useCallback(
    (zoneId: string) => {
      const selectedZone = availableZones.find((z) => z.value === zoneId);
      if (!selectedZone) return;

      setFormValues((prev) => ({
        ...prev,
        suggestZone: selectedZone.label, // tampilkan nama zone di UI
        zone_id: selectedZone.value, // simpan id zone untuk API
        suggestBin: "",
        bin_id: "",
      }));
    },
    [availableZones],
  );

  // ⚙️ Handle Bin Change
  const handleBinChange = useCallback(
    (binId: string) => {
      const selectedBin = availableBins.find((b) => b.value === binId);
      if (!selectedBin) return;

      setFormValues((prev) => ({
        ...prev,
        suggestBin: selectedBin.code,
        bin_id: selectedBin.value,
      }));
    },
    [availableBins],
  );

  // 🧩 Handle Submit & Validasi Kapasitas
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formValues.zone_id || !formValues.bin_id) {
      showErrorToast("Please select both Zone and Bin before saving.");
      return;
    }

    // 🚀 Check capacity limit
    const selectedBin = availableBins.find(
      (b) => b.value === formValues.bin_id,
    );
    if (selectedBin) {
      const { capacity_pallet, current_pallet_count, code } = selectedBin;

      // Jika capacity_pallet bernilai angka (> 0)
      if (
        capacity_pallet !== null &&
        capacity_pallet !== undefined &&
        capacity_pallet > 0
      ) {
        if (current_pallet_count >= capacity_pallet) {
          showErrorToast(
            `Cannot save. Bin ${code} is full (Capacity: ${capacity_pallet}, Current: ${current_pallet_count}).`,
          );
          return;
        }
      }
    }

    onSave(formValues);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/40 flex justify-center items-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-lg w-[420px] p-6 relative animate-fadeIn">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <FaTimes />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
          🧭 Adjustment Location Put Away
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Readonly fields */}
          {[
            { label: "Pallet Code", value: formValues.palletCode },
            ...(mode !== "create"
              ? [
                  {
                    label: "Destination Zone",
                    value: formValues.destinationWarehouseSubCode,
                  },
                  {
                    label: "Destination Bin Code",
                    value: formValues.destinationBinCode,
                  },
                ]
              : []),
            { label: "Suggestion Zone", value: formValues.suggestZone },
            { label: "Suggestion Bin", value: formValues.suggestBin },
          ].map((field, idx) => (
            <div key={idx}>
              <label className="block text-sm font-semibold text-gray-700">
                {field.label}
              </label>
              <input
                value={field.value}
                readOnly
                className="w-full border rounded-md bg-gray-200 text-gray-600 px-3 py-2"
              />
            </div>
          ))}

          {/* Select Zone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Select Zone
            </label>
            <Select
              value={formValues.zone_id || ""}
              onChange={handleZoneChange}
              options={[
                {
                  value: "",
                  label: isLoading ? "Loading Zones..." : "-- Select Zone --",
                },
                ...availableZones,
              ]}
              width={"100%"}
            />
          </div>

          {/* Select Bin */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Select Bin
            </label>
            <Select
              value={formValues.bin_id || ""}
              onChange={handleBinChange}
              options={[
                {
                  value: "",
                  label: formValues.zone_id
                    ? "-- Select Bin --"
                    : "Select Zone first",
                },
                ...(formValues.zone_id ? availableBins : []),
              ]}
              width={"100%"}
            />
            {selectedBinInfo && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Capacity Pallet
                  </label>
                  <input
                    value={selectedBinInfo.capacity_pallet ?? "-"}
                    readOnly
                    className="w-full border rounded-md bg-gray-200 text-gray-600 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Current Pallet Count
                  </label>
                  <input
                    value={selectedBinInfo.current_pallet_count}
                    readOnly
                    className="w-full border rounded-md bg-gray-200 text-gray-600 px-3 py-2"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustmentModal;
