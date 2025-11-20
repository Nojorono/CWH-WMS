import { FaEdit, FaSync } from "react-icons/fa";
import ModalInventoryItem from "../../../Modal/ModalInventoryItem";
import { useState } from "react";

interface PickingRowsTableProps {
  compactRows: Array<{
    note: string;
    item_id: string;
    item_name: string;
    uom: string;
    zone: string;
    bin: string;
    qty_plan: any;
    available_quantity: number;
    remaining_quantity_needed: number;
    required_quantity: number;
    week_number: number;
    production_date: string;
  }>;
  quantities: Record<string, number>;
  updateQty: (key: string, value: number, requiredQuantity: number) => void;
}

export const PickingRowsTable: React.FC<PickingRowsTableProps> = ({
  compactRows,
  quantities,
  updateQty,
}) => {
  console.log("PickingRowsTable compactRows:", compactRows);
  console.log("PickingRowsTable quantities:", quantities);

  const [openModalItem, modalSelectItem] = useState(false);
  const [paramItemId, setItemId] = useState<string | null>(null);

  // local overrides applied when user edits from modal
  type RowOverride = {
    week_number?: number | string;
    production_date?: string;
    zone?: string;
    bin?: string;
    remaining_quantity_needed?: number;
    qty_plan?: number;
    available_quantity?: number;
    picked_qty?: number; // new: picked qty coming from modal override
  };
  const [overrides, setOverrides] = useState<Record<string, RowOverride>>({});
  // store original quantities snapshot per item_id (before edit) => { [itemId]: { [key]: value } }
  const [originalQuantities, setOriginalQuantities] = useState<
    Record<string, Record<string, number>>
  >({});

  function getMaxAllowed(required?: number | null, available?: number | null) {
    const req = required == null ? Infinity : Number(required);
    const avail = available == null ? null : Number(available);
    return avail == null ? req : Math.min(req, avail);
  }

  /**
   * Clamp requested value ke range [0, maxAllowed], dan floor ke integer.
   */
  function clampPickQuantity(
    requested: number,
    required?: number | null,
    available?: number | null
  ) {
    const maxAllowed = getMaxAllowed(required, available);
    const raw = Number.isFinite(Number(requested))
      ? Math.floor(Number(requested))
      : 0;
    const clamped = Math.max(0, Math.min(raw, maxAllowed));
    return { clamped, maxAllowed };
  }

  const handleOpenModal = (itemId: string) => {
    console.log("Edit item with ID:", itemId);
    setItemId(itemId);

    // take snapshot of current quantities for all rows with this item_id
    const itemIdKey = String(itemId);
    const snap: Record<string, number> = {};
    compactRows.forEach((r, idx) => {
      if (String(r.item_id) === itemIdKey) {
        const key = `${r.item_id}-${idx}`;
        snap[key] = quantities[key] ?? 0;
      }
    });
    setOriginalQuantities((prev) => ({ ...prev, [itemIdKey]: snap }));

    modalSelectItem(true);
  };

  const handleResetEdit = (itemId: string) => {
    const itemIdKey = String(itemId);
    const snap = originalQuantities[itemIdKey];
    // restore all matching rows
    compactRows.forEach((r, idx) => {
      if (String(r.item_id) === itemIdKey) {
        const key = `${r.item_id}-${idx}`;
        const origVal = snap && key in snap ? snap[key] : 0;
        // call parent to restore quantity
        updateQty(key, Number(origVal), r.required_quantity);
      }
    });

    // remove local overrides for this item and snapshot
    setOverrides((prev) => {
      const copy = { ...prev };
      delete copy[itemIdKey];
      return copy;
    });
    setOriginalQuantities((prev) => {
      const copy = { ...prev };
      delete copy[itemIdKey];
      return copy;
    });
  };

  const onSubmitItemChange = (data: {
    week_number: number | undefined;
    item_id: any;
    qty_pick: any;
    location_data: {
      total_quantity: number;
      reserved_quantity: number;
      available_quantity: number;
      quantity_ready_to_pick: number;
      uom?: string;
      warehouse_name?: string;
      warehouse_sub_name?: string;
      warehouse_sub_code?: string;
      warehouse_sub_id?: string;
      bin_id?: string;
      bin_name?: string;
      bin_code?: string;
      place?: string;
      week_number?: number;
      production_date?: string;
    };
  }) => {
    console.log("Selected item data from modal:", data);

    // 1) update quantities in parent store for all matching rows (key = `${item_id}-${index}`)
    compactRows.forEach((r, idx) => {
      if (String(r.item_id) === String(data.item_id)) {
        const key = `${r.item_id}-${idx}`;
        updateQty(key, Number(data.qty_pick), r.required_quantity);
      }
    });

    // 2) apply local overrides so the table shows updated week/production/zone/bin
    const itemIdKey = String(data.item_id);
    const newOverride: RowOverride = {
      week_number:
        data.location_data.week_number ?? data.week_number ?? undefined,
      production_date: data.location_data.production_date ?? undefined,
      zone:
        data.location_data.warehouse_sub_name ??
        data.location_data.place ??
        undefined,
      bin:
        data.location_data.bin_name ?? data.location_data.bin_code ?? undefined,
      // override remaining and plan to reflect qty_pick from modal
      remaining_quantity_needed: Number(data.qty_pick),
      qty_plan: Number(data.qty_pick),
      // keep available from location_data so max clamp uses updated availability
      available_quantity: data.location_data.available_quantity,
      // store picked qty so input shows modal value immediately
      picked_qty: Number(data.qty_pick),
    };
    setOverrides((prev) => ({
      ...prev,
      [itemIdKey]: { ...(prev[itemIdKey] || {}), ...newOverride },
    }));

    modalSelectItem(false);
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
      <table className="min-w-full divide-y divide-gray-200 text-md">
        <thead className="bg-orange-500 text-white text-left">
          <tr>
            <th className="px-4 py-2 font-semibold">Notes</th>
            <th className="px-4 py-2 font-semibold">Item Name</th>
            <th className="px-4 py-2 font-semibold">UOM</th>
            <th className="px-4 py-2 font-semibold">Week Number</th>
            <th className="px-4 py-2 font-semibold">Production Date</th>
            <th className="px-4 py-2 font-semibold">Zone</th>
            <th className="px-4 py-2 font-semibold">Bin</th>
            <th className="px-4 py-2 font-semibold">
              Remaining Qty / Planned Qty
            </th>
            <th className="px-4 py-2 font-semibold">Available Qty</th>
            <th className="px-4 py-2 font-semibold">Picked Qty</th>
            <th className="px-4 py-2 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="text-left bg-white">
          {compactRows.map((row, i) => {
            const key = `${row.item_id}-${i}`;
            const override = overrides[String(row.item_id)] || {};
            // use overrides if present
            const currentRemaining =
              override.remaining_quantity_needed ??
              row.remaining_quantity_needed;
            const currentPlan = override.qty_plan ?? row.qty_plan;
            const currentAvailable =
              override.available_quantity ?? row.available_quantity;
            const maxAllowedForRow = getMaxAllowed(
              currentRemaining,
              currentAvailable
            );
            return (
              <tr key={key} className="hover:bg-orange-50 border-b">
                <td className="px-4 py-2">{row.note}</td>
                <td className="px-4 py-2 font-medium">{row.item_name}</td>
                <td className="px-4 py-2">{row.uom}</td>
                <td className="px-4 py-2">
                  {override.week_number ?? row.week_number}
                </td>
                <td className="px-4 py-2">
                  {override.production_date ?? row.production_date}
                </td>
                <td className="px-4 py-2">{override.zone ?? row.zone}</td>
                <td className="px-4 py-2">{override.bin ?? row.bin}</td>
                <td className="px-4 py-2">
                  <span className="font-semibold text-orange-700">
                    {currentRemaining}
                  </span>
                  <span className="mx-1 text-gray-500">/</span>
                  <span>{currentPlan}</span>
                </td>
                <td className="px-4 py-2">
                  <span className="font-semibold text-green-700">
                    {currentAvailable}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {row.zone === "-" ? (
                    <span className="text-red-500 text-xs">Tidak Tersedia</span>
                  ) : (
                    <input
                      type="number"
                      value={override.picked_qty ?? quantities[key] ?? 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const requested = Number(e.target.value);
                        const { clamped } = clampPickQuantity(
                          requested,
                          row.required_quantity,
                          currentAvailable
                        );
                        // update parent state
                        updateQty(key, clamped, row.required_quantity);
                        // reflect immediate change locally (keeps UI stable until parent updates)
                        setOverrides((prev) => ({
                          ...prev,
                          [String(row.item_id)]: {
                            ...(prev[String(row.item_id)] || {}),
                            picked_qty: clamped,
                          },
                        }));
                      }}
                      min={0}
                      max={
                        Number.isFinite(maxAllowedForRow)
                          ? maxAllowedForRow
                          : undefined
                      }
                      className="w-20 p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-orange-300 text-center"
                      style={{ fontSize: "1rem" }}
                    />
                  )}
                </td>

                <td className="px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(row.item_id)}
                      title="Edit item details"
                      aria-label="Edit item"
                      className="p-1 rounded hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-200"
                    >
                      <FaEdit className="text-green-500 hover:text-green-700" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResetEdit(row.item_id)}
                      title="Reset edits for this item"
                      aria-label="Reset edits"
                      className="p-1 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      <FaSync className="text-red-500 hover:text-red-700" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {openModalItem && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 99999 }}
        >
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => modalSelectItem(false)}
          />
          <div className="relative bg-white rounded-lg shadow-lg w-[640px] max-w-full p-4 z-10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Assign Helper</h3>
              <button
                className="text-gray-500"
                onClick={() => modalSelectItem(false)}
              >
                Close
              </button>
            </div>

            <ModalInventoryItem
              itemID={paramItemId}
              onSubmit={onSubmitItemChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};
