import React from "react";

interface PalletItem {
  id: string;
  pallet_code: string;
  item_id: string;
  item_name: string;
  uom: string;
  week_number: number;
  current_quantity: number;
  warehouse_sub_id: string;
  warehouse_sub_name: string;
  warehouse_bin_id: string;
  warehouse_bin_name: string;
}

interface ColumnConfig {
  header: string;
  accessor?: keyof PalletItem;
  render?: (item: PalletItem) => React.ReactNode;
}

interface PalletItemsTableProps {
  palletItems: PalletItem[];
  columns: ColumnConfig[];
  getItemKey: (item: PalletItem) => string;
}

const PalletItemsTable: React.FC<PalletItemsTableProps> = ({
  palletItems,
  columns,
  getItemKey,
}) => {
  return (
    <table className="w-full border-collapse mb-10">
      <thead>
        <tr className="bg-orange-500 text-white">
          {columns.map((col, idx) => (
            <th key={idx} className="p-2 text-center">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {palletItems.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="text-center py-6 text-gray-400"
            >
              Tidak ada data
            </td>
          </tr>
        ) : (
          palletItems.map((item) => (
            <tr key={getItemKey(item)} className="border-b">
              {columns.map((col, idx) => (
                <td key={idx} className="p-3 text-center">
                  {col.render
                    ? col.render(item)
                    : col.accessor
                      ? (item[col.accessor] as any)
                      : null}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default PalletItemsTable;
