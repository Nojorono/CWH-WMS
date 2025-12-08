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
    reserved_quantity: number;
    week_number: number;
    production_date: string;
    location_priority?: string;
  }>;
  quantities: Record<string, number>;
  updateQty: (key: string, value: number, requiredQuantity: number) => void;
}

export const PickingRowsTable: React.FC<PickingRowsTableProps> = ({
  compactRows,
  quantities,
  updateQty,
}) => {
  const [openModalItem, modalSelectItem] = useState(false);
  const [paramItemId, setItemId] = useState<string | null>(null);

  type RowOverride = {
    week_number?: number | string;
    production_date?: string;
    zone?: string;
    bin?: string;
    remaining_quantity_needed?: number;
    qty_plan?: number;
    available_quantity?: number;
    picked_qty?: number;
    [key: string]: any; // <-- Add this index signature
  };

  const [overrides, setOverrides] = useState<Record<string, RowOverride>>({});
  const [originalQuantities, setOriginalQuantities] = useState<
    Record<string, Record<string, number>>
  >({});

  function getMaxAllowed(required?: number | null, available?: number | null) {
    const req = required == null ? Infinity : Number(required);
    const avail = available == null ? null : Number(available);
    return avail == null ? req : Math.min(req, avail);
  }

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
    setItemId(itemId);

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

    compactRows.forEach((r, idx) => {
      if (String(r.item_id) === itemIdKey) {
        const key = `${r.item_id}-${idx}`;
        const origVal = snap && key in snap ? snap[key] : 0;
        updateQty(key, Number(origVal), r.required_quantity);
      }
    });

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
    week_number: number;
    item_id: any;
    qty_pick: any;
    location_data: {
      location_priority: string;
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
    compactRows.forEach((r, idx) => {
      if (String(r.item_id) === String(data.item_id)) {
        const key = `${r.item_id}-${idx}`;
        updateQty(key, Number(data.qty_pick), r.required_quantity);
      }
    });

    const itemIdKey = String(data.item_id);
    const newOverride: RowOverride = {
      week_number:
        data.location_data.week_number ?? data.week_number ?? undefined,
      production_date: data.location_data.production_date ?? undefined,
      zone:
        data.location_data.warehouse_sub_name ??
        data.location_data.warehouse_sub_code,
      bin:
        data.location_data.bin_name ?? data.location_data.bin_code ?? undefined,

      remaining_quantity_needed: Number(data.qty_pick),
      qty_plan: Number(data.qty_pick),

      available_quantity: data.location_data.available_quantity,
      picked_qty: Number(data.qty_pick),

      reserved_quantity: Number(data.location_data.reserved_quantity),

      location_priority: data.location_data.location_priority ?? undefined,
    };

    setOverrides((prev) => ({
      ...prev,
      [itemIdKey]: { ...(prev[itemIdKey] || {}), ...newOverride },
    }));

    modalSelectItem(false);
  };

  // DYNAMIC COLUMNS CONFIG — tinggal tambah field baru di sini ⬇⬇⬇
  const columns = [
    { key: "note", label: "Notes" },
    { key: "item_name", label: "Item Name" },
    { key: "uom", label: "UOM" },
    { key: "week_number", label: "Week Number", override: true },
    { key: "production_date", label: "Production Date", override: true },
    { key: "location_priority", label: "Location Priority", override: true },
    { key: "zone", label: "Zone", override: true },
    {
      key: "bin",
      label: "Bin",
      override: true,
      customRender: (row: { bin: string }, override: { bin?: string }) => {
        const binValue = override.bin ?? row.bin;
        return binValue === "N/A" ? "" : binValue;
      },
    },
    {
      key: "remaining_quantity_needed",
      label: "Remaining Qty / Planned Qty",
      customRender: (
        row: { remaining_quantity_needed: any; qty_plan: any },
        override: { remaining_quantity_needed: any; qty_plan: any }
      ) => (
        <>
          <span className="font-semibold text-orange-700">
            {override.remaining_quantity_needed ??
              row.remaining_quantity_needed}
          </span>
          <span className="mx-1 text-gray-500">/</span>
          <span>{override.qty_plan ?? row.qty_plan}</span>
        </>
      ),
    },
    { key: "available_quantity", label: "Available Qty", override: true },
    {
      key: "reserved_quantity",
      label: "Reserved Qty",
      override: true,
    },
    {
      key: "picked_qty",
      label: "Picked Qty",
      type: "input",
    },
  ];

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
      {/* ---- TABLE HEADER ---- */}
      {compactRows.length === 0 ? (
        <div className="flex justify-center items-center py-4">
          <span>Belum ada Suggestion Location Items.</span>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 text-md">
          <thead className="bg-orange-500 text-white text-left">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2 font-semibold">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-2 font-semibold">Actions</th>
            </tr>
          </thead>

          {/* ---- TABLE BODY ---- */}
          <tbody className="text-left bg-white">
            {compactRows.map((row, i) => {
              const key = `${row.item_id}-${i}`;
              const override = overrides[String(row.item_id)] || {};

              const currentAvailable =
                override.available_quantity ?? row.available_quantity;

              return (
                <tr key={key} className="hover:bg-orange-50 border-b">
                  {columns.map((col) => {
                    const value = override[col.key] ?? (row as any)[col.key];

                    // Custom render (RemainingQty / Plan)
                    if (col.customRender) {
                      // Ensure required properties for customRender
                      const overrideForCustomRender = {
                        remaining_quantity_needed:
                          override.remaining_quantity_needed ??
                          row.remaining_quantity_needed,
                        qty_plan: override.qty_plan ?? row.qty_plan,
                      };
                      return (
                        <td key={col.key} className="px-4 py-2">
                          {col.customRender(row, overrideForCustomRender)}
                        </td>
                      );
                    }

                    // Input Editable (Picked Qty)
                    if (col.type === "input") {
                      return (
                        <td key={col.key} className="px-4 py-2">
                          {row.zone === "-" ? (
                            <span className="text-red-500 text-xs">
                              Tidak Tersedia
                            </span>
                          ) : (
                            <input
                              type="number"
                              value={
                                override.picked_qty ?? quantities[key] ?? ""
                              }
                              onChange={(e) => {
                                const requested = Number(e.target.value);
                                const { clamped } = clampPickQuantity(
                                  requested,
                                  row.required_quantity,
                                  currentAvailable
                                );

                                updateQty(key, clamped, row.required_quantity);

                                setOverrides((prev) => ({
                                  ...prev,
                                  [String(row.item_id)]: {
                                    ...(prev[String(row.item_id)] || {}),
                                    picked_qty: clamped,
                                  },
                                }));
                              }}
                              className="w-20 p-2 border border-gray-300 rounded text-center"
                            />
                          )}
                        </td>
                      );
                    }

                    // Default render
                    return (
                      <td key={col.key} className="px-4 py-2">
                        {value}
                      </td>
                    );
                  })}

                  {/* ---- ACTIONS ---- */}
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-2">
                      {!(
                        row.uom === "-" &&
                        row.zone === "-" &&
                        row.bin === "-" &&
                        row.production_date === "-" &&
                        row.location_priority === "-"
                      ) && (
                        <button
                          type="button"
                          onClick={() => handleOpenModal(row.item_id)}
                          className="p-1"
                        >
                          <FaEdit className="text-green-500" />
                        </button>
                      )}
                      {/* <button
            type="button"
            onClick={() => handleResetEdit(row.item_id)}
            className="p-1"
              >
            <FaSync className="text-red-500" />
              </button> */}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* ---- MODAL ---- */}
      {openModalItem && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 99999 }}
        >
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => modalSelectItem(false)}
          />
          <div className="relative bg-white rounded-lg shadow-lg w-[1200px] max-w-full p-4 z-10 overflow-y-auto max-h-[80vh]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">{""}</h3>
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
              onBack={() => modalSelectItem(false)}
              existingItemData={compactRows.find(
                (item) => item.item_id === paramItemId
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
};
