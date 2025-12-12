import React, { useState, useEffect } from "react";
import { FaCheck, FaEdit, FaPlus } from "react-icons/fa";
import TableComponent from "../Table/TableComponent";
import { ColumnDef } from "@tanstack/react-table";
import ModalInventoryItemModal from "../Modal/ModalSelectItemLocation";
import { useStoreTransactionPicking } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast } from "../../../../components/toast";
import Button from "../../../../components/ui/button/Button";
import { useNavigate } from "react-router-dom";

interface SuggestedLocation {
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  quantity_ready_to_pick: number;
  uom: string;
  warehouse_name: string;
  warehouse_sub_name: string;
  warehouse_sub_code: string;
  warehouse_sub_id: string;
  bin_id: string;
  bin_name: string;
  bin_code: string;
  search_level: string;
  location_type: string;
  location_priority: number;
  week_number: number;
  production_date: string;
  place: string;
}

interface Item {
  memo_id: string;
  item_id: string;
  item_name: string;
  item_code: string;
  required_quantity: number;
  already_picked_quantity: number;
  remaining_quantity_needed: number;
  suggested_locations: SuggestedLocation[];
  total_suggested_quantity: number;
  priority: number;
  notes: string;
  qty_pick?: number; // Added qty_pick property
  week_number?: number; // Added week_number property
}

interface TableProps {
  items: Item[];
  onAdd: (data: any) => void;
  onEdit: (data: Item) => void;
  destinationZoneId: string;
  destinationBinId: string;
  DOid: string | null;
}

export const SuggestionItemsTable: React.FC<TableProps> = ({
  items,
  onAdd,
  onEdit,
  destinationZoneId,
  destinationBinId,
  DOid,
}) => {
  const navigate = useNavigate();
  const [localItems, setLocalItems] = useState<Item[]>(items);
  const [openEdit, setOpenEdit] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const { createBulkData } = useStoreTransactionPicking();

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleEditClick = (item: Item, rowIndex: number) => {
    setSelectedItem(item);
    setOpenEdit(true);
    setSelectedRowIndex(rowIndex);
  };

  const handleAddClick = (itemId: string) => {
    console.log("Handle add click for item ID:", itemId);

    setSelectedItem({ item_id: itemId } as Item);
    setOpenAdd(true);
  };

  const handleAddItem = (data: any) => {
    const newItem: Item = {
      memo_id: data.memo_id,
      item_id: data.item_id,
      item_name: data.item_name,
      item_code: data.item_code,
      required_quantity: parseInt(data.qty_pick),
      already_picked_quantity: 0,
      remaining_quantity_needed: parseInt(data.qty_pick),
      suggested_locations: [data.location_data],
      total_suggested_quantity: parseInt(data.qty_pick),
      priority: 1,
      notes: "Suggestion item location ditambahkan secara manual oleh user.",
    };

    setLocalItems((prevItems) => [...prevItems, newItem]);
    setOpenAdd(false);
    onAdd(newItem);
  };

  // Update onEdit to include qty_pick
  const handleEditItem = (data: any) => {
    console.log("Handle edit item with data:", data);

    const updatedItem: Item = {
      ...selectedItem!,
      qty_pick: parseInt(data.qty_pick), // Update qty_pick
      week_number: parseInt(data.week_number), // Update week_number
      suggested_locations: selectedItem!.suggested_locations.map(
        (location, index) => {
          return {
            ...location,
            // Gunakan data dari location_data untuk memperbarui lokasi
            bin_id: data.location_data.bin_id, // Update bin_id
            bin_name: data.location_data.bin_name, // Update bin_name
            bin_code: data.location_data.bin_code, // Update bin_code
            week_number: parseInt(data.week_number), // Update week_number
            warehouse_sub_id: data.location_data.warehouse_sub_id, // Update warehouse_sub_id
            warehouse_sub_name: data.location_data.warehouse_sub_name, // Update warehouse_sub_name
            warehouse_sub_code: data.location_data.warehouse_sub_code, // Update warehouse_sub_code
            place: data.location_data.place, // Update place
          };
        }
      ),
    };

    // Update localItems dengan item yang baru
    setLocalItems((prev) => {
      const copy = [...prev];
      if (selectedRowIndex !== null) {
        copy[selectedRowIndex] = updatedItem; // Ganti item yang diedit
      }
      return copy; // Kembalikan array yang diperbarui
    });

    onEdit(updatedItem); // Panggil fungsi onEdit untuk memberi tahu komponen lain tentang perubahan
    setOpenEdit(false); // Tutup modal
  };

  // Update the columns definition to include qty_pick
  const columns: ColumnDef<Item>[] = [
    { accessorKey: "notes", header: "Notes" },
    { accessorKey: "item_name", header: "Item Name" },
    { accessorKey: "item_code", header: "Item Code" },
    {
      accessorKey: "week_number",
      header: "Week Number",
      cell: ({ row }) => (
        <ul>
          {row.original.suggested_locations.map((location, index) => (
            <li key={index}>{location.week_number}</li>
          ))}
        </ul>
      ),
    },
    { accessorKey: "required_quantity", header: "Required Quantity" },
    {
      accessorKey: "remaining_quantity_needed",
      header: "Remaining Qty Needed",
    },
    { accessorKey: "already_picked_quantity", header: "Already Picked" },
    {
      accessorKey: "available_quantity",
      header: "Available Quantity",
      cell: ({ row }) => (
        <ul>
          {row.original.suggested_locations.map((location, index) => (
            <li key={index}>{location.available_quantity}</li>
          ))}
        </ul>
      ),
    },
    {
      id: "warehouse_sub_name",
      header: "Zone",
      cell: ({ row }) => (
        <ul>
          {row.original.suggested_locations.map((location, index) => (
            <li key={index}>{location.warehouse_sub_name}</li>
          ))}
        </ul>
      ),
    },
    {
      id: "suggested_locations",
      header: "Bin Locations",
      cell: ({ row }) => (
        <ul>
          {row.original.suggested_locations.map((location, index) => (
            <li key={index}>{location.bin_name}</li>
          ))}
        </ul>
      ),
    },
    {
      accessorKey: "qty_pick",
      header: "Qty Picked",
      cell: ({ row }) => {
        const item = row.original;
        const rowIndex = row.index; // <--- INI KUNCI

        const loc = item.suggested_locations?.[0];
        const available = loc?.available_quantity ?? 0;

        // Hitung qty default (berdasarkan rule)
        const computedQty =
          item.qty_pick !== undefined
            ? item.qty_pick
            : available >= item.required_quantity
            ? item.required_quantity
            : available;

        // Set default qty sekali saja
        useEffect(() => {
          if (item.qty_pick === undefined) {
            setLocalItems((prev) => {
              const copy = [...prev];
              copy[rowIndex] = { ...copy[rowIndex], qty_pick: computedQty };
              return copy;
            });
          }
        }, []);

        const handleQtyChange = (e: { target: { value: any } }) => {
          const value = Number(e.target.value);

          if (value <= available) {
            setLocalItems((prev) => {
              const copy = [...prev];
              copy[rowIndex] = { ...copy[rowIndex], qty_pick: value };
              return copy;
            });
          }
        };

        return (
          <input
            type="number"
            value={item.qty_pick ?? computedQty}
            onChange={handleQtyChange}
            min={0}
            max={available}
            className="border p-1 rounded"
          />
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-3">
          <button
            onClick={() => handleEditClick(row.original, row.index)}
            className="text-green-600"
          >
            <FaEdit />
          </button>

          <button
            onClick={() => handleAddClick(row.original.item_id)}
            className="text-blue-600"
          >
            <FaPlus />
          </button>
        </div>
      ),
    },
  ];

  const submitFinalSuggestions = async () => {
    const finalPayload = {
      data: localItems
        .map((item) => {
          const loc = item.suggested_locations?.[0]; // Ambil lokasi aktif

          // Cek apakah qty_pick tidak melebihi required_quantity
          const quantity = item.qty_pick ?? 0;
          const requiredQuantity = item.required_quantity;

          if (quantity > requiredQuantity) {
            showErrorToast(
              `Quantity for item ${item.item_name} exceeds the required quantity of ${requiredQuantity}.`
            );
            return null; // Mengembalikan null jika melebihi
          }

          return {
            do_id: DOid,
            memo_id: item.memo_id,
            item_id: item.item_id,
            source_warehouse_sub_id: loc?.warehouse_sub_id,
            source_bin_id: loc?.bin_id,
            destination_warehouse_sub_id: destinationZoneId,
            destination_bin_id: destinationBinId,
            quantity: quantity,
            uom: loc?.uom ?? "",
            week_number: loc?.week_number ?? "",
            status: "PENDING",
          };
        })
        .filter((item) => item !== null), // Filter out null items
    };

    if (finalPayload.data.length === 0) {
      showErrorToast("No valid items to submit.");
      return; // Keluar dari fungsi jika tidak ada data
    }

    if (typeof createBulkData === "function") {
      const res = await createBulkData(finalPayload as any);

      if (res?.success) {
        navigate("/outbound_do");
      }
    } else {
      showErrorToast("Put Away creation function is not available.");
    }
  };

  return (
    <>
      <TableComponent
        data={localItems}
        columns={columns}
        pageSize={10}
        totalPages={Math.ceil(localItems.length / 10)}
      />

      {/* SUBMIT SUGGESTION BUTTON */}
      <div className="flex justify-end mt-4">
        <Button
          type="button"
          variant="action"
          onClick={submitFinalSuggestions}
          disabled={!destinationBinId}
          startIcon={<FaCheck />}
        >
          Submit Suggestion
        </Button>
      </div>

      {/* ADD MODAL */}
      {openAdd && (
        <ModalInventoryItemModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          mode="add"
          itemID={selectedItem?.item_id}
          existingItemData={selectedItem}
          onSubmit={handleAddItem}
        />
      )}

      {/* EDIT MODAL */}
      {openEdit && (
        <ModalInventoryItemModal
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          mode="edit"
          itemID={selectedItem?.item_id ?? ""}
          existingItemData={selectedItem}
          onSubmit={(data) => {
            handleEditItem(data);
          }}
        />
      )}
    </>
  );
};
