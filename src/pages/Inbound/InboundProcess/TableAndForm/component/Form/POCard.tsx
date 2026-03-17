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
import { MetaService, Server47 } from "../../../../../../utils/EndPoint";

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

  // Watchers untuk reaktivitas UI
  const doNo = useWatch({ control, name: `deliveryOrders.${doIndex}.do_no` });
  const vendorNameWatch = useWatch({
    control,
    name: `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
  });
  const principalWatch = useWatch({
    control,
    name: `deliveryOrders.${doIndex}.pos.${posIndex}.principal` as any,
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

    // Ambil nilai mentah dari state
    const currentPrincipal = getValues(`${path}.principal` as any);
    const currentVendorName = getValues(`${path}.vendor_name` as any);

    // 1. Jika vendor_name kosong tapi principal ada, paksa isi vendor_name (sinkronisasi awal)
    if (currentPrincipal && !currentVendorName) {
      setValue(`${path}.vendor_name` as any, currentPrincipal);
    }

    // 2. Jika mode detail/edit, pastikan nomor PO terisi di field form
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
    resolvedMode === "detail" || (resolvedMode === "create" && !isDOChecked);
  const canAddItem =
    resolvedMode === "edit" || (resolvedMode === "create" && isDOChecked);
  const getDisabledCls = (disabled: boolean) =>
    disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white";

  const handleSearchPO = async () => {
    if (!doNo) return showErrorToast("Isi Surat Jalan terlebih dahulu.");
    const poNo = getValues(
      `deliveryOrders.${doIndex}.pos.${posIndex}.po_no` as any,
    );
    if (!poNo) return showErrorToast("Masukkan nomor PO!");

    setLoading(true);
    try {
      const res = await fetch(`${MetaService}/purchase-order?nomorPO=${poNo}`);
      const json = await res.json();
      const data = json?.data?.data?.[0];

      if (!data) {
        replaceItems([]);
        return showErrorToast(`PO ${poNo} tidak ditemukan.`);
      }

      if (data.NAMA_VENDOR) {
        const name = data.NAMA_VENDOR.toUpperCase();
        setValue(
          `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
          name,
        );
        setValue(
          `deliveryOrders.${doIndex}.pos.${posIndex}.principal` as any,
          name,
        );
      }

      const items = data.ITEM?.map((it: any) => {
        const master = list.find(
          (m) => m.item_number === it.KODE_ITEM || m.sku === it.SKU,
        );
        return master
          ? {
              item_id: String(master.id),
              item_name: master.description,
              sku: master.sku,
              item_number: master.item_number,
              description: master.description,
              qty: Number(it.PO_LINE_QUANTITY),
              uom: it.UOM || "DUS",
              id: String(master.id),
            }
          : null;
      }).filter(Boolean);

      replaceItems(items || []);
    } catch (err) {
      showErrorToast("Gagal mencari PO");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSO = async () => {
    const soNo = getValues(
      `deliveryOrders.${doIndex}.pos.${posIndex}.so_no` as any,
    );
    if (!soNo) return showErrorToast("Masukkan nomor SO!");

    setLoading(true);
    try {
      const res = await fetch(
        `${Server47}/api/v1/sales-order?order_number=${soNo}`,
      );
      const json = await res.json();
      const data = json?.data?.data?.[0];

      if (!data) return showErrorToast(`SO ${soNo} tidak ditemukan.`);

      if (data.ORG_NAME) {
        const name = data.ORG_NAME.toUpperCase();
        setValue(
          `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
          name,
        );
        setValue(
          `deliveryOrders.${doIndex}.pos.${posIndex}.principal` as any,
          name,
        );
      }

      const items = data.ITEM?.map((it: any) => {
        const master = list.find(
          (m) =>
            m.item_number === it.ITEM_NUMBER ||
            String(m.id) === String(it.INVENTORY_ITEM_ID),
        );
        return master
          ? {
              item_id: String(master.id),
              item_name: master.description || it.ITEM_DESC,
              sku: master.sku || it.ITEM_CODE,
              item_number: master.item_number || it.ITEM_NUMBER,
              description: master.description || it.ITEM_DESC,
              qty: Number(it.ORDERED_QUANTITY),
              uom: it.ORDER_QUANTITY_UOM || "DUS",
              id: String(master.id),
            }
          : null;
      }).filter(Boolean);

      replaceItems(items || []);
    } catch (err) {
      showErrorToast("Gagal mencari SO");
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
              className={`${inputCls} ${getDisabledCls(isPOFieldDisabled)} flex-1`}
              {...register(
                `deliveryOrders.${doIndex}.pos.${posIndex}.${normalizedInbType === "PO" ? "po_no" : "so_no"}` as any,
              )}
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

        {/* Nama Pengirim (Sinkron Principal & Vendor Name) */}
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
            // Gunakan fallback principalWatch jika vendorNameWatch kosong (sering terjadi di mode detail)
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

// OLD CODE
// import { useEffect, useState } from "react";
// import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
// import { FormValues, ItemForm } from "../formTypes";
// import { inputCls } from "../constants";
// import ItemTable from "../Table/ItemTable";
// import AddItemModal from "../Modal/AddItemModal";
// import Button from "../../../../../../components/ui/button/Button";
// import { formatDateIndo } from "../../../../../../helper/FormatDate";
// import { FaSearch } from "react-icons/fa";
// import {
//   useStoreItem,
//   useStoreUom,
// } from "../../../../../../DynamicAPI/stores/Store/MasterStore";
// import { showErrorToast } from "../../../../../../components/toast";
// import { MetaService, Server47 } from "../../../../../../utils/EndPoint";

// export default function POCard({
//   doIndex,
//   posIndex,
//   removePos,
//   totalPO,
//   isEditMode,
//   isDetailMode,
//   isCreateMode,
//   isAddToReceiveMode,
//   InbType,
//   dataPO,
//   isDOChecked,
// }: {
//   doIndex: number;
//   posIndex: number;
//   removePos: () => void;
//   totalPO: number;
//   isEditMode?: boolean;
//   isDetailMode?: boolean;
//   isCreateMode?: boolean;
//   isAddToReceiveMode?: boolean;
//   InbType: string;
//   dataPO?: any;
//   isDOChecked?: boolean;
// }) {
//   const { fetchAll, list } = useStoreItem();
//   const { fetchAll: fetchAllUom, list: uomList } = useStoreUom();

//   const normalizedInbType: string =
//     typeof InbType === "object" && InbType !== null
//       ? ((InbType as any).value ?? "")
//       : (InbType ?? "");

//   useEffect(() => {
//     fetchAll();
//     fetchAllUom();
//   }, []);

//   const { control, register, getValues, setValue } =
//     useFormContext<FormValues>();
//   const {
//     fields: itemFields,
//     append: appendItem,
//     remove: removeItem,
//     replace: replaceItems,
//   } = useFieldArray({
//     control,
//     name: `deliveryOrders.${doIndex}.pos.${posIndex}.items`,
//   });

//   const [isOpen, setIsOpen] = useState(false);
//   const [loading, setLoading] = useState(false);

//   // Reactive DO No
//   const doNo = useWatch({
//     control,
//     name: `deliveryOrders.${doIndex}.do_no`,
//   });

//   // Tentukan mode
//   const resolvedMode = (() => {
//     if (isDetailMode) return "detail";
//     if (isEditMode) return "edit";
//     if (isCreateMode) return "create";
//     if (isAddToReceiveMode) return "create";
//     return "unknown";
//   })();

//   /**
//    * ===========================
//    * 🔒 KONTROL DISABLE FIELD
//    * ===========================
//    */

//   // ✅ DO Field: selalu aktif di mode Create/Edit
//   const isDOFieldDisabled = resolvedMode === "detail";

//   // ✅ PO/SO Field: aktif di Edit, atau di Create kalau DO sudah dicek
//   const isPOFieldDisabled =
//     resolvedMode === "detail" || (resolvedMode === "create" && !isDOChecked);

//   // ✅ Tombol Add Item: hanya aktif kalau PO/SO boleh diisi
//   const canAddItem =
//     resolvedMode === "edit" || (resolvedMode === "create" && isDOChecked);

//   // =========================================
//   // 🧩 Mapping item
//   // =========================================
//   const mappedItems: ItemForm[] = itemFields.map((item) => {
//     const master = list.find((m) => m.id === item.item_id);
//     const quantity_inspection = (item as any).quantity_inspection ?? 0;
//     return {
//       ...item,
//       sku: master?.sku || item.sku || "",
//       description: master?.description || item.description || "",
//       item_number: master?.item_number || item.item_number || "",
//       uom: item.uom || "",
//       quantity_inspection,
//     };
//   });

//   const getDisabledCls = (disabled: boolean) =>
//     disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "";

//   // ===== Fetch PO =====
//   const handleSearchPO = async () => {
//     if (!doNo) {
//       showErrorToast("Isi Surat Jalan terlebih dahulu sebelum mencari PO.");
//       return;
//     }

//     const poNo = getValues(
//       `deliveryOrders.${doIndex}.pos.${posIndex}.po_no`,
//     ) as string;

//     if (!poNo) {
//       showErrorToast("Masukkan nomor PO terlebih dahulu!");
//       return;
//     }

//     const parseOracleDate = (dateStr: string): string => {
//       const months: Record<string, string> = {
//         JAN: "01",
//         FEB: "02",
//         MAR: "03",
//         APR: "04",
//         MAY: "05",
//         JUN: "06",
//         JUL: "07",
//         AUG: "08",
//         SEP: "09",
//         OCT: "10",
//         NOV: "11",
//         DEC: "12",
//       };
//       const [day, mon, year] = dateStr.split("-");
//       return new Date(`${year}-${months[mon]}-${day}`).toISOString();
//     };

//     setLoading(true);
//     try {
//       const res = await fetch(`${MetaService}/purchase-order?nomorPO=${poNo}`);

//       if (!res.ok) throw new Error("Failed fetch PO");

//       const json = await res.json();
//       const data: any[] = json?.data?.data ?? [];

//       if (data.length === 0) {
//         setValue(`deliveryOrders.${doIndex}.pos.${posIndex}.po_date`, "");
//         setValue(
//           `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
//           "",
//         );
//         replaceItems([]);
//         showErrorToast(
//           `Detail PO ${poNo} tidak ditemukan di META. Tambahkan Item secara manual.`,
//         );
//         return;
//       }

//       const po = data[0];

//       if (po.TANGGAL_PEMBUATAN_PO) {
//         setValue(
//           `deliveryOrders.${doIndex}.pos.${posIndex}.po_date`,
//           parseOracleDate(po.TANGGAL_PEMBUATAN_PO),
//         );
//       }

//       if (po.NAMA_VENDOR) {
//         const vendorName = po.NAMA_VENDOR.toUpperCase();
//         setValue(
//           `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
//           vendorName,
//         );
//         setValue(
//           `deliveryOrders.${doIndex}.pos.${posIndex}.principal` as any,
//           vendorName,
//         ); // Tambahkan ini
//       }

//       const items: ItemForm[] = [];
//       const notFound: string[] = [];

//       po.ITEM?.forEach?.((it: any) => {
//         const master = list.find(
//           (m) => m.item_number === it.KODE_ITEM || m.sku === it.SKU,
//         );

//         if (!master) {
//           notFound.push(`${it.KODE_ITEM} (${it.DESKRIPSI_ITEM_LINE_PO})`);
//         } else {
//           items.push({
//             item_id: String(master.id ?? ""),
//             item_name: master.description ?? "",
//             sku: master.sku ?? "",
//             item_number: master.item_number ?? "",
//             description: master.description ?? "",
//             qty: Number(it.PO_LINE_QUANTITY),
//             uom: it.UOM ?? "",
//             expired_date: "",
//             classification: "",
//             qty_plan: () => 0,
//             id: String(master.id ?? ""),
//           });
//         }
//       });

//       if (notFound.length > 0) {
//         showErrorToast(
//           `Item berikut tidak ada di Master Item:\n- ${notFound.join("\n- ")}`,
//         );
//       }

//       if (items.length > 0) {
//         replaceItems(items);
//       }
//     } catch (err) {
//       console.error(err);
//       showErrorToast(`Gagal mencari PO, ${(err as Error).message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ===== Fetch SO =====
//   const handleSearchSO = async () => {
//     const soNo = getValues(
//       `deliveryOrders.${doIndex}.pos.${posIndex}.so_no`,
//     ) as string;

//     if (!soNo) {
//       showErrorToast("Masukkan nomor SO terlebih dahulu!");
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await fetch(
//         `${Server47}/api/v1/sales-order?order_number=${soNo}`,
//       );
//       if (!res.ok) throw new Error("Failed fetch SO");
//       const json = await res.json();

//       const data: any[] = json?.data?.data ?? [];

//       if (data.length === 0) {
//         setValue(`deliveryOrders.${doIndex}.pos.${posIndex}.so_date`, "");
//         setValue(
//           `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
//           "",
//         );
//         replaceItems([]);
//         showErrorToast(`Detail SO ${soNo} tidak ditemukan di META.`);
//         return;
//       }

//       const so = data[0];

//       if (so.ORDERED_DATE) {
//         setValue(
//           `deliveryOrders.${doIndex}.pos.${posIndex}.so_date`,
//           formatDateIndo(new Date(so.ORDERED_DATE)),
//         );
//       }

//       if (so.ORG_NAME) {
//         const vendorName = so.ORG_NAME.toUpperCase();
//         setValue(
//           `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
//           vendorName,
//         );
//         setValue(
//           `deliveryOrders.${doIndex}.pos.${posIndex}.principal` as any,
//           vendorName,
//         ); // Tambahkan ini
//       }

//       const items: ItemForm[] = [];
//       const notFound: string[] = [];

//       so.ITEM?.forEach?.((it: any) => {
//         // ITEM_NUMBER & ITEM_CODE bisa null dari API,
//         // fallback matching via INVENTORY_ITEM_ID
//         const master = list.find(
//           (m) =>
//             (it.ITEM_NUMBER && m.item_number === it.ITEM_NUMBER) ||
//             (it.ITEM_CODE && m.sku === it.ITEM_CODE) ||
//             (it.INVENTORY_ITEM_ID &&
//               String(m.id) === String(it.INVENTORY_ITEM_ID)),
//         );

//         if (!master) {
//           notFound.push(`${it.INVENTORY_ITEM_ID} (${it.ITEM_DESC})`);
//         } else {
//           items.push({
//             item_id: String(master.id ?? ""),
//             item_name: master.description ?? it.ITEM_DESC ?? "",
//             sku: master.sku ?? it.ITEM_CODE ?? "",
//             item_number: master.item_number ?? it.ITEM_NUMBER ?? "",
//             description: master.description ?? it.ITEM_DESC ?? "",
//             qty: Number(it.ORDERED_QUANTITY),
//             uom: it.ORDER_QUANTITY_UOM ?? "DUS",
//             expired_date: "",
//             classification: "",
//             qty_plan: () => 0,
//             id: String(master.id ?? ""),
//           });
//         }
//       });

//       if (notFound.length > 0) {
//         showErrorToast(
//           `Item berikut tidak ada di Master Item:\n- ${notFound.join("\n- ")}`,
//         );
//       }

//       if (items.length > 0) {
//         replaceItems(items);
//       }
//     } catch (err) {
//       console.error(err);
//       showErrorToast(`Gagal mencari SO, ${(err as Error).message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Di dalam POCard.tsx
//   const handleVendorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const upperValue = e.target.value.toUpperCase();

//     // Update vendor_name (untuk UI)
//     setValue(
//       `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
//       upperValue,
//     );

//     // Update principal (untuk Payload API)
//     setValue(
//       `deliveryOrders.${doIndex}.pos.${posIndex}.principal` as any,
//       upperValue,
//     );
//   };

//   return (
//     <div className="relative border rounded-md p-3 bg-slate-50">
//       {loading && (
//         <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-50">
//           <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></span>
//           <span className="ml-2 text-blue-600 font-semibold">Loading...</span>
//         </div>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
//         {/* === Input PO / SO === */}
//         <div>
//           {normalizedInbType === "PO" && (
//             <div>
//               <label className="block text-xs text-slate-600 mb-1">
//                 Nomor PO
//               </label>
//               <div className="flex flex-col gap-2 w-full sm:flex-row">
//                 <input
//                   className={`${inputCls} ${getDisabledCls(
//                     isPOFieldDisabled,
//                   )} w-full flex-1 min-w-0`}
//                   {...register(
//                     `deliveryOrders.${doIndex}.pos.${posIndex}.po_no` as const,
//                   )}
//                   defaultValue={dataPO || ""}
//                   disabled={isPOFieldDisabled}
//                 />
//                 {!isDetailMode && (
//                   <div className="relative group">
//                     <Button
//                       type="button"
//                       variant="primary"
//                       size="xsm"
//                       onClick={handleSearchPO}
//                       disabled={isPOFieldDisabled || loading}
//                       className="flex-shrink-0 w-full sm:w-auto"
//                     >
//                       <FaSearch />
//                     </Button>
//                     <div className="absolute left-1/2 -translate-x-1/2 mt-1 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
//                       Cari PO
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {normalizedInbType === "SO" && (
//             <div>
//               <label className="block text-xs text-slate-600 mb-1">
//                 Nomor SO
//               </label>
//               <div className="flex flex-col sm:flex-row gap-2">
//                 <input
//                   className={`${inputCls} ${getDisabledCls(
//                     isPOFieldDisabled,
//                   )} w-full flex-1 min-w-0`}
//                   {...register(
//                     `deliveryOrders.${doIndex}.pos.${posIndex}.so_no` as const,
//                   )}
//                   defaultValue={dataPO || ""}
//                   disabled={isPOFieldDisabled}
//                 />
//                 {!isDetailMode && (
//                   <div className="relative group">
//                     <Button
//                       type="button"
//                       variant="primary"
//                       size="xsm"
//                       onClick={handleSearchSO}
//                       disabled={isPOFieldDisabled || loading}
//                       className="flex-shrink-0 sm:w-auto w-full"
//                     >
//                       <FaSearch />
//                     </Button>
//                     <div className="absolute left-1/2 -translate-x-1/2 mt-1 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
//                       Cari SO
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* NAMA VENDOR / PENGIRIM */}
//         <div>
//           <label className="block text-xs text-slate-600 mb-1">
//             Nama Pengirim{" "}
//             {resolvedMode !== "detail" && (
//               <span className="text-red-500">*</span>
//             )}
//           </label>
//           <input
//             className={`${inputCls} w-full ${
//               isDetailMode
//                 ? "bg-gray-100 text-gray-500 cursor-not-allowed"
//                 : "bg-white"
//             }`}
//             {...register(
//               `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
//               {
//                 required: resolvedMode !== "detail",
//                 // Mengubah input menjadi uppercase saat user mengetik
//                 onChange: (e) => {
//                   const val = e.target.value.toUpperCase();
//                   setValue(
//                     `deliveryOrders.${doIndex}.pos.${posIndex}.vendor_name` as any,
//                     val,
//                   );
//                   setValue(
//                     `deliveryOrders.${doIndex}.pos.${posIndex}.principal` as any,
//                     val,
//                   );
//                 },
//               },
//             )}
//             placeholder={
//               isDetailMode ? "" : "Ketik manual jika tidak muncul..."
//             }
//             readOnly={isDetailMode}
//           />
//         </div>

//         {/* === Tombol Tambah / Hapus PO === */}
//         {!isDetailMode && (
//           <div className="flex flex-wrap gap-2 justify-end">
//             {canAddItem && (
//               <Button
//                 type="button"
//                 variant="secondary"
//                 size="xsm"
//                 onClick={() => setIsOpen(true)}
//                 className="w-full sm:w-auto"
//               >
//                 + Add Item
//               </Button>
//             )}
//             {totalPO > 1 && (
//               <Button
//                 type="button"
//                 variant="danger"
//                 size="xsm"
//                 onClick={removePos}
//                 className="w-full sm:w-auto"
//               >
//                 Remove PO
//               </Button>
//             )}
//           </div>
//         )}
//       </div>

//       {/* ======= Item Table ======= */}
//       <div className="mt-3 overflow-x-auto">
//         <ItemTable
//           items={itemFields}
//           itemsPath={`deliveryOrders.${doIndex}.pos.${posIndex}.items`}
//           doIndex={doIndex}
//           posIndex={posIndex}
//           removeItem={removeItem}
//           isEditMode={canAddItem}
//           uomList={uomList}
//         />
//       </div>

//       {/* ======= Modal ======= */}
//       {!isDetailMode && (
//         <AddItemModal
//           isOpen={isOpen}
//           onClose={() => setIsOpen(false)}
//           onSave={(item) => appendItem(item)}
//         />
//       )}
//     </div>
//   );
// }
