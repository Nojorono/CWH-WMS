import { useEffect, useState } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { FormValues, ItemForm } from "../formTypes";
import { inputCls } from "../constants";
import ItemTable from "../Table/ItemTable";
import AddItemModal from "../Modal/AddItemModal";
import Button from "../../../../../../components/ui/button/Button";
import DatePicker from "../../../../../../components/form/date-picker";
import { toLocalISOString } from "../../../../../../helper/FormatDate";
import { FaSearch } from "react-icons/fa";

import {
  useStoreItem,
  useStoreUom,
} from "../../../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast } from "../../../../../../components/toast";

export default function POCard({
  doIndex,
  posIndex,
  removePos,
  totalPO,
  isEditMode,
  InbType,
}: {
  doIndex: number;
  posIndex: number;
  removePos: () => void;
  totalPO: number;
  isEditMode: boolean;
  InbType: string;
}) {
  const { fetchAll, list } = useStoreItem();
  const { fetchAll: fetchAllUom, list: uomList } = useStoreUom();

  console.log("Rendering POCard - UoM List:", uomList);

  useEffect(() => {
    fetchAll();
    fetchAllUom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // mapping sebelum dilempar ke ItemTable, gunakan data dari list
  const mappedItems: ItemForm[] = itemFields.map((item) => {
    const master = list.find((m) => m.id === item.item_id);
    return {
      ...item,
      sku: master?.sku || item.sku || "",
      description: master?.description || item.description || "",
      item_number: master?.item_number || item.item_number || "",
      uom: item.uom || "", // UOM nanti dari useStoreUom
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
      if (Array.isArray(data) && data.length === 0) {
        showErrorToast(`Detail PO ${poNo} tidak ditemukan di META.`);
        return;
      }

      if (data && data.length > 0) {
        const po = data[0];

        // Set tanggal PO
        if (po.TANGGAL_PEMBUATAN_PO) {
          setValue(
            `deliveryOrders.${doIndex}.pos.${posIndex}.po_date`,
            new Date(po.TANGGAL_PEMBUATAN_PO).toISOString()
          );
        }

        // Cek mapping item dengan masterItems (list)
        const items: ItemForm[] = [];
        let notFound: string[] = [];

        po.ITEM?.forEach?.((it: any) => {
          // cari di master list berdasarkan kode item atau SKU
          const master = list.find(
            (m) => m.item_number === it.KODE_ITEM || m.sku === it.SKU
          );

          if (!master) {
            notFound.push(`${it.KODE_ITEM} (${it.DESKRIPSI_ITEM_LINE_PO})`);
          } else {
            items.push({
              item_id: String(master.id ?? ""),
              item_name: master.description ?? "",
              sku: master.sku ?? "",
              item_number: master.item_number ?? "",
              description: master.description ?? "",
              qty: Number(it.PO_LINE_QUANTITY),
              uom: "DUS",
              expired_date: "",
              classification: "",
              qty_plan: () => 0, // Fix: provide dummy implementation
            });
          }
        });

        if (notFound.length > 0) {
          showErrorToast(
            `Item berikut tidak ada di Master Item:\n- ${notFound.join("\n- ")}`
          );
        }

        if (items.length > 0) {
          replaceItems(items);
        }
      }
    } catch (err) {
      console.error(err);
      showErrorToast(`Gagal mencari PO, ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==== Tambahkan fungsi fetch SO ====
  const handleSearchSO = async () => {
    const soNo = getValues(
      `deliveryOrders.${doIndex}.pos.${posIndex}.so_no`
    ) as string;

    if (!soNo) {
      alert("Masukkan nomor SO terlebih dahulu!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `http://10.0.29.49:9000/api/v1/sales-order?order_number=${soNo}`
      );
      if (!res.ok) throw new Error("Gagal fetch SO");
      const result = await res.json();

      const data = result?.data?.data || [];
      if (!Array.isArray(data) || data.length === 0) {
        showErrorToast(`Detail SO ${soNo} tidak ditemukan di META.`);
        return;
      }

      const so = data[0];

      // Set tanggal SO (ORDERED_DATE)
      if (so.ORDERED_DATE) {
        setValue(
          `deliveryOrders.${doIndex}.pos.${posIndex}.so_date`,
          toLocalISOString(new Date(so.ORDERED_DATE))
        );
      }

      // Mapping items dari SO
      const items: ItemForm[] = [];
      let notFound: string[] = [];

      so.ITEM?.forEach?.((it: any) => {
        const master = list.find(
          (m) => m.item_number === it.ITEM_NUMBER || m.sku === it.ITEM_CODE
        );

        if (!master) {
          notFound.push(`${it.ITEM_NUMBER} (${it.ITEM_DESC})`);
        } else {
          items.push({
            item_id: String(master.id ?? ""),
            item_name: master.description ?? "",
            sku: master.sku ?? it.ITEM_CODE ?? "",
            item_number: master.item_number ?? it.ITEM_NUMBER ?? "",
            description: master.description ?? it.ITEM_DESC ?? "",
            qty: Number(it.ORDERED_QUANTITY),
            uom: "DUS",
            expired_date: "",
            classification: "",
            qty_plan: () => 0, // Fix: provide dummy implementation
          });
        }
      });

      if (notFound.length > 0) {
        showErrorToast(
          `Item berikut tidak ada di Master Item:\n- ${notFound.join("\n- ")}`
        );
      }

      if (items.length > 0) {
        replaceItems(items);
      }
    } catch (err) {
      console.error(err);
      showErrorToast(`Gagal mencari SO, ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-md p-3 bg-slate-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          {InbType === "PO" && (
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Nomor PO
              </label>
              <div className="flex gap-2">
                <input
                  className={`${inputCls} ${getDisabledCls(
                    !isEditMode
                  )} w-40 md:w-60`}
                  {...register(
                    `deliveryOrders.${doIndex}.pos.${posIndex}.po_no` as const
                  )}
                  disabled={!isEditMode}
                />
                {isEditMode && (
                  <Button
                    type="button"
                    variant="primary"
                    size="xsm"
                    onClick={handleSearchPO}
                    disabled={!isEditMode || loading}
                  >
                    <FaSearch />
                    {loading ? "Loading..." : "Cari PO"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {InbType === "SO" && (
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Nomor SO
              </label>
              <div className="flex gap-2">
                <input
                  className={`${inputCls} ${getDisabledCls(
                    !isEditMode
                  )} w-40 md:w-60`}
                  {...register(
                    `deliveryOrders.${doIndex}.pos.${posIndex}.so_no` as const
                  )}
                  disabled={!isEditMode}
                />
                {isEditMode && (
                  <Button
                    type="button"
                    variant="primary"
                    size="xsm"
                    onClick={handleSearchSO}
                    disabled={!isEditMode || loading}
                  >
                    <FaSearch />
                    {loading ? "Loading..." : "Cari SO"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* tanggal PO / SO */}
        {/* <div>
          <label className="block text-xs text-slate-600 mb-1">
            {InbType === "PO" ? "Tanggal PO" : "Tanggal SO"}
          </label>
          <Controller
            control={control}
            name={
              `deliveryOrders.${doIndex}.pos.${posIndex}.${
                InbType === "PO" ? "po_date" : "so_date"
              }` as const
            }
            render={({ field }) => (
              <DatePicker
                id={`deliveryOrders.${doIndex}.pos.${posIndex}.${
                  InbType === "PO" ? "po_date" : "so_date"
                }`}
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
        </div> */}

        {/* Tanggal PO lama */}
        {/* <div>
          <label className="block text-xs text-slate-600 mb-1">
            Tanggal PO
          </label>
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
        </div> */}

        {InbType === "PO" && (
          <Controller
            control={control}
            name={`deliveryOrders.${doIndex}.pos.${posIndex}.po_date`}
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
        )}

        {InbType === "SO" && (
          <Controller
            control={control}
            name={`deliveryOrders.${doIndex}.pos.${posIndex}.so_date`}
            render={({ field }) => (
              <DatePicker
                id={`deliveryOrders.${doIndex}.pos.${posIndex}.so_date`}
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
        )}

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
