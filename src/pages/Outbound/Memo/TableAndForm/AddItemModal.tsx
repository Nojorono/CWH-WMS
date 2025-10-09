import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: {
    item_name: string;
    classification: string;
    qty_plan: number;
    uom: string;
    notes: string;
  }) => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [itemName, setItemName] = useState("");
  const [classification, setClassification] = useState("");
  const [qtyPlan, setQtyPlan] = useState<number>(0);
  const [uom, setUom] = useState("DUS");
  const [notes, setNotes] = useState("");

  // Dummy data
  const itemOptions = [
    "CLAS MILD - 12",
    "CLAS MILD - 16",
    "CLAS MILD REDMAX - 16",
  ];
  const classificationOptions = ["ROKOK", "RYO"];
  const uomOptions = ["PACK", "DUS", "CARTON"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !classification || qtyPlan <= 0) return;

    onSubmit({
      item_name: itemName,
      classification,
      qty_plan: qtyPlan,
      uom,
      notes,
    });

    // reset form
    setItemName("");
    setClassification("");
    setQtyPlan(0);
    setUom("DUS");
    setNotes("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/20 z-50">
      <div className="relative bg-white p-6 rounded-lg w-[400px] shadow-lg border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-orange-500 transition"
          type="button"
          aria-label="Close"
        >
          <FaTimes size={18} />
        </button>

        <h3 className="text-xl font-semibold mb-4 text-orange-600">Add Item</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Item Name</label>
            <select
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full border rounded px-2 py-1 mt-1"
              required
            >
              <option value="">Select Item</option>
              {itemOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Classification</label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              className="w-full border rounded px-2 py-1 mt-1"
              required
            >
              <option value="">Select Classification</option>
              {classificationOptions.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium">Qty</label>
              <input
                type="number"
                value={qtyPlan}
                onChange={(e) => setQtyPlan(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 mt-1"
                placeholder="Qty"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">UoM</label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full border rounded px-2 py-1 mt-1"
              >
                <option value="">Select UoM</option>
                {uomOptions.map((uom) => (
                  <option key={uom} value={uom}>
                    {uom}
                  </option>
                ))}
                <option value="PACK">PACK</option>
                <option value="PCS">PCS</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-2 py-1 mt-1"
              placeholder="Notes"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="border border-orange-500 text-orange-500 px-4 py-1 rounded hover:bg-orange-50 transition"
            >
              Back
            </button>
            <button
              type="submit"
              className="bg-orange-500 text-white px-4 py-1 rounded hover:bg-orange-600 transition"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
