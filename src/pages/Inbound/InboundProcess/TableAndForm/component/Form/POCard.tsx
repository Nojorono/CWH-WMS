// NEW CODE
import { useEffect, useRef, useState } from "react";
import { useFormContext, useFieldArray, useWatch, Controller } from "react-hook-form";
import { FormValues } from "../formTypes";
import { inputCls, getLockedFieldCls } from "../constants";
import ItemTable from "../Table/ItemTable";
import AddItemModal from "../Modal/AddItemModal";
import Button from "../../../../../../components/ui/button/Button";
import { FaSearch } from "react-icons/fa";
import {
  useStoreItem,
  useStoreUom,
} from "../../../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast } from "../../../../../../components/toast";
import Swal from "sweetalert2";
import { usePersistAuthStore } from "../../../../../../API/store/AuthStore/PersistAuthStore";
import {
  POsearchService,
  SOsearchService,
} from "../../../../../../DynamicAPI/services/Service/";
import { SOHeaderInfo } from "../../../../../../DynamicAPI/types/searchSO";
import { confirmReplaceInboundItems } from "../Helper/confirmReplaceInboundItems";

const escapeHtml = (value?: string | null) =>
  String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildSoValidationSwalHtml = ({
  message,
  headerInfo,
  expectedOrganizationCodeTo,
  orgName,
  soNo,
}: {
  message: string;
  headerInfo?: SOHeaderInfo | null;
  expectedOrganizationCodeTo: string;
  orgName?: string;
  soNo?: string;
}) => {
  const rows: Array<{ label: string; value?: string | null; highlight?: boolean }> =
    [
      { label: "Nomor SO", value: soNo || headerInfo?.orderNumber?.toString() },
      { label: "User Current Organization Name", value: orgName },
      { label: "SO Type", value: headerInfo?.soType },
      { label: "Organization Code From", value: headerInfo?.organizationCodeFrom },
      { label: "Organization Code To", value: headerInfo?.organizationCodeTo },
    ];

  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;font-weight:600;white-space:nowrap;width:42%;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:${row.highlight ? "#1d4ed8" : "#0f172a"};font-weight:${row.highlight ? "700" : "600"};">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <p style="text-align:left;font-size:13px;color:#334155;line-height:1.55;margin:0 0 14px;">
      ${escapeHtml(message)}
    </p>
    <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;text-align:left;">
      <table style="width:100%;border-collapse:collapse;background:#ffffff;">
        <thead>
          <tr>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#475569;background:#f8fafc;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.04em;">
              Field
            </th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#475569;background:#f8fafc;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.04em;">
              Value
            </th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  `;
};

const showSoValidationSwal = async ({
  message,
  headerInfo,
  expectedOrganizationCodeTo,
  orgName,
  soNo,
}: {
  message: string;
  headerInfo?: SOHeaderInfo | null;
  expectedOrganizationCodeTo: string;
  orgName?: string;
  soNo?: string;
}) => {
  await Swal.fire({
    icon: "warning",
    title: "Subinventory Tidak Sesuai",
    html: buildSoValidationSwalHtml({
      message,
      headerInfo,
      expectedOrganizationCodeTo,
      orgName,
      soNo,
    }),
    confirmButtonText: "Mengerti",
    confirmButtonColor: "#3085d6",
    width: 620,
  });
};

const showSoValidationSuccessSwal = async ({
  headerInfo,
  expectedOrganizationCodeTo,
  orgName,
  soNo,
}: {
  headerInfo?: SOHeaderInfo | null;
  expectedOrganizationCodeTo: string;
  orgName?: string;
  soNo?: string;
}) => {
  return Swal.fire({
    icon: "success",
    title: "SO Valid untuk Inbound",
    html: buildSoValidationSwalHtml({
      message:
        "Nomor SO telah tervalidasi dan memenuhi kriteria Inbound. Klik OK untuk lanjut mapping item ke tabel SKU.",
      headerInfo,
      expectedOrganizationCodeTo,
      orgName,
      soNo,
    }),
    confirmButtonText: "OK, Lanjutkan",
    confirmButtonColor: "#16a34a",
    width: 620,
  });
};

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
  isCancelledSJ = false,
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
  isCancelledSJ?: boolean;
}) {
  const { fetchAll, list } = useStoreItem();
  const { fetchAll: fetchAllUom, list: uomList } = useStoreUom();
  const user = usePersistAuthStore((state) => state.user);
  const orgName = user?.userDetail?.organization?.organization_name;
  const { control, register, getValues, setValue, trigger } =
    useFormContext<FormValues>();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  /** Nomor PO/SO yang “memiliki” item saat ini — untuk deteksi ganti nomor */
  const boundDocNoRef = useRef<string>("");

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

  const docNoFieldName =
    normalizedInbType === "PO" ? ("po_no" as const) : ("so_no" as const);

  const docNoLabel =
    normalizedInbType === "PO"
      ? "PO"
      : normalizedInbType === "SO_INTERNAL"
        ? "SO Internal"
        : "SO SubDist";

  const currentDocNo = String(
    normalizedInbType === "PO" ? poNoWatch || "" : soNoWatch || "",
  ).trim();

  const hasPoOrSoNumber = Boolean(currentDocNo);

  const hasLegacyDbItems = itemFields.some((it: any) =>
    Boolean((it as any).inbound_item_id),
  );
  const docMatchesBound =
    currentDocNo === String(boundDocNoRef.current || "").trim();
  /** Blokir manual jika masih ada baris DB lama, atau item hasil search pada nomor yang sama */
  const cantAddManualAddItem =
    hasLegacyDbItems ||
    (hasPoOrSoNumber && docMatchesBound && itemFields.length > 0);

  const posPath = `deliveryOrders.${doIndex}.pos.${posIndex}`;

  const clearPosItemsAndMeta = () => {
    replaceItems([]);
    setValue(`${posPath}.vendor_name` as any, "");
    setValue(`${posPath}.principal` as any, "");
    setValue(`${posPath}.vendor_id` as any, undefined);
    setValue(`${posPath}.vendor_site_id` as any, undefined);
    setValue(`${posPath}.po_date` as any, undefined);
    setValue(`${posPath}.total_line_items` as any, 0);
  };

  const countCurrentItems = () => {
    const items = getValues(`${posPath}.items` as any);
    return Array.isArray(items) ? items.length : itemFields.length;
  };

  const confirmIfHasItems = async (contextLabel: string) => {
    const count = countCurrentItems();
    if (count <= 0) return true;
    return confirmReplaceInboundItems({
      contextLabel,
      itemCount: count,
    });
  };

  useEffect(() => {
    fetchAll();
    fetchAllUom();
  }, []);

  // Sync vendor_name dari principal (sekali jika kosong)
  useEffect(() => {
    const path = `deliveryOrders.${doIndex}.pos.${posIndex}`;
    const currentPrincipal = getValues(`${path}.principal` as any);
    const currentVendorName = getValues(`${path}.vendor_name` as any);

    if (currentPrincipal && !currentVendorName) {
      setValue(`${path}.vendor_name` as any, currentPrincipal);
    }
  }, [doIndex, posIndex, getValues, setValue, principalWatch]);

  // Init bound doc no sekali — JANGAN setValue ulang po_no/so_no di edit
  // (itu yang bikin nomor tidak bisa diketik / selalu revert)
  useEffect(() => {
    if (boundDocNoRef.current) return;
    const initial = String(dataPO || currentDocNo || "").trim();
    if (initial) boundDocNoRef.current = initial;
  }, [dataPO, currentDocNo]);

  const isPOFieldDisabled =
    isDetailMode ||
    isCancelledSJ ||
    (!isEditMode && !isCreateMode && !isAddToReceiveMode) ||
    (isCreateMode && !isDOChecked);

  const canAddItem = !isDetailMode && isDOChecked && !isCancelledSJ;

  const getDisabledCls = (disabled: boolean) => getLockedFieldCls(disabled);

  const docNoRegister = register(
    `deliveryOrders.${doIndex}.pos.${posIndex}.${docNoFieldName}` as any,
  );

  /** Ganti nomor PO/SO saat masih ada item → peringatan, clear atau revert */
  const handleDocNoBlur = async () => {
    if (isDetailMode || isCancelledSJ || isPOFieldDisabled) return;

    const next = String(
      getValues(`${posPath}.${docNoFieldName}` as any) || "",
    ).trim();
    const prev = boundDocNoRef.current;

    if (next === prev) return;

    const count = countCurrentItems();
    if (count <= 0) {
      boundDocNoRef.current = next;
      return;
    }

    const ok = await confirmReplaceInboundItems({
      contextLabel: `${docNoLabel} ${next || "(kosong)"}`,
      itemCount: count,
    });

    if (ok) {
      clearPosItemsAndMeta();
      boundDocNoRef.current = next;
      // Jangan overwrite original_po_no/so_no — dibutuhkan mapper utk hapus item DB lama
    } else {
      setValue(`${posPath}.${docNoFieldName}` as any, prev, {
        shouldDirty: true,
      });
    }
  };

  // ✅ SEARCH PO
  const handleSearchPO = async () => {
    if (!doNo) return showErrorToast("Isi Surat Jalan terlebih dahulu.");
    const poNo = getValues(
      `deliveryOrders.${doIndex}.pos.${posIndex}.po_no` as any,
    );

    if (!poNo) return showErrorToast("Masukkan nomor PO !");

    const ok = await confirmIfHasItems(`search PO ${poNo}`);
    if (!ok) return;

    setLoading(true);

    try {
      const { vendorName, vendorId, vendorSiteId, poDate, items } =
        await POsearchService(poNo, list, uomList);

      const path = `deliveryOrders.${doIndex}.pos.${posIndex}`;

      if (vendorName) {
        setValue(`${path}.vendor_name` as any, vendorName);
        setValue(`${path}.principal` as any, vendorName);
      }

      if (vendorId) {
        setValue(`${path}.vendor_id` as any, vendorId);
      }

      if (vendorSiteId != null && !Number.isNaN(vendorSiteId)) {
        setValue(`${path}.vendor_site_id` as any, vendorSiteId);
      }

      if (poDate) {
        const isoDate = new Date(poDate).toISOString();
        setValue(`${path}.po_date` as any, isoDate);
      }
      setValue(`${path}.total_line_items` as any, items.length);
      // Replace penuh dari API (qty & qty_plan ikut ter-reset) — tidak merge
      replaceItems(items);
      boundDocNoRef.current = String(poNo).trim();
    } catch (err: any) {
      clearPosItemsAndMeta();
      boundDocNoRef.current = String(poNo).trim();
      showErrorToast(
        err?.message ??
          "Gagal fetch detail PO. Form dikosongkan — silakan isi item manual jika perlu.",
      );
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

    const ok = await confirmIfHasItems(`search ${docNoLabel} ${soNo}`);
    if (!ok) return;

    setLoading(true);
    try {
      const { vendorName, items, headerInfo } = await SOsearchService(
        soNo,
        list,
        uomList,
      );

      if (!items || items.length === 0) {
        clearPosItemsAndMeta();
        boundDocNoRef.current = String(soNo).trim();
        showErrorToast(
          `Data SO ${soNo} tidak ditemukan atau item tidak terdaftar di master data. Form dikosongkan — silakan isi item manual jika perlu.`,
        );
        return;
      }

      // =========================================================
      // Validasi akses SO Inbound berdasarkan Org Login
      // - Login CWH   → ORGANIZATION_CODE_TO harus CWH
      // - Login Cabang → ORGANIZATION_CODE_TO harus sama dengan org yang login
      // =========================================================
      const normalize = (value?: string | null) =>
        String(value || "")
          .trim()
          .toUpperCase()
          .replace(/\s+/g, " ");

      const loginOrgName = normalize(orgName);
      const isLoginCwh =
        loginOrgName === "CWH" || loginOrgName.includes("CWH");

      const organizationCodeTo = normalize(headerInfo?.organizationCodeTo);
      const expectedOrganizationCodeTo = isLoginCwh ? "CWH" : orgName || "-";

      if (isLoginCwh) {
        if (organizationCodeTo !== "CWH") {
          await showSoValidationSwal({
            message:
              "Organisasi anda adalah CWH. Anda hanya dapat memproses SO Inbound dengan Organization Code To CWH.",
            headerInfo,
            expectedOrganizationCodeTo: "CWH",
            orgName,
            soNo,
          });
          clearPosItemsAndMeta();
          boundDocNoRef.current = String(soNo).trim();
          return;
        }
      } else if (organizationCodeTo !== loginOrgName) {
        await showSoValidationSwal({
          message: `Login cabang (${orgName || "-"}). SO Inbound hanya boleh diproses jika Organization Code To sama dengan organisasi yang sedang login.`,
          headerInfo,
          expectedOrganizationCodeTo,
          orgName,
          soNo,
        });
        clearPosItemsAndMeta();
        boundDocNoRef.current = String(soNo).trim();
        return;
      }

      const validResult = await showSoValidationSuccessSwal({
        headerInfo,
        expectedOrganizationCodeTo,
        orgName,
        soNo,
      });

      if (!validResult.isConfirmed) {
        // User sudah setuju ganti di awal; batalkan mapping → form kosong (jangan merge lama)
        clearPosItemsAndMeta();
        boundDocNoRef.current = String(soNo).trim();
        return;
      }

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

      // Replace penuh dari API — tidak merge
      replaceItems(items);
      boundDocNoRef.current = String(soNo).trim();
    } catch (err: any) {
      clearPosItemsAndMeta();
      boundDocNoRef.current = String(soNo).trim();
      showErrorToast(
        err?.message ??
          `Gagal fetch detail ${normalizedInbType === "SO_INTERNAL" ? "SO Internal" : "SO SubDist"}. Form dikosongkan — silakan isi item manual jika perlu.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative border rounded-md p-3 bg-slate-50 ${isCancelledSJ ? "cursor-not-allowed" : ""}`}
    >
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
              className={`${inputCls} ${getDisabledCls(isPOFieldDisabled ?? false)} disabled:cursor-not-allowed flex-1`}
              {...docNoRegister}
              onBlur={async (e) => {
                docNoRegister.onBlur(e);
                await handleDocNoBlur();
              }}
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
                title={`Search ${docNoLabel}`}
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
                if (isDetailMode || isCancelledSJ) return true;

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
                    {!isDetailMode && !isCancelledSJ && (
                      <span className="text-red-500">*</span>
                    )}
                  </span>
                  {fieldState.error && (
                    <span className="text-xs text-red-500 shrink-0">
                      {fieldState.error.message}
                    </span>
                  )}
                </label>
                <input
                  className={`${inputCls} w-full ${getDisabledCls(isDetailMode || isCancelledSJ)} disabled:cursor-not-allowed ${
                    fieldState.error ? "border-red-500" : ""
                  }`}
                  value={field.value || principalWatch || ""}
                  readOnly={isDetailMode || isCancelledSJ}
                  disabled={isCancelledSJ}
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
                    isDetailMode || isCancelledSJ
                      ? ""
                      : "Ketik manual jika tidak muncul..."
                  }
                />
              </>
            )}
          />
        </div>

        {/* Actions */}
        {!isDetailMode && !isCancelledSJ && (
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

      <div
        className={`mt-3 overflow-x-auto ${isCancelledSJ ? "cursor-not-allowed" : ""}`}
      >
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

      {!isDetailMode && !isCancelledSJ && (
        <AddItemModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSave={(item) => appendItem(item)}
        />
      )}
    </div>
  );
}
