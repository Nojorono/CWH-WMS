import React, { useState, useEffect, useRef } from "react";
import { FaCheck, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import TableComponent from "../Table/TableComponent";
import { ColumnDef } from "@tanstack/react-table";
import ModalInventoryItemModal from "../Modal/ModalSelectItemLocation";
import { useStoreTransactionPicking } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast } from "../../../../components/toast";
import Swal from "sweetalert2";
import Button from "../../../../components/ui/button/Button";
import { useNavigate } from "react-router-dom";
import {
  Item,
  PickingPayload,
  RawSuggestion,
  RawSuggestionReview,
  ReviewGroup,
} from "../Types/suggestTableTypes";
import ModalReviewFinalSuggestion from "../Modal/ModalReviewFinalSuggestion";
import { prepareReviewGroups } from "../Helper/prepareReviewGroups";

/** Local draft input so multi-digit typing stays smooth; validate on blur. */
const QtyPickInput = ({
  value,
  available,
  onCommit,
}: {
  value?: number;
  available: number;
  onCommit: (next?: number) => void;
}) => {
  const [draft, setDraft] = useState(value == null ? "" : String(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(value == null ? "" : String(value));
    }
  }, [value]);

  const commit = () => {
    focusedRef.current = false;

    if (draft.trim() === "") {
      onCommit(undefined);
      return;
    }

    const num = Number(draft);
    if (Number.isNaN(num) || num < 0) {
      setDraft(value == null ? "" : String(value));
      return;
    }

    if (num > available) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Quantity",
        text: `Qty Picked tidak boleh melebihi Available Quantity (${available}).`,
      });
      setDraft(String(available));
      onCommit(available);
      return;
    }

    onCommit(num);
    setDraft(String(num));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onChange={(e) => {
        const raw = e.target.value;
        // allow empty / digits while typing (no parent update, no Swal)
        if (raw === "" || /^\d+$/.test(raw)) {
          setDraft(raw);
        }
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      placeholder="Input qty"
      className="border p-1 rounded w-24"
    />
  );
};

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

const buildRawSuggestions = (localItems: Item[]): RawSuggestion[] => {
  return localItems
    .map((item) => {
      const loc = item.suggested_locations?.[0];
      const qty = Number(item.qty_pick ?? 0);

      if (!loc || qty <= 0) return null;

      return {
        item_id: item.item_id,
        item_code: item.item_code,
        item_name: item.item_name,

        memo_id: item.memo_id,

        uom: loc.uom,
        week_number: loc.week_number,
        picked_qty: qty,

        source_warehouse_sub_id: loc.warehouse_sub_id,
        source_bin_id:
          loc.bin_id && loc.bin_id !== "N/A" ? loc.bin_id : undefined,

        required_qty: item.required_quantity ?? 0,
        already_picked_qty: item.already_picked_quantity ?? 0,
      };
    })
    .filter(Boolean) as RawSuggestion[];
};

const buildReviewSuggestions = (localItems: Item[]): RawSuggestionReview[] => {
  return localItems
    .map((item) => {
      const loc = item.suggested_locations?.[0];
      const qty = Number(item.qty_pick ?? 0);

      if (!loc || qty <= 0) return null;

      return {
        item_id: item.item_id,
        item_code: item.item_code,
        item_name: item.item_name,

        uom: loc.uom,
        week_number: loc.week_number,
        picked_qty: qty,

        required_qty: item.required_quantity ?? 0,
        already_picked_qty: item.already_picked_quantity ?? 0,

        // DISPLAY ONLY
        source_zone: loc.warehouse_sub_code ?? loc.warehouse_sub_name ?? "-",
        source_bin: loc.bin_name && loc.bin_name !== "N/A" ? loc.bin_name : "-",
      };
    })
    .filter(Boolean) as RawSuggestionReview[];
};

const buildFinalPayload = (
  raws: RawSuggestion[],
  doId: string | null,
  destinationWarehouseSubId: string,
  destinationBinId: string,
): PickingPayload => {
  return {
    data: raws.map((r) => ({
      do_id: doId,
      memo_id: r.memo_id,
      item_id: r.item_id,

      source_warehouse_sub_id: r.source_warehouse_sub_id,
      source_bin_id: r.source_bin_id,

      destination_warehouse_sub_id: destinationWarehouseSubId,
      destination_bin_id: destinationBinId,

      quantity: r.picked_qty,
      uom: r.uom,
      week_number: r.week_number,

      status: "PENDING",
    })),
  };
};

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
  const [reviewGroups, setReviewGroups] = useState<ReviewGroup[]>([]);
  const [openReview, setOpenReview] = useState(false);
  const [finalRawSuggestions, setFinalRawSuggestions] = useState<
    RawSuggestion[]
  >([]);

  // const normalizeItems = (items: Item[]): Item[] => {
  //   const result: Item[] = [];

  //   items.forEach((item) => {
  //     item.suggested_locations?.forEach((loc, idx) => {
  //       result.push({
  //         ...item,
  //         suggested_locations: [loc], // 🔥 PENTING
  //         _localId: genLocalId(),
  //         _isManual: false,
  //         qty_pick: Math.min(
  //           item.required_quantity ?? 0,
  //           loc.available_quantity ?? 0
  //         ),
  //       });
  //     });
  //   });

  //   return result;
  // };

  const normalizeItems = (items: Item[]): Item[] => {
    const result: Item[] = [];

    items.forEach((item) => {
      if (item.suggested_locations && item.suggested_locations.length > 0) {
        item.suggested_locations.forEach((loc, idx) => {
          result.push({
            ...item,
            suggested_locations: [loc],
            _localId: genLocalId(),
            _isManual: false,
            qty_pick: Math.min(
              item.required_quantity ?? 0,
              loc.available_quantity ?? 0,
            ),
          });
        });
      } else {
        // Tetap push meskipun suggested_locations kosong
        result.push({
          ...item,
          suggested_locations: [],
          _localId: genLocalId(),
          _isManual: false,
          qty_pick: undefined,
        });
      }
    });

    return result;
  };

  const [localItems, setLocalItems] = useState<Item[]>([]);

  const findLastIndexByItemId = (arr: Item[], itemId: string) => {
    let lastIndex = -1;
    arr.forEach((it, idx) => {
      if (it.item_id === itemId) lastIndex = idx;
    });
    return lastIndex;
  };

  // Helper: total qty_pick across all rows for an item (optionally overriding one index)
  const getTotalPickedForItem = (
    itemId: string,
    overrideIndex?: number,
    overrideValue?: number,
  ) => {
    return localItems.reduce((sum, it, idx) => {
      const v =
        overrideIndex !== undefined && idx === overrideIndex
          ? (overrideValue ?? 0)
          : (it.qty_pick ?? 0);
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
    const normalized = normalizeItems(items);

    setLocalItems((prev) =>
      normalized.map((it) => {
        const existing = prev.find(
          (p) =>
            p.item_id === it.item_id &&
            p.memo_id === it.memo_id &&
            p.suggested_locations?.[0]?.bin_id ===
              it.suggested_locations?.[0]?.bin_id,
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
      }),
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

  // const handleAddItem = (data: any) => {
  //   const requiredQty = Number(data.qty_pick ?? 0);
  //   const loc = data.location_data ?? {};
  //   const available = Number(loc.available_quantity ?? 0);
  //   const computedQty =
  //     requiredQty > 0 ? Math.min(requiredQty, available || requiredQty) : 0;

  //   const parentMemoId =
  //     selectedItem?.memo_id ??
  //     localItems.find((it) => it.item_id === data.item_id)?.memo_id ??
  //     "";

  //   const newItem: Item = {
  //     memo_id: parentMemoId,
  //     item_id: data.item_id,
  //     item_name: data.item_name,
  //     item_code: data.item_code,
  //     required_quantity: requiredQty,
  //     already_picked_quantity: 0,
  //     remaining_quantity_needed: requiredQty,
  //     suggested_locations: [loc],
  //     total_suggested_quantity: requiredQty,
  //     priority: 1,
  //     notes: "Suggestion item location ditambahkan secara manual oleh user.",
  //     qty_pick: computedQty, // <-- pastikan tampil langsung
  //     _localId: genLocalId(),
  //     _isManual: true,
  //   };

  //   setLocalItems((prevItems) => {
  //     const copy = [...prevItems];

  //     // cari posisi terakhir parent SKU
  //     const insertIndex = findLastIndexByItemId(copy, newItem.item_id);

  //     if (insertIndex === -1) {
  //       // fallback (harusnya tidak terjadi)
  //       return [...copy, newItem];
  //     }

  //     // sisipkan tepat setelah group parent
  //     copy.splice(insertIndex + 1, 0, newItem);

  //     return copy;
  //   });

  //   setOpenAdd(false);
  //   onAdd(newItem);
  // };

  const handleAddItem = (data: any) => {
    const requiredQty = Number(data.qty_pick ?? 0);
    const loc = data.location_data ?? {};
    const available = Number(loc.available_quantity ?? 0);
    const computedQty =
      requiredQty > 0 ? Math.min(requiredQty, available || requiredQty) : 0;

    const parentMemoId =
      selectedItem?.memo_id ??
      localItems.find((it) => it.item_id === data.item_id)?.memo_id ??
      "";

    // 🔒 VALIDASI: Cek kombinasi week_number, warehouse_sub_code, bin_code
    const isDuplicate = localItems.some(
      (it) =>
        it.item_id === data.item_id &&
        it.suggested_locations?.[0]?.week_number === loc.week_number &&
        it.suggested_locations?.[0]?.warehouse_sub_code ===
          loc.warehouse_sub_code &&
        it.suggested_locations?.[0]?.bin_code === loc.bin_code,
    );

    if (isDuplicate) {
      Swal.fire({
        icon: "warning",
        title: "Lokasi Sudah Ada",
        text:
          "Kombinasi Week Number, Zone, dan Bin sudah digunakan pada SKU ini. " +
          "Silakan pilih Week Number atau lokasi lain.",
      });
      return; // Batalkan proses ADD
    }

    const newItem: Item = {
      memo_id: parentMemoId,
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
      qty_pick: computedQty,
      _localId: genLocalId(),
      _isManual: true,
    };

    setLocalItems((prevItems) => {
      const copy = [...prevItems];
      const insertIndex = findLastIndexByItemId(copy, newItem.item_id);
      if (insertIndex === -1) {
        return [...copy, newItem];
      }
      copy.splice(insertIndex + 1, 0, newItem);
      return copy;
    });

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
        },
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

  const getSummaryRowIndex = (items: Item[], itemId: string) => {
    // 1️⃣ prefer: row yg punya suggested location & bukan manual
    const withLocation = items.findIndex(
      (i) =>
        i.item_id === itemId &&
        i.suggested_locations?.length > 0 &&
        !i._isManual,
    );

    if (withLocation !== -1) return withLocation;

    // 2️⃣ fallback: manual-added row
    const manual = items.findIndex((i) => i.item_id === itemId && i._isManual);

    if (manual !== -1) return manual;

    // 3️⃣ last fallback: first appearance
    return items.findIndex((i) => i.item_id === itemId);
  };

  const isSummaryRow = (items: Item[], itemId: string, rowIndex: number) =>
    getSummaryRowIndex(items, itemId) === rowIndex;

  // Update the columns definition to include qty_pick
  const columns: ColumnDef<Item>[] = [
    { accessorKey: "notes", header: "Notes", enableSorting: false },
    {
      accessorKey: "item_name",
      header: "Item Name",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            {item._isManual && <span className="text-xs text-gray-400">↳</span>}
            <span>{item.item_name}</span>
          </div>
        );
      },
    },
    { accessorKey: "item_code", header: "Item Code" },
    {
      accessorKey: "uom",
      header: "UOM",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        const rowIndex = row.index;
        return <span>{item.suggested_locations?.[0]?.uom ?? ""}</span>;
      },
    },
    {
      accessorKey: "week_number",
      header: "Week Number",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        const rowIndex = row.index;
        return <span>{item.suggested_locations?.[0]?.week_number ?? ""}</span>;
      },
    },
    {
      accessorKey: "required_quantity",
      header: "Required Quantity",
      enableSorting: false,

      cell: ({ row }) => {
        const item = row.original;
        const rowIndex = row.index;

        if (!isSummaryRow(localItems, item.item_id, rowIndex)) return <span />;

        return (
          <span className="text-green-600 font-bold">
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

        if (!isSummaryRow(localItems, item.item_id, rowIndex)) return <span />;

        return (
          <span className="text-red-600 font-bold">
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

        if (!isSummaryRow(localItems, item.item_id, rowIndex)) return <span />;

        return (
          <span className="text-blue-600 font-bold">
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
        const loc = item.suggested_locations?.[0];
        const available = loc?.available_quantity;
        
        if (available === undefined || available === null) {
          return <span>-</span>;
        }

        return (
          <span className={available > 0 ? "text-gray-900" : "text-gray-400"}>
            {available}
          </span>
        );
      },
    },
    {
      id: "warehouse_sub_name",
      header: "Zone",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        // Gabungkan semua warehouse_sub_name unik dari suggested_locations
        const zones = (item.suggested_locations ?? [])
          .map((loc: any) => loc.warehouse_sub_name)
          .filter(Boolean);
        // Hilangkan duplikat
        const uniqueZones = Array.from(new Set(zones));
        return <span>{uniqueZones.length ? uniqueZones.join(", ") : "-"}</span>;
      },
    },
    {
      id: "bin_location",
      header: "Bin Locations",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        // Gabungkan semua bin_name unik dari suggested_locations
        const bins = (item.suggested_locations ?? [])
          .map((loc: any) => loc.bin_name)
          .filter(Boolean);
        const uniqueBins = Array.from(new Set(bins));
        return <span>{uniqueBins.length ? uniqueBins.join(", ") : "-"}</span>;
      },
    },
    {
      accessorKey: "qty_pick",
      header: "Qty ready to Picked",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        const loc = item.suggested_locations?.[0];
        const available = Number(loc?.available_quantity ?? 0);

        if (available <= 0) {
          return (
            <div className="text-sm text-gray-500">Tak ada available stock</div>
          );
        }

        return (
          <QtyPickInput
            value={item.qty_pick}
            available={available}
            onCommit={(next) => {
              setLocalItems((prev) =>
                prev.map((it) =>
                  it._localId === item._localId
                    ? { ...it, qty_pick: next }
                    : it,
                ),
              );
            }}
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

        const isSummary = isSummaryRow(localItems, item.item_id, rowIndex);

        // 🔹 Manual-added rows
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
                    prev.filter((it) => it._localId !== item._localId),
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

        // 🔹 Original rows
        return (
          <div className="flex gap-3">
            <button
              onClick={() => handleEditClick(item, rowIndex)}
              className="text-green-600"
            >
              <FaEdit />
            </button>

            {/* ✅ ADD hanya di SUMMARY ROW + ada stock */}
            {isSummary && available > 0 && (
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

  const prepareReview = () => {
    const hasAvailableQty = localItems.some(
      (item) =>
        Number(item.suggested_locations?.[0]?.available_quantity ?? 0) > 0,
    );

    const apiRaw = buildRawSuggestions(localItems);
    const reviewRaw = buildReviewSuggestions(localItems);

    if (!hasAvailableQty || reviewRaw.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Tidak Ada Item yang Tersedia",
        text: "Hanya bisa review item yang tersedia saja",
      });
      return;
    }

    const groups = prepareReviewGroups(reviewRaw);
    setReviewGroups(groups);
    setFinalRawSuggestions(apiRaw);
    setOpenReview(true);
  };

  const validateBeforeSubmit = (groups: ReviewGroup[]) => {
    const hasOver = groups.some((g) => g.status === "OVER");
    const hasUomMismatch = groups.some((g) => g.status === "UOM_MISMATCH");
    const hasLess = groups.some((g) => g.status === "LESS");

    return {
      hasOver,
      hasUomMismatch,
      hasLess,
    };
  };

  const submitToAPI = async () => {
    if (!finalRawSuggestions.length) return;

    const { hasOver, hasUomMismatch, hasLess } =
      validateBeforeSubmit(reviewGroups);

    // ❌ BLOCK
    if (hasOver || hasUomMismatch) {
      Swal.fire({
        icon: "error",
        title: "Data Tidak Valid",
        text: "Terdapat Qty Over atau UOM tidak sama.",
      });
      return;
    }

    // ⚠️ WARNING
    if (hasLess) {
      const res = await Swal.fire({
        icon: "warning",
        title: "Qty Kurang",
        text:
          "Beberapa item memiliki Qty Pick lebih kecil dari Remaining Qty. " +
          "Apakah Anda yakin ingin melanjutkan?",
        showCancelButton: true,
        confirmButtonText: "Ya, Lanjutkan",
        cancelButtonText: "Kembali",
      });

      if (!res.isConfirmed) return;
    }

    // ✅ FINAL PAYLOAD
    const finalPayload = buildFinalPayload(
      finalRawSuggestions,
      DOid,
      destinationZoneId,
      destinationBinId,
    );

    // ===== API CALL =====
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
          onClick={prepareReview}
          disabled={!destinationBinId}
          startIcon={<FaCheck />}
        >
          Review Final Suggestion
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

      {openReview && (
        <ModalReviewFinalSuggestion
          open={openReview}
          data={reviewGroups}
          onClose={() => setOpenReview(false)}
          onConfirm={submitToAPI}
        />
      )}
    </>
  );
};
