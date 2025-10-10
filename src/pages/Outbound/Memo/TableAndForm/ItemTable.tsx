import React, { useEffect, useState, useMemo } from "react";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import AddItemModal from "./AddItemModal";

interface ItemData {
  id: string;
  quantity_plan: string;
  uom: string;
  itemData: [];
  classificationData: [];
  uomData: [];
}

const ItemTable: React.FC = (props: Props) => {
  const [data, setData] = useState<ItemData[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { detail, itemData, classificationData, uomData } = props;

  useEffect(() => {
    setData(detail.outbound_memo_items);
  }, [detail]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "item.sku",
        header: "Item Name",
        cell: (info: any) => info.getValue(),
      },
      {
        accessorKey: "",
        header: "Classification",
        cell: (info: any) => info.getValue(),
      },
      {
        accessorKey: "quantity_plan",
        header: "Qty Plan",
        cell: (info: any) => info.getValue(),
      },
      {
        accessorKey: "uom",
        header: "UoM",
        cell: (info: any) => info.getValue(),
      },
      {
        accessorKey: "item.description",
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
