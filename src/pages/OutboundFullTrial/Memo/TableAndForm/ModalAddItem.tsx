import React, { useEffect, useState } from "react";
import Button from "../../../../components/ui/button/Button";
import {
  useStoreItem,
  useStoreUom,
  useStoreClassification,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import Select from "../../../../components/form/Select";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: any) => void;
};

const ModalAddItem: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const { fetchAll, list } = useStoreItem();
  const { fetchAll: fetchAllUom, list: uomList } = useStoreUom();
  const { fetchAll: fetchAllClassification, list: classificationList } =
    useStoreClassification();

  useEffect(() => {
    fetchAll();
    fetchAllUom();
    fetchAllClassification();
  }, []);

  const [selectedSku, setSelectedSku] = useState("");
  const [selectedUom, setSelectedUom] = useState("");
  const [selectedClassification, setSelectedClassification] = useState("");
  const [qty, setQty] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Temukan item yang dipilih berdasarkan SKU
  const selectedItem = list.find((i: any) => i.sku === selectedSku);

  // Defaultkan UOM ke DUS kalau ada
  useEffect(() => {
    if (uomList.length > 0 && !selectedUom) {
      const dus = uomList.find((u: any) => u.code === "DUS");
      if (dus) setSelectedUom(dus.code);
    }
  }, [uomList, selectedUom]);

  if (!open) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedSku) newErrors.sku = "SKU wajib dipilih";
    if (!qty || qty <= 0) newErrors.qty = "Qty harus lebih besar dari 0";
    if (!selectedUom) newErrors.uom = "UOM wajib dipilih";
    if (!selectedClassification)
      newErrors.classification = "Classification wajib dipilih";
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    const itemData = {
      item_id: selectedItem?.id ?? "",
      sku: selectedItem?.sku ?? "",
      item_number: selectedItem?.item_number ?? "",
      item_name: selectedItem?.description ?? "",
      quantity_plan: Number(qty),
      uom_id: selectedUom,
      uom_name: uomList.find((u: any) => u.id === selectedUom)?.code || "",
      classification_id: selectedClassification,
      classification_name:
        classificationList.find((c: any) => c.id === selectedClassification)
          ?.classification_name || "",
      notes,
    };

    onSubmit(itemData);
    onClose();

    // Reset form
    setSelectedSku("");
    setSelectedUom("");
    setSelectedClassification("");
    setQty("");
    setNotes("");
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl shadow-lg w-[450px] p-6 space-y-4 relative z-[10000]">
        <h2 className="text-xl font-bold text-indigo-800">Add Item</h2>

        <div className="space-y-3">
          {/* SKU Dropdown */}
          <div>
            <label className="block text-sm font-medium">SKU</label>

            <Select
              options={list.map((s: any) => ({
                value: s.sku,
                label: s.sku,
              }))}
              value={selectedSku}
              onChange={(val) => setSelectedSku(val)}
              placeholder="-- Select SKU --"
              className="w-full"
              width={"100%"}
            />

            {errors.sku && (
              <p className="text-xs text-red-500 mt-1">{errors.sku}</p>
            )}
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium">Item Name</label>
            <input
              className="border rounded p-2 w-full bg-gray-100"
              value={selectedItem?.description ?? ""}
              readOnly
            />
          </div>

          {/* Item Number */}
          <div>
            <label className="block text-sm font-medium">Item Number</label>
            <input
              className="border rounded p-2 w-full bg-gray-100"
              value={selectedItem?.item_number ?? ""}
              readOnly
            />
          </div>

          {/* UOM Dropdown */}
          <div>
            <label className="block text-sm font-medium">UoM</label>
            <Select
              options={uomList.map((u: any) => ({
                value: u.id,
                label: u.code,
              }))}
              value={selectedUom}
              onChange={(val) => setSelectedUom(val)}
              placeholder="-- Select UOM --"
              className="w-full"
              width={"100%"}
            />
            {errors.uom && (
              <p className="text-xs text-red-500 mt-1">{errors.uom}</p>
            )}
          </div>

          {/* Qty */}
          <div>
            <label className="block text-sm font-medium">Qty Plan</label>
            <input
              type="number"
              value={qty}
              onChange={(e) =>
                setQty(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="Masukkan qty"
              className="border rounded p-2 w-full"
            />
            {errors.qty && (
              <p className="text-xs text-red-500 mt-1">{errors.qty}</p>
            )}
          </div>

          {/* Classification Dropdown */}
          <div>
            <label className="block text-sm font-medium">Classification</label>
            <Select
              options={classificationList.map((c: any) => ({
                value: c.id,
                label: c.classification_name,
              }))}
              value={selectedClassification}
              onChange={(val) => setSelectedClassification(val)}
              placeholder="-- Select Classification --"
              className="w-full"
              width={"100%"}
            />
            {errors.classification && (
              <p className="text-xs text-red-500 mt-1">
                {errors.classification}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border rounded p-2 w-full"
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalAddItem;
