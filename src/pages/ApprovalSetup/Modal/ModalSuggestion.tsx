"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FaTimes } from "react-icons/fa";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import {
  useStoreBinByZone,
  useStoreSubWarehouse,
} from "../../../DynamicAPI/stores/Store/MasterStore";
import { EndPoint } from "../../../utils/EndPoint";
import { showErrorToast } from "../../../components/toast";
import axiosInstance from "../../../DynamicAPI/AxiosInstance";

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
  const {
    detail: binList,
    fetchById: fetchBinList,
    isLoading: binLoading,
  } = useStoreBinByZone();

  const [formValues, setFormValues] = useState<AdjustmentForm>(
    data ?? defaultFormValues,
  );

  // local state untuk sub-warehouse (zone) dan loading
  const [subWarehouseList, setSubWarehouseList] = useState<any[] | null>(null);
  const [zoneLoading, setZoneLoading] = useState(false);

  // Fetch Sub Warehouse (Zone)
  const fetchSubWarehouseList = useCallback(async () => {
    setZoneLoading(true);
    try {
      const token = localStorage.getItem("token");

      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await axiosInstance.get(
        `${EndPoint}master-warehouse-sub/is-staging?is_staging=null`,
        { headers },
      );
      const json = res.data;

      const list = Array.isArray(json) ? json : (json.data ?? json);
      setSubWarehouseList(list);
    } catch (error) {
      console.error("Error fetching sub warehouses:", error);
      setSubWarehouseList([]);
    } finally {
      setZoneLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchSubWarehouseList();

      if (data) {
        // isi fallback jika suggestZone / suggestBin kosong
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
  }, [open, data, fetchSubWarehouseList]);

  // 📦 Fetch Bin berdasarkan Zone terpilih
  useEffect(() => {
    if (formValues.zone_id) {
      fetchBinList(formValues.zone_id);
    }
  }, [formValues.zone_id]);

  // 🔄 Reset form saat modal ditutup
  useEffect(() => {
    if (!open) {
      setFormValues(defaultFormValues);
    }
  }, [open]);

  // 🧠 Daftar Zone
  const availableZones = useMemo(() => {
    return (
      subWarehouseList?.map((zone: any) => ({
        value: zone.id,
        label: `${zone.name}`,
      })) ?? []
    );
  }, [subWarehouseList]);

  // 🧠 Daftar Bin
  const availableBins = useMemo(() => {
    const binsArray = Array.isArray(binList) ? binList : [];
    return binsArray.map((bin: any) => ({
      value: bin.id,
      label: `${bin.code}`,
      code: bin.code,
      zoneId: bin.warehouse_sub_id,
    }));
  }, [binList]);

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

  // 🧩 Handle Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formValues.zone_id || !formValues.bin_id) {
      showErrorToast("Please select both Zone and Bin before saving.");
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
