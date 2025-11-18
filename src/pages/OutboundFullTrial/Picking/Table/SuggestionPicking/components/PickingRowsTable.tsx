import { FaEdit, FaRegEdit } from "react-icons/fa";

interface PickingRowsTableProps {
  compactRows: Array<{
    note: string;
    item_id: string;
    item_name: string;
    uom: string;
    production_code: string;
    zone: string;
    bin: string;
    qty_plan: any;
    available_quantity: number;
    remaining_quantity_needed: number;
    required_quantity: number;
  }>;
  quantities: Record<string, number>;
  updateQty: (key: string, value: number, requiredQuantity: number) => void;
}

export const PickingRowsTable: React.FC<PickingRowsTableProps> = ({
  compactRows,
  quantities,
  updateQty,
}) => {
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

  const handleEdit = (itemId: string) => {
    console.log("Edit item with ID:", itemId);
  };  

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
      <table className="min-w-full divide-y divide-gray-200 text-md">
        <thead className="bg-orange-500 text-white text-left">
          <tr>
            <th className="px-4 py-2 font-semibold">Notes</th>
            <th className="px-4 py-2 font-semibold">Item Name</th>
            <th className="px-4 py-2 font-semibold">UOM</th>
            <th className="px-4 py-2 font-semibold">Production Code</th>
            <th className="px-4 py-2 font-semibold">Zone</th>
            <th className="px-4 py-2 font-semibold">Bin</th>
            <th className="px-4 py-2 font-semibold">Remaining Qty / Planned Qty</th>
            <th className="px-4 py-2 font-semibold">Available Qty</th>
            <th className="px-4 py-2 font-semibold">Picked Qty</th>
            <th className="px-4 py-2 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="text-left bg-white">
          {compactRows.map((row, i) => {
            const key = `${row.item_id}-${i}`;
            const maxAllowedForRow = getMaxAllowed(
              // row.required_quantity,
              row.remaining_quantity_needed,
              row.available_quantity
            );
            return (
              <tr key={key} className="hover:bg-orange-50 border-b">
                <td className="px-4 py-2">{row.note}</td>
                <td className="px-4 py-2 font-medium">{row.item_name}</td>
                <td className="px-4 py-2">{row.uom}</td>
                <td className="px-4 py-2">{row.production_code}</td>
                <td className="px-4 py-2">{row.zone}</td>
                <td className="px-4 py-2">{row.bin}</td>
                <td className="px-4 py-2">
                  <span className="font-semibold text-orange-700">
                    {row.remaining_quantity_needed}
                  </span>
                  <span className="mx-1 text-gray-500">/</span>
                  <span>{row.qty_plan}</span>
                </td>
                <td className="px-4 py-2">
                  <span className="font-semibold text-green-700">
                    {row.available_quantity}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {row.zone === "-" ? (
                    <span className="text-red-500 text-xs">Tidak Tersedia</span>
                  ) : (
                    <input
                      type="number"
                      value={quantities[key] ?? 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const requested = Number(e.target.value);
                        const { clamped } = clampPickQuantity(
                          requested,
                          row.required_quantity,
                          row.available_quantity
                        );
                        updateQty(key, clamped, row.required_quantity);
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
                  <button
                    onClick={() => handleEdit(row.item_id)}
                    className="flex items-center gap-2 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded transition"
                  >
                    <FaEdit />
                    <span className="text-sm">Edit</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
