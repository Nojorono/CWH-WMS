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
  uom?: string;
}

interface TableProps {
  items: Item[];
  onAdd: (data: any) => void;
  onEdit: (data: Item) => void;
  destinationZoneId: string;
  destinationBinId: string;
  DOid: string | null;
  metodeSuggestion: string;
  onBack?: () => void;
}

export const SuggestionItemsTable: React.FC<TableProps> = ({
  items,
  onAdd,
  onEdit,
  destinationZoneId,
  destinationBinId,
  DOid,
  metodeSuggestion,
  onBack,
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

  const handleAddClick = (item: Item, rowIndex: number) => {
    setSelectedItem(item);
    setOpenAdd(true);
    setSelectedRowIndex(rowIndex);
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
      accessorKey: "uom",
      header: "UOM",
      cell: ({ row }) => (
        <span>{row.original.suggested_locations[0]?.uom}</span>
      ),
    },
    {
      accessorKey: "week_number",
      header: "Week Number",
      cell: ({ row }) => (
        <span>{row.original.suggested_locations[0]?.week_number}</span>
      ),
    },
    {
      accessorKey: "required_quantity",
      header: "Required Quantity",
      cell: ({ row }) => (
        <span style={{ color: "green", fontWeight: "bold" }}>
          {row.original.required_quantity}
        </span>
      ),
    },
    {
      accessorKey: "remaining_quantity_needed",
      header: "Remaining Qty Needed",
      cell: ({ row }) => (
        <span style={{ color: "red", fontWeight: "bold" }}>
          {row.original.remaining_quantity_needed}
        </span>
      ),
    },
    {
      accessorKey: "already_picked_quantity",
      header: "Already Picked",
      cell: ({ row }) => (
        <span style={{ color: "blue", fontWeight: "bold" }}>
          {row.original.already_picked_quantity}
        </span>
      ),
    },
    {
      accessorKey: "available_quantity",
      header: "Available Quantity",
      cell: ({ row }) => (
        <span>{row.original.suggested_locations[0]?.available_quantity}</span>
      ),
    },
    {
      id: "warehouse_sub_name",
      header: "Zone",
      cell: ({ row }) => (
        <span>{row.original.suggested_locations[0]?.warehouse_sub_name}</span>
      ),
    },
    {
      id: "bin_location",
      header: "Bin Locations",
      cell: ({ row }) => (
        <ul>
          {row.original.suggested_locations.length > 0 && (
            <li>
              {row.original.suggested_locations[0].bin_name === "N/A"
                ? ""
                : row.original.suggested_locations[0].bin_name}
            </li>
          )}
        </ul>
      ),
    },
    {
      accessorKey: "qty_pick",
      header: "Qty Picked",
      cell: ({ row }) => {
        const item = row.original;
        const rowIndex = row.index;

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
          const alreadyPicked = item.already_picked_quantity;
          const requiredQuantity = item.required_quantity;
          const remainingQtyNeeded = item.remaining_quantity_needed;

          // Hitung sisa yang diperbolehkan
          const allowedQty = requiredQuantity - alreadyPicked;

          // Validasi: Qty Picked tidak boleh lebih dari Remaining Qty Needed
          if (value > remainingQtyNeeded) {
            showErrorToast(
              `Qty Picked cannot exceed the Remaining Qty Needed of ${remainingQtyNeeded}.`
            );
            return; // Keluar dari fungsi jika melebihi
          }

          // Validasi: Qty Picked tidak boleh lebih dari sisa yang diperbolehkan
          if (value > allowedQty) {
            showErrorToast(
              `Qty Picked cannot exceed the remaining allowed quantity of ${allowedQty}.`
            );
            return; // Keluar dari fungsi jika melebihi
          }

          // Jika semua validasi lolos, update localItems
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
          {row.original.suggested_locations[0]?.available_quantity > 0 && (
            <>
              <button
                onClick={() => handleEditClick(row.original, row.index)}
                className="text-green-600"
              >
                <FaEdit />
              </button>

              <button
                onClick={() => handleAddClick(row.original, row.index)}
                className="text-blue-600"
              >
                <FaPlus />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  //SUBMIT SUGGESTION FUNCTION
  const submitFinalSuggestions = async () => {
    const finalPayload = {
      data: localItems
        .map((item) => {
          // Tambahkan kondisi untuk memeriksa apakah ada suggestion
          if (item.suggested_locations.length === 0) {
            return null;
          }

          const loc = item.suggested_locations?.[0];
          const quantity = item.qty_pick ?? 0;
          const requiredQuantity = item.required_quantity;

          if (quantity > requiredQuantity) {
            showErrorToast(
              `Quantity for item ${item.item_name} exceeds the required quantity of ${requiredQuantity}.`
            );
            return null;
          }

          if (quantity === 0) {
            showErrorToast(
              `Quantity for item ${item.item_name} must be greater than zero.`
            );
            return null;
          }

          return {
            do_id: DOid,
            memo_id: item.memo_id,
            item_id: item.item_id,
            source_warehouse_sub_id: loc?.warehouse_sub_id,
            ...(loc?.bin_id !== "N/A" && { source_bin_id: loc?.bin_id }),
            destination_warehouse_sub_id: destinationZoneId,
            destination_bin_id: destinationBinId,
            quantity: quantity,
            uom: loc?.uom,
            week_number: loc?.week_number,
            status: "PENDING",
          };
        })
        .filter((item) => item !== null),
    };

    if (finalPayload.data.length === 0) {
      showErrorToast("Suggestion tidak valid, tolong input dengan benar sesuai Plan.");
      return;
    }

    if (typeof createBulkData === "function") {
      const res = await createBulkData(finalPayload as any);

      if (res?.success) {
        // navigate("/outbound_do");
        if (onBack) {
          onBack();
        }
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
      {openAdd && selectedItem?.suggested_locations[0]?.uom && (
        <ModalInventoryItemModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          mode="add"
          itemID={selectedItem?.item_id}
          existingItemData={selectedItem}
          onSubmit={handleAddItem}
          uomID={selectedItem?.suggested_locations[0]?.uom}
          metodeSuggestion={metodeSuggestion}
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
          metodeSuggestion={metodeSuggestion}
          onSubmit={(data) => {
            handleEditItem(data);
          }}
          uomID={selectedItem?.suggested_locations[0]?.uom}
        />
      )}
    </>
  );
};
