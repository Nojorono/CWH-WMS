// NEW CODE
import { useEffect, useState } from "react";
import { useFormContext, useFieldArray, useWatch, Controller } from "react-hook-form";
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
import {
  POsearchService,
  SOsearchService,
} from "../../../../../../DynamicAPI/services/Service/";

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
  const { control, register, getValues, setValue, trigger } =
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

  const poNoWatch = useWatch({
    control,
    name: `deliveryOrders.${doIndex}.pos.${posIndex}.po_no` as any,
  });

  const soNoWatch = useWatch({
    control,
    name: `deliveryOrders.${doIndex}.pos.${posIndex}.so_no` as any,
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

  const hasPoOrSoNumber = Boolean(
    String(
      normalizedInbType === "PO" ? poNoWatch || "" : soNoWatch || "",
    ).trim(),
  );

  // Jika nomor PO/SO ada dan item sudah ter-mapping dari fetch, blokir input manual
  const cantAddManualAddItem =
    hasPoOrSoNumber && itemFields.length > 0;

  useEffect(() => {
    fetchAll();
    fetchAllUom();
  }, []);

  useEffect(() => {
    const path = `deliveryOrders.${doIndex}.pos.${posIndex}`;

    const currentPrincipal = getValues(`${path}.principal` as any);
    const currentVendorName = getValues(`${path}.vendor_name` as any);

    if (currentPrincipal && !currentVendorName) {
      setValue(`${path}.vendor_name` as any, currentPrincipal);
    }

    if ((isDetailMode || isEditMode) && dataPO) {
      const fieldName = "po_no"; // always po_no
      setValue(`${path}.${fieldName}` as any, dataPO);
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
  // const cantAddManualAddItem = !isDOChecked || isSuratJalanValidated || isPOValidated;

  const getDisabledCls = (disabled: boolean) =>
    disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white";

  // ✅ SEARCH PO
  const handleSearchPO = async () => {
    if (!doNo) return showErrorToast("Isi Surat Jalan terlebih dahulu.");
    const poNo = getValues(
      `deliveryOrders.${doIndex}.pos.${posIndex}.po_no` as any,
    );
    
    if (!poNo) return showErrorToast("Masukkan nomor PO !");
    setLoading(true);

    try {
      const { vendorName, vendorId, poDate, items } = await POsearchService(
        poNo,
        list,
        uomList,
      );

      const path = `deliveryOrders.${doIndex}.pos.${posIndex}`;

      if (vendorName) {
        setValue(`${path}.vendor_name` as any, vendorName);
        setValue(`${path}.principal` as any, vendorName);
      }

      if (vendorId) {
        setValue(`${path}.vendor_id` as any, vendorId);
      }

      if (poDate) {
        const isoDate = new Date(poDate).toISOString();
        setValue(`${path}.po_date` as any, isoDate);
      }
      setValue(`${path}.total_line_items` as any, items.length);
      // Replace penuh dari API (qty & qty_plan ikut ter-reset)
      replaceItems(items);
    } catch (err: any) {
      replaceItems([]);
      showErrorToast(err?.message ?? "Gagal fetch detail PO");
    } finally {
      setLoading(false);
    }
  };

  // ✅ SEARCH SO
  const handleSearchSO = async () => {
    const soNo = getValues(
      `deliveryOrders.${doIndex}.pos.${posIndex}.so_no` as any,
    );

    if (!soNo)
      return showErrorToast(
        `Masukkan nomor ${normalizedInbType === "SO_INTERNAL" ? "SO Internal" : "SO SubDist"} !`,
      );

    setLoading(true);
    try {
      const { vendorName, items } = await SOsearchService(soNo, list, uomList);

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

      // Replace penuh dari API (qty & qty_plan ikut ter-reset)
      replaceItems(items);
    } catch (err: any) {
      replaceItems([]);
      showErrorToast(
        err?.message ??
          `Gagal fetch detail ${normalizedInbType === "SO_INTERNAL" ? "SO Internal" : "SO SubDist"}`,
      );
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
            Nomor{" "}
            {normalizedInbType === "PO"
              ? "PO"
              : normalizedInbType === "SO_INTERNAL"
                ? "SO Internal"
                : "SO SubDist"}
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
                title={`Search ${normalizedInbType === "PO" ? "PO" : normalizedInbType === "SO_INTERNAL" ? "SO Internal" : "SO SubDist"}`}
              >
                <FaSearch />
              </Button>
            )}
          </div>
        </div>

        {/* Nama Pengirim */}
        <div>
          <Controller
            control={control}
            name={
              `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any
            }
            rules={{
              validate: (value) => {
                if (isDetailMode) return true;

                const principal = getValues(
                  `deliveryOrders.${doIndex}.pos.${posIndex}.principal` as any,
                );

                return (
                  Boolean((value || principal || "").trim()) ||
                  "Nama Pengirim wajib diisi"
                );
              },
            }}
            render={({ field, fieldState }) => (
              <>
                <label className="flex items-center justify-between gap-2 text-xs text-slate-600 mb-1">
                  <span>
                    Nama Pengirim{" "}
                    {!isDetailMode && <span className="text-red-500">*</span>}
                  </span>
                  {fieldState.error && (
                    <span className="text-xs text-red-500 shrink-0">
                      {fieldState.error.message}
                    </span>
                  )}
                </label>
                <input
                  className={`${inputCls} w-full ${getDisabledCls(isDetailMode ?? false)} ${
                    fieldState.error ? "border-red-500" : ""
                  }`}
                  value={field.value || principalWatch || ""}
                  readOnly={isDetailMode ?? false}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    field.onChange(val);
                    setValue(
                      `deliveryOrders.${doIndex}.pos.${posIndex}.principal` as any,
                      val,
                      { shouldValidate: true },
                    );
                  }}
                  onBlur={() => {
                    field.onBlur();
                    trigger(
                      `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
                    );
                  }}
                  placeholder={
                    isDetailMode ? "" : "Ketik manual jika tidak muncul..."
                  }
                />
              </>
            )}
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
                title={
                  cantAddManualAddItem
                    ? "Item sudah terisi dari PO/SO. Hapus nomor atau item terlebih dahulu untuk input manual."
                    : "Add Manual Item"
                }
              >
                + Add Manual Item
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
          inbType={normalizedInbType}
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
