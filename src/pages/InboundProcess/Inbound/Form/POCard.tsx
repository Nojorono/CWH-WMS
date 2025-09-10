import { useState } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { FormValues, ItemForm } from "./formTypes";
import { inputCls } from "./constants";
import ItemTable from "./ItemTable";
import AddItemModal from "./AddItemModal";
import Button from "../../../../components/ui/button/Button";
import DatePicker from "../../../../components/form/date-picker";
import { toLocalISOString } from "../../../../helper/FormatDate";

export default function POCard({
  doIndex,
  posIndex,
  removePos,
  totalPO,
}: {
  doIndex: number;
  posIndex: number;
  removePos: () => void;
  totalPO: number;
}) {
  const { control, register } = useFormContext<FormValues>();
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: `deliveryOrders.${doIndex}.pos.${posIndex}.items`,
  });

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-md p-3 bg-slate-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-600 mb-1">PO No</label>
          <input
            className={inputCls}
            {...register(
              `deliveryOrders.${doIndex}.pos.${posIndex}.po_no` as const
            )}
          />
        </div>


        <div>
          <label className="block text-xs text-slate-600 mb-1">PO Date</label>
          {/* Use Controller for custom DatePicker */}
          <Controller
            control={control}
            name={`deliveryOrders.${doIndex}.pos.${posIndex}.po_date` as const}
            render={({ field }) => (
              <DatePicker
                id={`deliveryOrders.${doIndex}.pos.${posIndex}.po_date`}
                placeholder="Select a date"
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date: Date | Date[]) => {
                  const selectedDate = Array.isArray(date) ? date[0] : date;
                  field.onChange(
                    selectedDate ? toLocalISOString(selectedDate) : ""
                  );
                }}
              />
            )}
          />
        </div>
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
      </div>

      <ItemTable
        data={itemFields as any as ItemForm[]}
        doIndex={doIndex}
        posIndex={posIndex}
        removeItem={removeItem}
      />

      <AddItemModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={(item) => appendItem(item)}
      />
    </div>
  );
}
