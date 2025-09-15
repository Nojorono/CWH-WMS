import { useState } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { FormValues, ItemForm } from "../formTypes";
import { inputCls, masterItems } from "../constants";
import ItemTable from "../Table/ItemTable";
import AddItemModal from "../Modal/AddItemModal";
import Button from "../../../../../../components/ui/button/Button";
import DatePicker from "../../../../../../components/form/date-picker";
import { toLocalISOString } from "../../../../../../helper/FormatDate";
import { FaSearch } from "react-icons/fa";

export default function POCard({
  doIndex,
  posIndex,
  removePos,
  totalPO,
  isEditMode,
}: {
  doIndex: number;
  posIndex: number;
  removePos: () => void;
  totalPO: number;
  isEditMode: boolean;
}) {
  const { control, register, getValues, setValue } =
    useFormContext<FormValues>();
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
    replace: replaceItems,
  } = useFieldArray({
    control,
    name: `deliveryOrders.${doIndex}.pos.${posIndex}.items`,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // mapping sebelum dilempar ke ItemTable
  const mappedItems: ItemForm[] = itemFields.map((item) => {
    const master = masterItems.find((m) => m.item_id === item.item_id);
    return {
      ...item,
      sku: master?.sku || item.sku || "",
      description: master?.description || item.description || "",
      item_number: master?.item_number || "",
      uom: master?.uom || item.uom || "",
    };
  });

  const getDisabledCls = (disabled: boolean) =>
    disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "";

  // fungsi search PO
  const handleSearchPO = async () => {
    const poNo = getValues(
      `deliveryOrders.${doIndex}.pos.${posIndex}.po_no`
    ) as string;

    if (!poNo) {
      alert("Masukkan nomor PO terlebih dahulu!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `http://10.0.29.49:8000/api/po_detail?po_no=${poNo}`
      );
      if (!res.ok) throw new Error("Gagal fetch PO");
      const data = await res.json();

      if (data && data.length > 0) {
        const po = data[0];

        // Set tanggal PO
        if (po.TANGGAL_PEMBUATAN_PO) {
          setValue(
            `deliveryOrders.${doIndex}.pos.${posIndex}.po_date`,
            new Date(po.TANGGAL_PEMBUATAN_PO).toISOString()
          );
        }

        // Map items ke bentuk ItemForm
        const items: ItemForm[] = po.ITEM.map((it: any) => ({
          item_id: it.PO_LINE_NUM.toString(),
          sku: it.SKU,
          description: it.DESKRIPSI_ITEM_LINE_PO,
          item_number: it.KODE_ITEM,
          qty: Number(it.PO_LINE_QUANTITY),
          uom: it.UOM,
          expired_date: "",
          classification: "",
        }));

        // Replace items di form
        replaceItems(items);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mencari PO");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-md p-3 bg-slate-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-600 mb-1">PO No</label>
          <div className="flex gap-2">
            <input
              className={`${inputCls} ${getDisabledCls(!isEditMode)}`}
              {...register(
                `deliveryOrders.${doIndex}.pos.${posIndex}.po_no` as const
              )}
              disabled={!isEditMode}
            />
            <Button
              type="button"
              variant="primary"
              size="xsm"
              onClick={handleSearchPO}
              disabled={!isEditMode || loading}
            >
              <FaSearch />
              {loading ? "Loading..." : "Search"}
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-600 mb-1">PO Date</label>
          <Controller
            control={control}
            name={`deliveryOrders.${doIndex}.pos.${posIndex}.po_date` as const}
            render={({ field }) => (
              <DatePicker
                id={`deliveryOrders.${doIndex}.pos.${posIndex}.po_date`}
                placeholder="Select a date"
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date: Date | Date[]) => {
                  if (!isEditMode) return;
                  const selectedDate = Array.isArray(date) ? date[0] : date;
                  field.onChange(
                    selectedDate ? toLocalISOString(selectedDate) : ""
                  );
                }}
                readOnly={!isEditMode}
              />
            )}
          />
        </div>

        {isEditMode && (
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              size="xsm"
              onClick={() => setIsOpen(true)}
            >
              + Add Item
            </Button>
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

      <ItemTable
        data={mappedItems}
        doIndex={doIndex}
        posIndex={posIndex}
        removeItem={removeItem}
        isEditMode={isEditMode}
      />

      {isEditMode && (
        <AddItemModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSave={(item) => appendItem(item)}
        />
      )}
    </div>
  );
}
