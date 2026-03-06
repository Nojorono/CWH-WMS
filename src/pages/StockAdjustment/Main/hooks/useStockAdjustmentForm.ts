import { useState, useEffect, useRef } from "react";
import { showErrorToast } from "../../../../components/toast";

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

export const useStockAdjustmentForm = (
  mode: "create" | "detail" | "update",
  initialData?: any,
) => {
  const isDetailMode = mode === "detail";
  const isUpdateMode = mode === "update";

  // ✅ Flag untuk skip sync saat pertama kali data di-load
  const isInitialized = useRef(false);

  const [originalData, setOriginalData] = useState<any>(null);
  const [selectedPallets, setSelectedPallets] = useState<string[]>([]);
  const [palletItems, setPalletItems] = useState<PalletItem[]>([]);
  const [adjustedQty, setAdjustedQty] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [selectedSubInventory, setSelectedSubInventory] = useState("GOOD_STOCK");

  useEffect(() => {
    if (isUpdateMode && initialData) {
      setOriginalData(initialData);
    }
  }, [isUpdateMode, initialData]);

  useEffect(() => {
    if ((isDetailMode || isUpdateMode) && initialData) {
      // Reset flag dulu sebelum set data
      isInitialized.current = false;

      setNotes(initialData.notes || "");
      setSelectedSubInventory(initialData.is_inventory || "GOOD_STOCK");

      const palletCodes =
        initialData.adjustmentStockItems
          ?.map((item: any) => item.pallet?.pallet_code)
          ?.filter(Boolean) || [];
      setSelectedPallets(palletCodes);

      const mappedItems =
        initialData.adjustmentStockItems?.map((item: any) => ({
          id: item.pallet_id,
          pallet_code: item.pallet?.pallet_code || "-",
          item_id: item.item_id,
          item_name: item.item?.sku || "-",
          uom: item.uom,
          week_number: item.pallet?.currentWeekNumber || 0,
          current_quantity: item.pallet?.currentQuantity || 0,
          warehouse_sub_id: item.warehouse_sub_id,
          warehouse_sub_name: item.warehouseSub?.name || "-",
          warehouse_bin_id: item.warehouse_bin_id,
          warehouse_bin_name: item.warehouseBin?.name || "-",
        })) || [];

      setPalletItems(mappedItems);

      const qtyMap: Record<string, string> = {};
      initialData.adjustmentStockItems?.forEach((item: any) => {
        const key = `${item.pallet?.pallet_code}-${item.item_id}-${item.uom}`;
        qtyMap[key] = item.quantity.toString();
      });
      setAdjustedQty(qtyMap);

      // ✅ Tandai sudah init setelah semua state di-set (pakai setTimeout agar eksekusi setelah render)
      setTimeout(() => {
        isInitialized.current = true;
      }, 0);
    }
  }, [initialData, isDetailMode, isUpdateMode]);

  // ✅ Sync palletItems ketika user MANUALLY mengubah selectedPallets
  useEffect(() => {
    if (isDetailMode) return;
    // Skip saat inisialisasi awal data
    if (!isInitialized.current) return;

    setPalletItems((prevItems) => {
      // Cleanup adjustedQty untuk pallet yang di-remove
      setAdjustedQty((prevQty) => {
        const newQty = { ...prevQty };
        prevItems.forEach((item) => {
          if (!selectedPallets.includes(item.pallet_code)) {
            const key = `${item.pallet_code}-${item.item_id}-${item.uom}`;
            delete newQty[key];
          }
        });
        return newQty;
      });

      return prevItems.filter((item) =>
        selectedPallets.includes(item.pallet_code),
      );
    });
  }, [selectedPallets, isDetailMode]);

  const getItemKey = (item: PalletItem) =>
    `${item.pallet_code}-${item.item_id}-${item.uom}`;

  const handleQtyChange = (key: string, value: string) => {
    setAdjustedQty((prev) => ({
      ...prev,
      [key]: value.replace(/^0+/, "") || "",
    }));
  };

  const handleRemoveItem = (item: PalletItem) => {
    setPalletItems((prev) =>
      prev.filter(
        (i) =>
          !(
            i.pallet_code === item.pallet_code &&
            i.item_id === item.item_id &&
            i.uom === item.uom
          ),
      ),
    );
  };

  const validateSubmission = () => {
    const items = palletItems
      .filter((item) => adjustedQty[getItemKey(item)])
      .map((item) => ({
        warehouse_sub_id: item.warehouse_sub_id,
        warehouse_bin_id: item.warehouse_bin_id,
        pallet_id: item.id,
        pallet_code: item.pallet_code,
        item_name: item.item_name,
        item_id: item.item_id,
        current_quantity: item.current_quantity,
        quantity: Number(adjustedQty[getItemKey(item)]) || 0,
        uom: item.uom,
      }));

    if (items.length === 0) {
      showErrorToast("Tidak ada qty yang di-adjust!");
      return null;
    }

    const invalidItem = items.find(
      (item) => Number(item.quantity) === Number(item.current_quantity),
    );
    if (invalidItem) {
      showErrorToast(
        `Qty adjustment untuk pallet ${invalidItem.pallet_code} SKU ${invalidItem.item_name} harus berbeda dari current qty!`,
      );
      return null;
    }

    return items;
  };

  // const buildUpdatePayload = () => {
  //   if (!originalData) return null;

  //   const updatedFields: any = {};

  //   if (notes !== originalData.notes) {
  //     updatedFields.notes = notes;
  //   }

  //   if (selectedSubInventory !== originalData.is_inventory) {
  //     updatedFields.is_inventory = selectedSubInventory;
  //   }

  //   const changedItems = [];
  //   for (const item of palletItems) {
  //     const key = getItemKey(item);
  //     const newQty = Number(adjustedQty[key]);

  //     const originalItem = originalData.adjustmentStockItems?.find(
  //       (i: any) =>
  //         i.pallet_id === item.id &&
  //         i.item_id === item.item_id &&
  //         i.uom === item.uom,
  //     );

  //     if (!originalItem) continue;

  //     if (Number(originalItem.quantity) !== newQty) {
  //       changedItems.push({
  //         pallet_id: item.id,
  //         item_id: item.item_id,
  //         quantity: newQty,
  //         uom: item.uom,
  //       });
  //     }
  //   }

  //   if (changedItems.length > 0) {
  //     updatedFields.items = changedItems;
  //   }

  //   return updatedFields;
  // };

  const buildUpdatePayload = () => {
    if (!originalData) return null;

    const updatedFields: any = {};

    if (notes !== originalData.notes) {
      updatedFields.notes = notes;
    }

    if (selectedSubInventory !== originalData.is_inventory) {
      updatedFields.is_inventory = selectedSubInventory;
    }

    // ✅ Selalu kirim SEMUA items yang ada di palletItems (existing + new)
    // Backend replace array, bukan merge — jadi harus kirim semua
    const allItems = palletItems
      .filter((item) => adjustedQty[getItemKey(item)]) // hanya yang ada qty-nya
      .map((item) => ({
        warehouse_sub_id: item.warehouse_sub_id,
        warehouse_bin_id: item.warehouse_bin_id,
        pallet_id: item.id,
        item_id: item.item_id,
        quantity: Number(adjustedQty[getItemKey(item)]) || 0,
        uom: item.uom,
      }));

    if (allItems.length > 0) {
      updatedFields.items = allItems;
    }

    return updatedFields;
  };
  return {
    isDetailMode,
    isUpdateMode,
    originalData,
    selectedPallets,
    setSelectedPallets,
    palletItems,
    setPalletItems,
    adjustedQty,
    notes,
    setNotes,
    selectedSubInventory,
    setSelectedSubInventory,
    getItemKey,
    handleQtyChange,
    handleRemoveItem,
    validateSubmission,
    buildUpdatePayload,
  };
};