import React from "react";
import CardBase from "./CardBase";
import { mapPalletGateVisibility } from "../helper/mapPalletGateVisibility";

interface Props {
  data: ReturnType<typeof mapPalletGateVisibility>;
}

const PalletVisibilityCard: React.FC<Props> = ({ data }) => {
  return (
    <CardBase
      title={`Pallet ${data.pallet_code}`}
      subtitle={`${data.total_qty} ${data.uom}`}
      right={
        <span
          className={`px-2 py-1 text-xs rounded-full font-semibold ${
            data.flags.ready_to_load
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {data.flags.ready_to_load ? "READY" : "HOLD"}
        </span>
      }
    >
      <div className="grid grid-cols-3 gap-3 text-sm mb-3">
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-gray-500">SKU</p>
          <p className="font-semibold">{data.summary.total_sku}</p>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-gray-500">Memo</p>
          <p className="font-semibold">{data.summary.total_memo}</p>
        </div>
      </div>

      {data.memo_breakdown.map((memo) => (
        <div key={memo.memo_id} className="border rounded p-2 mb-2">
          <div className="flex justify-between mb-1">
            <p className="text-sm font-medium">{memo.memo_number}</p>
            <span className="text-xs">{memo.memo_status}</span>
          </div>

          <table className="w-full text-xs">
            <tbody>
              {memo.items.map((item) => (
                <tr key={item.item_id}>
                  <td>{item.item_name}</td>
                  <td className="text-right">
                    {item.qty} {item.uom}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </CardBase>
  );
};

export default PalletVisibilityCard;
