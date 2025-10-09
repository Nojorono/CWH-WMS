import React, { useState, useMemo } from "react";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import AddItemModal from "./AddItemModal";

interface ItemData {
  item_name: string;
  classification: string;
  qty_plan: number;
  uom: string;
  notes: string;
  itemData: [];
  classificationData: [];
  uomData: [];
}

const ItemTable: React.FC = (props: Props) => {
  const [data, setData] = useState<ItemData[]>([
    // {
    //   item_name: "CLAS MILD - 12",
    //   classification: "ROKOK",
    //   qty_plan: 1,
    //   uom: "DUS",
    //   notes: "LOREM IPSUM",
    // },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { itemData, classificationData, uomData } = props;

  const columns = useMemo(
    () => [
      {
        accessorKey: "item_name",
        header: "Item Name",
        cell: (info: any) => info.getValue(),
      },
      {
        accessorKey: "classification",
        header: "Classification",
        cell: (info: any) => info.getValue(),
      },
      {
        accessorKey: "qty_plan",
        header: "Qty Plan",
        cell: (info: any) => info.getValue(),
      },
      {
        accessorKey: "uom",
        header: "UoM",
        cell: (info: any) => info.getValue(),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: (info: any) => info.getValue(),
      },
    ],
    []
  );

  const handleAddItem = (newItem: ItemData) => {
    setData((prev) => [...prev, newItem]);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="p-4 text-lg font-semibold text-gray-800">
          Item Details
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 flex items-center gap-1"
        >
          <span className="text-lg">＋</span> Add Item
        </button>
      </div>

      <TableComponent data={data} columns={columns} pageSize={10} />

      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddItem}
        itemData={itemData}
        classificationData={classificationData}
        uomData={uomData}
      />
    </div>
  );
};

export default ItemTable;
