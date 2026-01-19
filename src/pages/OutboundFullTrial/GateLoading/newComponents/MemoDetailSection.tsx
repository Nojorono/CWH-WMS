import React from "react";
import SKUcard from "../newComponents/SKUcard";


// Komponen Baru untuk Section Memo
const MemoDetailSection = ({ memo, doData, onRefresh }: any) => {
  return (
    <div className="space-y-4">
      {/* Memo Header */}
      <div className="flex justify-between items-end border-b-2 border-slate-200 pb-2">
        <h2 className="text-xl font-bold text-slate-700 tracking-tight">
          {memo.memo_number}
        </h2>
        <span className="text-lg font-bold text-slate-600">
          {memo.pallets.length}/{memo.pallets.length} Pallet
        </span>
      </div>

      {/* List Pallet dalam Memo */}
      <div className="space-y-10">
        {memo.pallets.map((pallet: any) => (
          <div key={pallet.pallet_id} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-700">
                {pallet.pallet_code}
              </h3>
              <span className="text-sm font-bold text-slate-500">1/1 SKU</span>
            </div>

            {/* Grid SKU sesuai Figma */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pallet.skus.map((sku: any) => (
                <SKUcard
                  key={sku.item_id}
                  sku={sku}
                  pallet={pallet}
                  memo={memo}
                  doData={doData}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoDetailSection;
