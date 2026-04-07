import React, { useState, useEffect } from "react"; // 1. Tambahkan useEffect
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { FaTimes, FaRocket } from "react-icons/fa";
import { showSuccessToast, showErrorToast } from "../../../../components/toast";
import Button from "../../../../components/ui/button/Button";
import { EndPoint } from "../../../../utils/EndPoint";

interface GeneratePalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizations: any[];
  uoms: any[];
}

// Definisikan nilai awal di luar komponen agar bisa dipakai berulang kali
const initialFormState = {
  prefix: "PAL-",
  start: 1,
  end: 10,
  padding: 4,
  organization_id: "",
  capacity: 100,
  isActive: true,
  uom: "PCS",
};

const GeneratePalletModal: React.FC<GeneratePalletModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  organizations,
  uoms,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  // 2. Logic Reset Form saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormState);
      setLoading(false); // Pastikan loading juga reset
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "isActive" ? value === "true" : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      start: Number(formData.start),
      end: Number(formData.end),
      padding: Number(formData.padding),
      organization_id: Number(formData.organization_id),
      capacity: Number(formData.capacity),
    };

    try {
      await axiosInstance.post(
        `${EndPoint}master-pallet/generate-range`,
        payload,
      );
      showSuccessToast(
        `Berhasil generate pallet dari ${formData.start} sampai ${formData.end}`,
      );
      onSuccess();
      onClose(); // Ini akan men-trigger useEffect untuk reset form
    } catch (error: any) {
      showErrorToast(error.response?.data?.message || "Gagal generate pallet");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm";
  const labelClass =
    "block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FaRocket className="text-blue-600" /> Bulk Generate Pallet
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organization */}
            <div className="md:col-span-2">
              <label className={labelClass}>Organization</label>
              <select
                name="organization_id"
                required
                value={formData.organization_id}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">-- Select Organization --</option>
                {organizations.map((org) => (
                  <option key={org.organization_id} value={org.organization_id}>
                    {org.organization_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Prefix */}
            <div>
              <label className={labelClass}>Prefix</label>
              <input
                name="prefix"
                type="text"
                value={formData.prefix}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            {/* Padding */}
            <div>
              <label className={labelClass}>Digit Padding</label>
              <input
                name="padding"
                type="number"
                value={formData.padding}
                onChange={handleChange}
                className={inputClass}
                min="1"
                required
              />
            </div>

            {/* Start */}
            <div>
              <label className={labelClass}>Start Number</label>
              <input
                name="start"
                type="number"
                value={formData.start}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            {/* End */}
            <div>
              <label className={labelClass}>End Number</label>
              <input
                name="end"
                type="number"
                value={formData.end}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            {/* Capacity */}
            <div>
              <label className={labelClass}>Capacity</label>
              <input
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            {/* UOM */}
            <div>
              <label className={labelClass}>UOM</label>
              <select
                name="uom"
                value={formData.uom}
                onChange={handleChange}
                className={inputClass}
                required
              >
                {uoms.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* IsActive */}
            <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <label className={labelClass}>Status Active</label>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="radio"
                    name="isActive"
                    value="true"
                    checked={formData.isActive === true}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  Yes, Active
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="radio"
                    name="isActive"
                    value="false"
                    checked={formData.isActive === false}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  No, Inactive
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="danger"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Generating..." : "Confirm & Generate"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneratePalletModal;