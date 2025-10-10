"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FaTimes } from "react-icons/fa";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import {
  useStoreBinByZone,
  useStoreSubWarehouse,
} from "../../../DynamicAPI/stores/Store/MasterStore";

type AdjustmentForm = {
  palletId: string;
  palletCode: string;
  totalQty: number;
  stagingArea: string;
  suggestZone: string;
  suggestBin: string;
  bin_id?: string;
  zone_id?: string;
};

interface AdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  data: AdjustmentForm | null;
  onSave: (updated: AdjustmentForm) => void;
}

const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  open,
  onClose,
  data,
  onSave,
}) => {
  const {
    detail: binList,
    fetchById: fetchBinList,
    isLoading: binLoading,
  } = useStoreBinByZone();
  const {
    list: subWarehouseList,
    fetchAll: fetchSubWarehouseList,
    isLoading: zoneLoading,
  } = useStoreSubWarehouse();

  const [formValues, setFormValues] = useState<AdjustmentForm>(
    data ?? {
      palletId: "",
      palletCode: "",
      totalQty: 0,
      stagingArea: "",
      suggestZone: "",
      suggestBin: "",
      bin_id: "",
      zone_id: "",
    }
  );

  // 🌀 Fetch Sub Warehouse (Zone) saat modal terbuka
  useEffect(() => {
    if (open) {
      fetchSubWarehouseList();
      if (data) setFormValues(data);
    }
  }, [open, data]);

  // 📦 Fetch Bin berdasarkan Zone terpilih
  useEffect(() => {
    if (formValues.zone_id) {
      fetchBinList(formValues.zone_id);
    }
  }, [formValues.zone_id]);

  // 🧠 Memo: daftar Zone
  const availableZones = useMemo(() => {
    return (
      subWarehouseList?.map((zone: any) => ({
        value: zone.id,
        label: `${zone.name}`,
      })) ?? []
    );
  }, [subWarehouseList]);

  // 🧠 Memo: daftar Bin
  const availableBins = useMemo(() => {
    const binsArray = Array.isArray(binList) ? binList : [];
    return binsArray.map((bin: any) => ({
      value: bin.id,
      label: `${bin.code}`,
      code: bin.code,
      zoneId: bin.warehouse_sub_id,
    }));
  }, [binList]);

  // ⚙️ Handle perubahan Zone
  const handleZoneChange = useCallback(
    (zoneId: string) => {
      const selectedZone = availableZones.find((z) => z.value === zoneId);
      if (!selectedZone) return;

      setFormValues((prev) => ({
        ...prev,
        suggestZone: selectedZone.value,
        suggestZoneName: selectedZone.label,
        zone_id: zoneId,
        suggestBin: "",
        bin_id: "",
      }));
    },
    [availableZones]
  );

  // ⚙️ Handle perubahan Bin
  const handleBinChange = useCallback(
    (binId: string) => {
      const selectedBin = availableBins.find((b) => b.value === binId);
      if (!selectedBin) return;

      setFormValues((prev) => ({
        ...prev,
        suggestBin: selectedBin.code,
        suggestZone: selectedBin.zoneId, // jika ingin tampil id zone-nya
        bin_id: selectedBin.value,
      }));
    },
    [availableBins]
  );

  // 🧩 Handle Submit
  const handleSubmit = (e: React.FormEvent) => {

    console.log("Submitting form with values:", formValues);
    
    e.preventDefault();

    if (!formValues.zone_id || !formValues.bin_id) {
      alert("Please select both Zone and Bin before saving.");
      return;
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
          🧭 Adjustment Location
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Readonly fields */}
          {[
            { label: "SKU Name", value: formValues.palletCode },
            { label: "Total Quantity", value: formValues.totalQty },
            { label: "Staging Area", value: formValues.stagingArea },
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
                  label: zoneLoading ? "Loading Zones..." : "-- Select Zone --",
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
                  label: binLoading
                    ? "Loading Bins..."
                    : formValues.zone_id
                    ? "-- Select Bin --"
                    : "Select Zone first",
                },
                ...(formValues.zone_id ? availableBins : []),
              ]}
              width={"100%"}
            />
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
