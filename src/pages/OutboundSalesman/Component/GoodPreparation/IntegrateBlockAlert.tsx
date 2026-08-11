import React from "react";
import { FaLock, FaWarehouse } from "react-icons/fa";

type IntegrateBlockAlertProps = {
  spbNumbers: string[];
  onSelectSpb?: (spbNumber: string) => void;
};

export const IntegrateBlockAlert = ({
  spbNumbers,
  onSelectSpb,
}: IntegrateBlockAlertProps) => {
  if (!spbNumbers.length) return null;

  return (
    <div className="w-full rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50 px-4 py-3 shadow-sm ring-1 ring-amber-100">
      <div className="flex flex-wrap items-start gap-3">
        <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
          <FaLock size={13} />
        </div>
        <div className="min-w-[220px] flex-1">
          <p className="text-xs font-bold tracking-wide text-amber-900 uppercase">
            Integrate Meta Sementara Dikunci
          </p>
          <p className="mt-0.5 text-xs text-amber-800">
            Ada SPB dengan Qty SPB lebih besar dari SOH. User perlu menyesuaikan
            Qty SPB pada dokumen berikut:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {spbNumbers.map((spb) => (
              <button
                type="button"
                key={spb}
                onClick={() => onSelectSpb?.(spb)}
                className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-amber-900 shadow-xs"
              >
                <FaWarehouse size={10} className="text-amber-600" />
                {spb}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

