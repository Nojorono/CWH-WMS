import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { FormValues } from "./formTypes";
import { inputCls } from "./constants";
import POCard from "./POCard";
import Button from "../../../../components/ui/button/Button";
import DatePicker from "../../../../components/form/date-picker";
import { FaPlus, FaTrash, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { toLocalISOString } from "../../../../helper/FormatDate";

export default function DeliveryOrderCard({
  doIndex,
  removeDO,
  totalDO,
}: {
  doIndex: number;
  removeDO: () => void;
  totalDO: number;
}) {
  const { control, register, setValue } = useFormContext<FormValues>();
  const {
    fields: posFields,
    append: appendPos,
    remove: removePos,
  } = useFieldArray({
    control,
    name: `deliveryOrders.${doIndex}.pos`,
  });

  const [open, setOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const handleToggle = () => setOpen(el.open);
    el.addEventListener("toggle", handleToggle);
    return () => el.removeEventListener("toggle", handleToggle);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-3">
      <details ref={detailsRef}>
        <summary className="flex justify-between items-center cursor-pointer px-3 py-2 bg-orange-100 rounded">
          {/* Kiri: marker custom + label */}
          <div className="flex items-center gap-2">
            {open ? (
              <FaChevronDown className="transition-transform" />
            ) : (
              <FaChevronRight className="transition-transform" />
            )}
            <span className="text-sm font-medium">
              Surat Jalan #{doIndex + 1}
            </span>
          </div>

          {/* Kanan: tombol */}
          <div className="flex gap-2 items-center">
            <Button
              size="xsm"
              type="button"
              variant="secondary"
              onClick={() =>
                appendPos({ po_no: "", inbound_type: "", items: [] })
              }
            >
              <FaPlus className="inline" />
              Add PO
            </Button>
            {totalDO > 1 && (
              <Button
                size="xsm"
                type="button"
                variant="danger"
                onClick={removeDO}
              >
                <FaTrash className="inline" />
                Discard
              </Button>
            )}
          </div>
        </summary>
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Delivery Order No
              </label>
              <input
                {...register(`deliveryOrders.${doIndex}.do_no` as const)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Attachment
              </label>
              <input
                type="file"
                className={inputCls}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setValue(`deliveryOrders.${doIndex}.attachment`, file);
                }}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">
                DO Date
              </label>
              <Controller
                control={control}
                name={`deliveryOrders.${doIndex}.date` as const}
                render={({ field }) => (
                  <DatePicker
                    id="date-picker"
                    placeholder="Select a date"
                    onChange={(date: Date | Date[]) => {
                      const selectedDate = Array.isArray(date) ? date[0] : date;
                      const formattedDate = selectedDate
                        ? toLocalISOString(selectedDate)
                        : "";
                      field.onChange(formattedDate);
                    }}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-3">
            {posFields.map((posField, posIndex) => (
              <POCard
                key={posField.id}
                doIndex={doIndex}
                posIndex={posIndex}
                removePos={() => removePos(posIndex)}
                totalPO={posFields.length}
              />
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
