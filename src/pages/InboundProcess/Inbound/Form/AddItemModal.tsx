import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";
import { masterItems, classificationOptions, inputCls } from "./constants";
import { ItemForm } from "./formTypes";

export default function AddItemModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ItemForm) => void;
}) {
  const [tempSku, setTempSku] = useState("");
  const [tempQty, setTempQty] = useState<number | "">("");
  const [tempClassification, setTempClassification] = useState("");

  const selectedMaster = masterItems.find((m) => m.sku === tempSku);

  const handleSave = () => {
    if (!tempSku || !tempQty || !tempClassification) {
      alert("Please select SKU, Qty, and Classification");
      return;
    }
    onSave({
      item_id: selectedMaster?.item_id ?? "",
      sku: tempSku,
      item_number: selectedMaster?.item_number ?? tempSku,
      description: selectedMaster?.description ?? "",
      qty: Number(tempQty),
      uom: selectedMaster?.uom ?? "",
      classification: tempClassification,
      expired_date: null,
      qty_plan: function (qty_plan: any): number {
        throw new Error("Function not implemented.");
      },
      item_name: "",
    });
    setTempSku("");
    setTempQty("");
    setTempClassification("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center">
        <DialogPanel className="bg-white rounded p-6 w-[600px] space-y-4 z-10">
          <DialogTitle className="text-xl font-semibold">Add Item</DialogTitle>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-600">SKU</label>
              <select
                className={inputCls}
                value={tempSku}
                onChange={(e) => setTempSku(e.target.value)}
              >
                <option value="">-- Select SKU --</option>
                {masterItems.map((m) => (
                  <option key={m.sku} value={m.sku}>
                    {m.sku} - {m.item_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600">Item Name</label>
              <input
                className={inputCls}
                value={selectedMaster?.description ?? ""}
                readOnly
              />
            </div>

            <div>
              <label className="text-xs text-slate-600">UoM</label>
              <input
                className={inputCls}
                value={selectedMaster?.uom ?? ""}
                readOnly
              />
            </div>

            <div>
              <label className="text-xs text-slate-600">Qty Plan</label>
              <input
                type="number"
                className={inputCls}
                value={tempQty as any}
                onChange={(e) =>
                  setTempQty(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
            </div>

            <div>
              <label className="text-xs text-slate-600">Classification</label>
              <select
                className={inputCls}
                value={tempClassification}
                onChange={(e) => setTempClassification(e.target.value)}
              >
                <option value="">--</option>
                {classificationOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button className="border px-3 py-1 rounded" onClick={onClose}>
              Cancel
            </button>
            <button
              className="bg-orange-500 text-white px-3 py-1 rounded"
              onClick={handleSave}
            >
              Save Item
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
