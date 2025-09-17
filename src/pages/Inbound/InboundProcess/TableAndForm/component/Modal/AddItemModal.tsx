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
import Select from "../../../../../../components/form/Select";

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
      item_id: selectedMaster?.id ?? "",
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
    setTempUom("DUS");
    onClose();
  };

  const handleCancel = () => {
    setTempSku("");
    setTempQty("");
    setTempClassification("");
    setTempUom("DUS");
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center">
        <DialogPanel className="bg-white rounded p-6 w-[500px] max-w-full space-y-4 z-10">
          <DialogTitle className="text-xl font-semibold">Add Item</DialogTitle>

          <div className="grid grid-cols-1 gap-3">
            {/* SKU Dropdown */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 font-bold mb-1">SKU</label>
              <Select
                options={list.map((m: any) => ({
                  value: m.sku,
                  label: `${m.sku}`,
                }))}
                value={tempSku}
                onChange={setTempSku}
                placeholder="-- Select SKU --"
                className="w-full"
              />
            </div>

            {/* Item Name */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 font-bold mb-1">
                Item Name
              </label>
              <input
                className={`${inputCls} w-full`}
                value={selectedMaster?.description ?? ""}
                readOnly
              />
            </div>

            {/* item_number */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 font-bold mb-1">
                Item Number
              </label>
              <input
                className={`${inputCls} w-full`}
                value={selectedMaster?.item_number ?? ""}
                readOnly
              />
            </div>

            {/* UoM Dropdown */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 font-bold mb-1">
                UoM
              </label>
              <Select
                options={uomList.map((u: any) => ({
                  value: u.code,
                  label: `${u.code}`,
                }))}
                value={tempUom}
                onChange={setTempUom}
                placeholder="-- Select UoM --"
                className="w-full"
              />
            </div>

            {/* Qty */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 font-bold mb-1">
                {" "}
                Qty Plan
              </label>
              <input
                type="number"
                className={`${inputCls} w-full`}
                value={tempQty as any}
                onChange={(e) =>
                  setTempQty(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
            </div>

            {/* Classification */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 font-bold mb-1">
                Classification
              </label>
              <Select
                options={classificationOptions}
                value={tempClassification}
                onChange={setTempClassification}
                placeholder="-- Classification --"
                className="w-full"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-10">
            <button className="border px-3 py-1 rounded" onClick={handleCancel}>
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
