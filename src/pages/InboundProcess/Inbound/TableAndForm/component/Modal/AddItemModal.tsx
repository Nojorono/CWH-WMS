import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useEffect, useState } from "react";
import { classificationOptions, inputCls } from "../constants";
import { ItemForm } from "../formTypes";
import {
  useStoreItem,
  useStoreUom,
} from "../../../../../../DynamicAPI/stores/Store/MasterStore";

export default function AddItemModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ItemForm) => void;
}) {
  const { fetchAll, list } = useStoreItem();
  const { fetchAll: fetchAllUom, list: uomList } = useStoreUom();

  useEffect(() => {
    fetchAll();
    fetchAllUom();
  }, [fetchAll, fetchAllUom]);

  const [tempSku, setTempSku] = useState("");
  const [tempQty, setTempQty] = useState<number | "">("");
  const [tempClassification, setTempClassification] = useState("");
  const [tempUom, setTempUom] = useState("");

  // defaultkan UoM ke "DUS" kalau ada
  useEffect(() => {
    if (uomList.length > 0 && !tempUom) {
      const dus = uomList.find((u: any) => u.code === "DUS");
      if (dus) {
        setTempUom(dus.code);
      }
    }
  }, [uomList, tempUom]);

  const selectedMaster = list.find((m: any) => m.sku === tempSku);

  const handleSave = () => {
    if (!tempSku || !tempQty || !tempClassification || !tempUom) {
      alert("Please select SKU, Qty, UoM, and Classification");
      return;
    }

    onSave({
      item_id: selectedMaster?.id ?? "", // atau inventory_item_id sesuai kebutuhan backend
      sku: tempSku,
      item_number: selectedMaster?.item_number ?? tempSku,
      description: selectedMaster?.description ?? "",
      qty: Number(tempQty),
      uom: tempUom,
      classification: tempClassification,
      expired_date: null,
      qty_plan: function (qty_plan: any): number {
        throw new Error("Function not implemented.");
      },
      item_name: selectedMaster?.description ?? "",
    });

    // reset state
    setTempSku("");
    setTempQty("");
    setTempClassification("");
    setTempUom("DUS"); // reset default ke DUS lagi
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center">
        <DialogPanel className="bg-white rounded p-6 w-[600px] space-y-4 z-10">
          <DialogTitle className="text-xl font-semibold">Add Item</DialogTitle>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* SKU Dropdown */}
            <div>
              <label className="text-xs text-slate-600">SKU</label>
              <select
                className={inputCls}
                value={tempSku}
                onChange={(e) => setTempSku(e.target.value)}
              >
                <option value="">-- Select SKU --</option>
                {list.map((m: any) => (
                  <option key={m.sku} value={m.sku}>
                    {m.sku} - {m.item_number}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Name */}
            <div>
              <label className="text-xs text-slate-600">Item Name</label>
              <input
                className={inputCls}
                value={selectedMaster?.description ?? ""}
                readOnly
              />
            </div>

            {/* UoM Dropdown */}
            <div>
              <label className="text-xs text-slate-600">UoM</label>
              <select
                className={inputCls}
                value={tempUom}
                onChange={(e) => setTempUom(e.target.value)}
              >
                <option value="">-- Select UoM --</option>
                {uomList.map((u: any) => (
                  <option key={u.id} value={u.code}>
                    {u.code} - {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Qty */}
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

            {/* Classification */}
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

          {/* Action Buttons */}
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
