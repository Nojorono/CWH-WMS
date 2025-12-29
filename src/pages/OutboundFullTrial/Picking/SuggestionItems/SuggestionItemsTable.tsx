import React, { useState, useEffect } from "react";
import { FaCheck, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import TableComponent from "../Table/TableComponent";
import { ColumnDef } from "@tanstack/react-table";
import ModalInventoryItemModal from "../Modal/ModalSelectItemLocation";
import { useStoreTransactionPicking } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast } from "../../../../components/toast";
import Swal from "sweetalert2";
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
  // internal flags for UI only
  _localId?: string;
  _isManual?: boolean;
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

const genLocalId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

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
  const [localItems, setLocalItems] = useState<Item[]>(
    items.map((it) => ({
      ...it,
      _localId: (it as any)._localId ?? genLocalId(),
    }))
  );

  // Helper: total qty_pick across all rows for an item (optionally overriding one index)
  const getTotalPickedForItem = (
    itemId: string,
    overrideIndex?: number,
    overrideValue?: number
  ) => {
    return localItems.reduce((sum, it, idx) => {
      const v =
        overrideIndex !== undefined && idx === overrideIndex
          ? overrideValue ?? 0
          : it.qty_pick ?? 0;
      return it.item_id === itemId ? sum + (Number(v) || 0) : sum;
    }, 0);
  };
  const [openEdit, setOpenEdit] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const { createBulkData } = useStoreTransactionPicking();

  useEffect(() => {
    // keep stable local ids and preserve manual flag / qty_pick if present
    setLocalItems((prev) =>
      items.map((it) => {
        const existing = prev.find(
          (p) =>
            p.item_id === it.item_id &&
            p.memo_id === it.memo_id &&
            p.suggested_locations?.[0]?.bin_id ===
              it.suggested_locations?.[0]?.bin_id
        );

        // compute default qty_pick: min(required_quantity, available)
        const available = it.suggested_locations?.[0]?.available_quantity ?? 0;
        const required = it.required_quantity ?? 0;
        const computedQty = Math.min(required, available);

        return {
          ...it,
          _localId: existing?._localId ?? genLocalId(),
          _isManual: existing?._isManual ?? (it as any)._isManual ?? false,
          // preserve existing qty_pick (user-edited) otherwise set default computedQty if > 0
          qty_pick:
            existing && existing.qty_pick !== undefined
              ? existing.qty_pick
              : it.qty_pick !== undefined
              ? it.qty_pick
              : computedQty > 0
              ? computedQty
              : undefined,
        };
      })
    );
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
    const requiredQty = Number(data.qty_pick ?? 0);
    const loc = data.location_data ?? {};
    const available = Number(loc.available_quantity ?? 0);
    const computedQty = requiredQty > 0 ? Math.min(requiredQty, available || requiredQty) : 0;

    const newItem: Item = {
      memo_id: data.memo_id ?? "",
      item_id: data.item_id,
      item_name: data.item_name,
      item_code: data.item_code,
      required_quantity: requiredQty,
      already_picked_quantity: 0,
      remaining_quantity_needed: requiredQty,
      suggested_locations: [loc],
      total_suggested_quantity: requiredQty,
      priority: 1,
      notes: "Suggestion item location ditambahkan secara manual oleh user.",
      qty_pick: computedQty, // <-- pastikan tampil langsung
      _localId: genLocalId(),
      _isManual: true,
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
    { accessorKey: "notes", header: "Notes", enableSorting: false },
    { accessorKey: "item_name", header: "Item Name", enableSorting: false },
    { accessorKey: "item_code", header: "Item Code" },
    {
      accessorKey: "uom",
      header: "UOM",
      enableSorting: false,
      cell: ({ row }) => (
        <span>{row.original.suggested_locations[0]?.uom}</span>
      ),
    },
    {
      accessorKey: "week_number",
      header: "Week Number",
      enableSorting: false,
      cell: ({ row }) => (
        <span>{row.original.suggested_locations[0]?.week_number}</span>
      ),
    },
    {
      accessorKey: "required_quantity",
      header: "Required Quantity",
      enableSorting: false,

      cell: ({ row }) => {
        const item = row.original;
        const rowIndex = row.index;
        const firstIndex = localItems.findIndex(
          (i) => i.item_id === item.item_id
        );
        if (rowIndex !== firstIndex) return <span />; // hide for duplicate SKUs
        return (
          <span style={{ color: "green", fontWeight: "bold" }}>
            {item.required_quantity}
          </span>
        );
      },
    },
    {
      accessorKey: "remaining_quantity_needed",
      header: "Remaining Qty Needed",
      enableSorting: false,

      cell: ({ row }) => {
        const item = row.original;
        const rowIndex = row.index;
        const firstIndex = localItems.findIndex(
          (i) => i.item_id === item.item_id
        );
        if (rowIndex !== firstIndex) return <span />;
        return (
          <span style={{ color: "red", fontWeight: "bold" }}>
            {item.remaining_quantity_needed}
          </span>
        );
      },
    },
    {
      accessorKey: "already_picked_quantity",
      header: "Already Picked",
      enableSorting: false,

      cell: ({ row }) => {
        const item = row.original;
        const rowIndex = row.index;
        const firstIndex = localItems.findIndex(
          (i) => i.item_id === item.item_id
        );
        if (rowIndex !== firstIndex) return <span />;
        return (
          <span style={{ color: "blue", fontWeight: "bold" }}>
            {item.already_picked_quantity}
          </span>
        );
      },
    },
    {
      accessorKey: "available_quantity",
      header: "Available Quantity",
      enableSorting: false,

      cell: ({ row }) => {
        const item = row.original;
        const rowIndex = row.index;
        const firstIndex = localItems.findIndex(
          (i) => i.item_id === item.item_id
        );
        if (rowIndex !== firstIndex) return <span />;
        return <span>{item.suggested_locations[0]?.available_quantity}</span>;
      },
    },
    {
      id: "warehouse_sub_name",
      header: "Zone",
      enableSorting: false,

      cell: ({ row }) => (
        <span>{row.original.suggested_locations[0]?.warehouse_sub_name}</span>
      ),
    },
    {
      id: "bin_location",
      header: "Bin Locations",
      enableSorting: false,

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
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        const rowIndex = row.index;

        const loc = item.suggested_locations?.[0];
        const available = Number(loc?.available_quantity ?? 0);

        // If no available stock, show message and prevent input
        if (available <= 0) {
          return (
            <div className="text-sm text-gray-500">
              Tak ada available stock
            </div>
          );
        }

        const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const rawValue = e.target.value;

          // allow empty input
          if (rawValue === "") {
            setLocalItems((prev) => {
              const copy = [...prev];
              copy[rowIndex] = { ...copy[rowIndex], qty_pick: undefined };
              return copy;
            });
            return;
          }

          const value = Number(rawValue);

          if (Number.isNaN(value)) return;

          const alreadyPicked = item.already_picked_quantity ?? 0;
          const requiredQuantity = item.required_quantity ?? 0;
          const remainingQtyNeeded = item.remaining_quantity_needed ?? 0;

          const allowedQty = requiredQuantity - alreadyPicked;

          // ❗ validasi aggregated per item
          const totalIfSet = getTotalPickedForItem(
            item.item_id,
            rowIndex,
            value
          );

          // ❗ validasi available location
          if (value > available) {
            Swal.fire({
              icon: "warning",
              title: "Invalid Quantity",
              text: `Qty Picked tidak boleh melebihi Available Quantity (${available}).`,
            });
            return;
          }

          setLocalItems((prev) => {
            const copy = [...prev];
            copy[rowIndex] = { ...copy[rowIndex], qty_pick: value };
            return copy;
          });
        };

        return (
          <input
            type="number"
            value={item.qty_pick ?? ""} // ⬅️ kosong default
            onChange={handleQtyChange}
            min={0}
            max={available}
            placeholder="Input qty"
            className="border p-1 rounded w-24"
          />
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        const rowIndex = row.index;
        const available =
          item.suggested_locations?.[0]?.available_quantity ?? 0;
        const isFirstOfItem =
          localItems.findIndex((i) => i.item_id === item.item_id) === rowIndex;

        // Manual-added rows: only Edit + Remove
        if (item._isManual) {
          return (
            <div className="flex gap-3">
              <button
                onClick={() => handleEditClick(item, rowIndex)}
                className="text-green-600"
              >
                <FaEdit />
              </button>
              <button
                onClick={() =>
                  setLocalItems((prev) =>
                    prev.filter((it) => it._localId !== item._localId)
                  )
                }
                className="text-rose-600"
                title="Remove added suggestion"
              >
                <FaTrash />
              </button>
            </div>
          );
        }

        // Original rows (non-manual): Edit always; Add only for the first original row and when available > 0
        return (
          <div className="flex gap-3">
            <button
              onClick={() => handleEditClick(item, rowIndex)}
              className="text-green-600"
            >
              <FaEdit />
            </button>

            {isFirstOfItem && available > 0 && (
              <button
                onClick={() => handleAddClick(item, rowIndex)}
                className="text-blue-600"
              >
                <FaPlus />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  //SUBMIT SUGGESTION FUNCTION
  const submitFinalSuggestions = async () => {
    // validate aggregated picks across rows before building payload
    const aggregated: Record<string, { total: number; allowed: number }> = {};
    const itemMap: Record<
      string,
      {
        totalPicked: number;
        allowed: number;
        itemName: string;
      }
    > = {};

    for (const item of localItems) {
      if (!itemMap[item.item_id]) {
        // ambil parent row (row pertama item ini)
        const parent = localItems.find((x) => x.item_id === item.item_id);

        const allowed =
          (parent?.required_quantity ?? 0) -
          (parent?.already_picked_quantity ?? 0);

        itemMap[item.item_id] = {
          totalPicked: 0,
          allowed,
          itemName: parent?.item_name ?? "",
        };
      }

      itemMap[item.item_id].totalPicked += Number(item.qty_pick ?? 0);
    }

    for (const id in itemMap) {
      const { totalPicked, allowed, itemName } = itemMap[id];

      if (totalPicked > allowed) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Quantity",
          text: `Total Qty Picked untuk item ${itemName} (${totalPicked}) melebihi Required Quantity (${allowed}).`,
        });
        return;
      }
    }

    // Normalize items: copy memo_id (and fallback suggested_locations[0]) from the first occurrence of same item_id
    const normalizedItems = localItems.map((it) => {
      if (it.memo_id && it.memo_id !== "") return it;
      const first = localItems.find(
        (x) => x.item_id === it.item_id && x.memo_id
      );
      // also copy suggested_locations[0] if missing, so Add-mode rows have necessary source info
      const sourceLoc =
        it.suggested_locations?.[0] ?? first?.suggested_locations?.[0];
      return {
        ...it,
        memo_id: first?.memo_id ?? it.memo_id ?? "",
        suggested_locations: it.suggested_locations.length
          ? it.suggested_locations
          : first?.suggested_locations ?? [],
      };
    });

    const finalPayload = {
      data: normalizedItems
        .map((item) => {
          // Tambahkan kondisi untuk memeriksa apakah ada suggestion
          if (
            !item.suggested_locations ||
            item.suggested_locations.length === 0
          ) {
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
            memo_id: item.memo_id, // now guaranteed if available on first occurrence
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

    console.log("Final payload to submit:", finalPayload);

    if (finalPayload.data.length === 0) {
      showErrorToast("Suggestion tidak valid, tolong input dengan benar sesuai Plan.");
      return;
    }

    if (typeof createBulkData === "function") {
      const res = await createBulkData(finalPayload as any);

      if (res?.success) {
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
          Submit Final Suggestion
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
