import React from "react";
import CardBase from "./CardBase";
import PalletVisibilityCard from "./PalletVisibilityCard";
import { DoGateVisibility } from "../helper/mapDOGateVisibility";
import Button from "../../../../components/ui/button/Button";
import { FaChevronRight, FaChevronUp } from "react-icons/fa";

interface Props {
  data: DoGateVisibility;
  expanded: boolean;
  onToggle: (doId: string) => void;
}

const DoVisibilityCard: React.FC<Props> = ({ data, expanded, onToggle }) => {
  return (
    <CardBase
      title={`${data.do_number}`}
      subtitle={`${data.summary.total_memo} Memo • ${data.summary.total_pallet} Pallet • ${data.summary.total_sku} SKU`}
      right={
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs rounded-full font-semibold ${
              data.flags.ready_to_load
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {data.flags.ready_to_load ? "READY TO LOAD" : "HOLD"}
          </span>

          <button
            onClick={() => onToggle(data.do_id)}
            className="text-gray-500 hover:text-gray-700"
          >
            {expanded ? (
              <FaChevronUp size={18} />
            ) : (
              <FaChevronRight size={18} />
            )}
          </button>
        </div>
      }
    >
      {/* EXPANDABLE CONTENT */}
      {expanded && (
        <>
          <div className="space-y-4">
            {data.memos.map((memo) => (
              <div
                key={memo.memo_id}
                className="border rounded-lg p-3 bg-gray-50"
              >
                <div className="flex justify-between items-center mb-3">
                  <p className="font-medium text-sm">Memo {memo.memo_number}</p>
                  <span className="text-xs px-2 py-0.5 rounded bg-white border">
                    {memo.memo_status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {memo.pallets.map((pallet) => (
                    <PalletVisibilityCard
                      key={pallet.pallet_id}
                      data={pallet}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="action" disabled={!data.flags.ready_to_load}>
              Confirm
            </Button>

            {!data.flags.ready_to_load && (
              <p className="text-xs text-red-600 mt-2">
                ❗ Pastikan semua pallet ter-assign gate dan sudah approved
              </p>
            )}
          </div>
        </>
      )}
    </CardBase>
  );
};

export default DoVisibilityCard;
