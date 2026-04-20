// NEW CODE
import { useEffect, useState } from "react";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { FormValues } from "../formTypes";
import { inputCls } from "../constants";
import ItemTable from "../Table/ItemTable";
import AddItemModal from "../Modal/AddItemModal";
import Button from "../../../../../../components/ui/button/Button";
import { FaSearch } from "react-icons/fa";
import {
  useStoreItem,
  useStoreUom,
} from "../../../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast } from "../../../../../../components/toast";
import { searchPO, searchSO } from "../Services"; // ✅ ganti import

export default function POCard({
  doIndex,
  posIndex,
  removePos,
  totalPO,
  isEditMode,
  isDetailMode,
  isCreateMode,
  isAddToReceiveMode,
  InbType,
  dataPO,
  isDOChecked,
  isPOValidated,
}: {
  doIndex: number;
  posIndex: number;
  removePos: () => void;
  totalPO: number;
  isEditMode?: boolean;
  isDetailMode?: boolean;
  isCreateMode?: boolean;
  isAddToReceiveMode?: boolean;
  InbType: string;
  dataPO?: any;
  isDOChecked?: boolean;
  isPOValidated?: boolean;
}) {
  const { fetchAll, list } = useStoreItem();
  const { fetchAll: fetchAllUom, list: uomList } = useStoreUom();
  const { control, register, getValues, setValue } =
    useFormContext<FormValues>();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
    replace: replaceItems,
  } = useFieldArray({
    control,
    name: `deliveryOrders.${doIndex}.pos.${posIndex}.items`,
  });

  const doNo = useWatch({ control, name: `deliveryOrders.${doIndex}.do_no` });

  const vendorNameWatch = useWatch({
    control,
    name: `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
  });

  const principalWatch = useWatch({
    control,
    name: `deliveryOrders.${doIndex}.pos.${posIndex}.principal` as any,
  });

  const isSuratJalanValidated = useWatch({
    control,
    name: `deliveryOrders.${doIndex}.validation_surat_jalan` as any,
  });

  const normalizedInbType =
    typeof InbType === "object" ? (InbType as any)?.value : InbType;
  const resolvedMode = isDetailMode ? "detail" : isEditMode ? "edit" : "create";

  useEffect(() => {
    fetchAll();
    fetchAllUom();
  }, []);

  // Sync Data Existing (Goal: Menampilkan Principal di Nama Pengirim)
  useEffect(() => {
    const path = `deliveryOrders.${doIndex}.pos.${posIndex}`;

    const currentPrincipal = getValues(`${path}.principal` as any);
    const currentVendorName = getValues(`${path}.vendor_name` as any);

    if (currentPrincipal && !currentVendorName) {
      setValue(`${path}.vendor_name` as any, currentPrincipal);
    }

    if ((isDetailMode || isEditMode) && dataPO) {
      setValue(`${path}.po_no` as any, dataPO);
    }
  }, [
    isDetailMode,
    isEditMode,
    dataPO,
    setValue,
    getValues,
    doIndex,
    posIndex,
  ]);

  const isPOFieldDisabled =
    isDetailMode ||
    (!isEditMode && !isCreateMode && !isAddToReceiveMode) ||
    (isCreateMode && !isDOChecked);

  const canAddItem = !isDetailMode && isDOChecked;
  const cantAddManualAddItem =
    !isDOChecked || isSuratJalanValidated || isPOValidated;

  const getDisabledCls = (disabled: boolean) =>
    disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white";

  // ✅ SEARCH PO
  const handleSearchPO = async () => {
    if (!doNo) return showErrorToast("Isi Surat Jalan terlebih dahulu.");
    const poNo = getValues(
      `deliveryOrders.${doIndex}.pos.${posIndex}.po_no` as any,
    );
    if (!poNo) return showErrorToast("Masukkan nomor PO!");

    setLoading(true);
    try {
      // 1. Tangkap vendorId dan poDate dari hasil search
      const { vendorName, vendorId, poDate, items } = await searchPO(
        poNo,
        list,
        uomList,
      );

      const path = `deliveryOrders.${doIndex}.pos.${posIndex}`;

      if (vendorName) {
        setValue(`${path}.vendor_name` as any, vendorName);
        setValue(`${path}.principal` as any, vendorName);
      }

      // 2. Simpan vendor_id dan po_date ke form state agar Payload BE lengkap
      if (vendorId) {
        setValue(`${path}.vendor_id` as any, vendorId);
      }

      if (poDate) {
        // Simpan dalam format ISO string untuk BE
        const isoDate = new Date(poDate).toISOString();
        setValue(`${path}.po_date` as any, isoDate);
      }

      // 3. Masukkan total items untuk field total_line_items
      setValue(`${path}.total_line_items` as any, items.length);

      replaceItems(items);
    } catch (err: any) {
      replaceItems([]);
      showErrorToast(err?.message ?? "Gagal mencari PO");
    } finally {
      setLoading(false);
    }
  };

  // ✅ SEARCH SO
  const handleSearchSO = async () => {
    const soNo = getValues(
      `deliveryOrders.${doIndex}.pos.${posIndex}.so_no` as any,
    );
    if (!soNo) return showErrorToast("Masukkan nomor SO!");

    setLoading(true);
    try {
      const { vendorName, items } = await searchSO(soNo, list, uomList);

      if (vendorName) {
        setValue(
          `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
          vendorName,
        );
        setValue(
          `deliveryOrders.${doIndex}.pos.${posIndex}.principal` as any,
          vendorName,
        );
      }

      replaceItems(items);
    } catch (err: any) {
      replaceItems([]);
      showErrorToast(err?.message ?? "Gagal mencari SO");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative border rounded-md p-3 bg-slate-50">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-50 rounded-md">
          <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        {/* Input PO/SO */}
        <div>
          <label className="block text-xs text-slate-600 mb-1">
            Nomor {normalizedInbType}
          </label>
          <div className="flex gap-2">
            <input
              className={`${inputCls} ${getDisabledCls(isPOFieldDisabled ?? false)} flex-1`}
              {...register(
                `deliveryOrders.${doIndex}.pos.${posIndex}.${normalizedInbType === "PO" ? "po_no" : "so_no"}` as any,
              )}
              key={isDOChecked ? "enabled" : "disabled"}
              disabled={isPOFieldDisabled}
            />
            {!isDetailMode && (
              <Button
                type="button"
                variant="primary"
                size="xsm"
                onClick={
                  normalizedInbType === "PO" ? handleSearchPO : handleSearchSO
                }
                disabled={isPOFieldDisabled || loading}
              >
                <FaSearch />
              </Button>
            )}
          </div>
        </div>

        {/* Nama Pengirim */}
        <div>
          <label className="block text-xs text-slate-600 mb-1">
            Nama Pengirim{" "}
            {!isDetailMode && <span className="text-red-500">*</span>}
          </label>
          <input
            className={`${inputCls} w-full ${getDisabledCls(isDetailMode ?? false)}`}
            {...register(
              `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
            )}
            value={vendorNameWatch || principalWatch || ""}
            readOnly={isDetailMode ?? false}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setValue(
                `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
                val,
              );
              setValue(
                `deliveryOrders.${doIndex}.pos.${posIndex}.principal` as any,
                val,
              );
            }}
            placeholder={
              isDetailMode ? "" : "Ketik manual jika tidak muncul..."
            }
          />
        </div>

        {/* Actions */}
        {!isDetailMode && (
          <div className="flex gap-2 justify-end">
            {canAddItem && (
              <Button
                type="button"
                variant="secondary"
                size="xsm"
                onClick={() => setIsOpen(true)}
                disabled={cantAddManualAddItem}
              >
                + Add Item
              </Button>
            )}

            {totalPO > 1 && (
              <Button
                type="button"
                variant="danger"
                size="xsm"
                onClick={removePos}
              >
                Remove PO
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 overflow-x-auto">
        <ItemTable
          items={itemFields}
          itemsPath={`deliveryOrders.${doIndex}.pos.${posIndex}.items`}
          doIndex={doIndex}
          posIndex={posIndex}
          removeItem={removeItem}
          isEditMode={canAddItem}
          uomList={uomList}
        />
      </div>

      {!isDetailMode && (
        <AddItemModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSave={(item) => appendItem(item)}
        />
      )}
    </div>
  );
}
