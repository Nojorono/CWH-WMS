import React, { useState } from "react";
import { FaEdit } from "react-icons/fa";
import Button from "../../../../components/ui/button/Button";
// import Modal from "../../../../components/modal/type/"; // Jika belum ada, nanti bisa buat manual

type AdjustmentForm = {
  palletId: string;
  skuName: string;
  productionCode: string;
  totalQty: number;
  stagingArea: string;
  suggestZone: string;
  suggestBin: string;
};

const AdjustmentModal: React.FC<{
  open: boolean;
  onClose: () => void;
  data: AdjustmentForm | null;
  onSave: (updated: AdjustmentForm) => void;
}> = ({ open, onClose, data, onSave }) => {
  const [form, setForm] = useState<AdjustmentForm | null>(data);

  if (!open || !form) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSubmit = () => {
    console.log("Saved data:", form);
    onSave(form);
    onClose();
  };

  return (
    <>Modal Here</>
    // <Modal open={open} onClose={onClose}>
    //   <div className="bg-white rounded-lg p-6 space-y-4 w-[500px]">
    //     <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
    //       🏗️ Adjustment Location
    //     </h2>

    //     <div className="space-y-3">
    //       <div>
    //         <label className="block text-sm">Pallet ID</label>
    //         <input className="w-full border rounded p-2 bg-gray-100" value={form.palletId} disabled />
    //       </div>

    //       <div>
    //         <label className="block text-sm">SKU Name</label>
    //         <input className="w-full border rounded p-2 bg-gray-100" value={form.skuName} disabled />
    //       </div>

    //       <div>
    //         <label className="block text-sm">Production Code</label>
    //         <input className="w-full border rounded p-2 bg-gray-100" value={form.productionCode} disabled />
    //       </div>

    //       <div>
    //         <label className="block text-sm">Total Quantity</label>
    //         <input className="w-full border rounded p-2 bg-gray-100" value={form.totalQty} disabled />
    //       </div>

    //       <div>
    //         <label className="block text-sm">Staging Area</label>
    //         <input className="w-full border rounded p-2 bg-gray-100" value={form.stagingArea} disabled />
    //       </div>

    //       <div>
    //         <label className="block text-sm">Suggest Zone</label>
    //         <select
    //           name="suggestZone"
    //           value={form.suggestZone}
    //           onChange={handleChange}
    //           className="w-full border rounded p-2"
    //         >
    //           <option value="JT1">JT1</option>
    //           <option value="JT2">JT2</option>
    //           <option value="JT3">JT3</option>
    //         </select>
    //       </div>

    //       <div>
    //         <label className="block text-sm">Suggest Bin</label>
    //         <select
    //           name="suggestBin"
    //           value={form.suggestBin}
    //           onChange={handleChange}
    //           className="w-full border rounded p-2"
    //         >
    //           <option value="A">A</option>
    //           <option value="B">B</option>
    //           <option value="C">C</option>
    //         </select>
    //       </div>
    //     </div>

    //     <div className="flex justify-end gap-2 pt-4">
    //       <Button variant="secondary" onClick={onClose}>
    //         Back
    //       </Button>
    //       <Button variant="primary" onClick={handleSubmit}>
    //         Save
    //       </Button>
    //     </div>
    //   </div>
    // </Modal>
  );
};

export default AdjustmentModal;
