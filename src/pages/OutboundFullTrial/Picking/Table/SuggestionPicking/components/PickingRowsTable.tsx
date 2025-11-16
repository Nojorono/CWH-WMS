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
  return (
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-orange-500 text-white text-left">
        <tr>
          <th className="px-2 py-1">Notes</th>
          <th className="px-2 py-1">Item Name</th>
          <th className="px-2 py-1">UOM</th>
          <th className="px-2 py-1">Production Code</th>
          <th className="px-2 py-1">Zone</th>
          <th className="px-2 py-1">Bin</th>
          <th className="px-2 py-1">Planned Qty</th>
          <th className="px-2 py-1">Available Qty</th>
          <th className="px-2 py-1">Quantity to Pick</th>
        </tr>
      </thead>

      <tbody className="text-left">
        {compactRows.map((row, i) => {
          const key = `${row.item_id}-${i}`;
          const maxAllowedForRow = getMaxAllowed(
            row.required_quantity,
            row.available_quantity
          );
          return (
            <tr key={key} className="hover:bg-gray-50">
              <td className="px-2 py-1">{row.note}</td>
              <td className="px-2 py-1">{row.item_name}</td>
              <td className="px-2 py-1">{row.uom}</td>
              <td className="px-2 py-1">{row.production_code}</td>
              <td className="px-2 py-1">{row.zone}</td>
              <td className="px-2 py-1">{row.bin}</td>
              <td className="px-2 py-1">{row.qty_plan}</td>
              <td className="px-2 py-1">{row.available_quantity}</td>

              {/* qty input */}
              <td className="px-2 py-1">
                {row.zone === "-" ? (
                  <span className="text-red-500 text-xs">Not Available</span>
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
                    className="w-16 p-1 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-orange-300"
                  />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
