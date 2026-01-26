import { useEffect, useState } from "react";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { FormValues, ItemForm } from "../formTypes";
import { inputCls } from "../constants";
import ItemTable from "../Table/ItemTable";
import AddItemModal from "../Modal/AddItemModal";
import Button from "../../../../../../components/ui/button/Button";
import { formatDateIndo } from "../../../../../../helper/FormatDate";
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
  isDetailMode,
  isCreateMode,
  isAddToReceiveMode,
  InbType,
  dataPO,
  isDOChecked,
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
}) {
  const { fetchAll, list } = useStoreItem();
  const { fetchAll: fetchAllUom, list: uomList } = useStoreUom();

  useEffect(() => {
    fetchAll();
    fetchAllUom();
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

  // Reactive DO No
  const doNo = useWatch({
    control,
    name: `deliveryOrders.${doIndex}.do_no`,
  });

  // Tentukan mode
  const resolvedMode = (() => {
    if (isDetailMode) return "detail";
    if (isEditMode) return "edit";
    if (isCreateMode) return "create";
    if (isAddToReceiveMode) return "create";
    return "unknown";
  })();

  /**
   * ===========================
   * 🔒 KONTROL DISABLE FIELD
   * ===========================
   */

  // ✅ DO Field: selalu aktif di mode Create/Edit
  const isDOFieldDisabled = resolvedMode === "detail";

  // ✅ PO/SO Field: aktif di Edit, atau di Create kalau DO sudah dicek
  const isPOFieldDisabled =
    resolvedMode === "detail" || (resolvedMode === "create" && !isDOChecked);

  // ✅ Tombol Add Item: hanya aktif kalau PO/SO boleh diisi
  const canAddItem =
    resolvedMode === "edit" || (resolvedMode === "create" && isDOChecked);

  // =========================================
  // 🧩 Mapping item
  // =========================================
  const mappedItems: ItemForm[] = itemFields.map((item) => {
    const master = list.find((m) => m.id === item.item_id);
    const quantity_inspection = (item as any).quantity_inspection ?? 0;
    return {
      ...item,
      sku: master?.sku || item.sku || "",
      description: master?.description || item.description || "",
      item_number: master?.item_number || item.item_number || "",
      uom: item.uom || "",
      quantity_inspection,
    };
  });

  const getDisabledCls = (disabled: boolean) =>
    disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "";

  // ===== Fetch PO =====
  const handleSearchPO = async () => {
    if (!doNo) {
      showErrorToast("Isi Surat Jalan terlebih dahulu sebelum mencari PO.");
      return;
    }

    const poNo = getValues(
      `deliveryOrders.${doIndex}.pos.${posIndex}.po_no`
    ) as string;

    if (!poNo) {
      showErrorToast("Masukkan nomor PO terlebih dahulu!");
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
        setValue(`deliveryOrders.${doIndex}.pos.${posIndex}.po_date`, "");
        setValue(
          `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
          ""
        );
        replaceItems([]);
        showErrorToast(
          `Detail PO ${poNo} tidak ditemukan di META. Tambahkan Item secara manual.`
        );
        return;
      }

      if (data && data.length > 0) {
        const po = data[0];

        if (po.TANGGAL_PEMBUATAN_PO) {
          setValue(
            `deliveryOrders.${doIndex}.pos.${posIndex}.po_date`,
            new Date(po.TANGGAL_PEMBUATAN_PO).toISOString()
          );
        }

        // Set Nama Vendor (Casting to any to avoid TS Error)
        if (po.NAMA_VENDOR) {
          setValue(
            `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
            po.NAMA_VENDOR
          );
        }

        console.log("nama Vendor:", po.NAMA_VENDOR);

        const items: ItemForm[] = [];
        let notFound: string[] = [];

        po.ITEM?.forEach?.((it: any) => {
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
              uom: it.ORDER_QUANTITY_UOM ?? it.UOM ?? "DUS",
              expired_date: "",
              classification: "",
              qty_plan: () => 0,
              id: String(master.id ?? ""),
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

  // ===== Fetch SO =====
  const handleSearchSO = async () => {
    const soNo = getValues(
      `deliveryOrders.${doIndex}.pos.${posIndex}.so_no`
    ) as string;

    if (!soNo) {
      showErrorToast("Masukkan nomor SO terlebih dahulu!");
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
        setValue(`deliveryOrders.${doIndex}.pos.${posIndex}.so_date`, "");
        setValue(
          `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
          ""
        );
        replaceItems([]);

        showErrorToast(`Detail SO ${soNo} tidak ditemukan di META.`);
        return;
      }

      const so = data[0];

      if (so.ORDERED_DATE) {
        setValue(
          `deliveryOrders.${doIndex}.pos.${posIndex}.so_date`,
          formatDateIndo(new Date(so.ORDERED_DATE))
        );
      }

      // Set Nama Vendor (Casting to any to avoid TS Error)
      if (so.ORG_NAME) {
        setValue(
          `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
          so.ORG_NAME
        );
      }

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
            uom: it.ORDER_QUANTITY_UOM ?? "DUS",
            expired_date: "",
            classification: "",
            qty_plan: () => 0,
            id: String(master.id ?? ""),
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
    <div className="relative border rounded-md p-3 bg-slate-50">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-50">
          <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></span>
          <span className="ml-2 text-blue-600 font-semibold">Loading...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        {/* === Input PO / SO === */}
        <div>
          {InbType === "PO" && (
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Nomor PO
              </label>
              <div className="flex flex-col gap-2 w-full sm:flex-row">
                <input
                  className={`${inputCls} ${getDisabledCls(
                    isPOFieldDisabled
                  )} w-full flex-1 min-w-0`}
                  {...register(
                    `deliveryOrders.${doIndex}.pos.${posIndex}.po_no` as const
                  )}
                  defaultValue={dataPO || ""}
                  disabled={isPOFieldDisabled}
                />
                {!isDetailMode && (
                  <div className="relative group">
                    <Button
                      type="button"
                      variant="primary"
                      size="xsm"
                      onClick={handleSearchPO}
                      disabled={isPOFieldDisabled || loading}
                      className="flex-shrink-0 w-full sm:w-auto"
                    >
                      <FaSearch />
                    </Button>
                    <div className="absolute left-1/2 -translate-x-1/2 mt-1 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      Cari PO
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {InbType === "SO" && (
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Nomor SO
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className={`${inputCls} ${getDisabledCls(
                    isPOFieldDisabled
                  )} w-full flex-1 min-w-0`}
                  {...register(
                    `deliveryOrders.${doIndex}.pos.${posIndex}.so_no` as const
                  )}
                  defaultValue={dataPO || ""}
                  disabled={isPOFieldDisabled}
                />
                {!isDetailMode && (
                  <div className="relative group">
                    <Button
                      type="button"
                      variant="primary"
                      size="xsm"
                      onClick={handleSearchSO}
                      disabled={isPOFieldDisabled || loading}
                      className="flex-shrink-0 sm:w-auto w-full"
                    >
                      <FaSearch />
                    </Button>
                    <div className="absolute left-1/2 -translate-x-1/2 mt-1 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      Cari SO
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* NAMA VENDOR DISINI */}
        {!isDetailMode && (
          <div>
            <label className="block text-xs text-slate-600 mb-1">
              Nama Pengirim
            </label>
            <input
              className={`${inputCls} bg-gray-100 text-gray-500 cursor-not-allowed w-full`}
              {...register(
                `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any
              )}
              placeholder="Otomatis terisi jika ada..."
              readOnly
            />
          </div>
        )}

        {/* === Tombol Tambah / Hapus PO === */}
        {!isDetailMode && (
          <div className="flex flex-wrap gap-2 justify-end">
            {canAddItem && (
              <Button
                type="button"
                variant="secondary"
                size="xsm"
                onClick={() => setIsOpen(true)}
                className="w-full sm:w-auto"
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
                className="w-full sm:w-auto"
              >
                Remove PO
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ======= Item Table ======= */}
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

      {/* ======= Modal ======= */}
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
