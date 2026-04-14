// NEW CODE
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { FormValues } from "../formTypes";
import { inputCls } from "../constants";
import POCard from "./POCard";
import Button from "../../../../../../components/ui/button/Button";
import DatePicker from "../../../../../../components/form/date-picker";
import {
  FaTrash,
  FaChevronDown,
  FaChevronRight,
  FaSearch,
} from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { formatDateIndo } from "../../../../../../helper/FormatDate";
import { uploadFileToS3 } from "../Helper/uploadFileToS3";
import { deleteFileFromS3 } from "../Helper/deleteFileFromS3";
import {
  showErrorToast,
  showSuccessToast,
} from "../../../../../../components/toast";
import StatusBadge from "../../../../../../common/statusBadge";
import { STATUS_MAP_INTEGRATION_INBOUND } from "../../../../../../constants/statusMaps";
import { useDOValidation } from "../Helper/useDOValidation";

export default function DeliveryOrderCard({
  doIndex,
  removeDO,
  totalDO,
  isEditMode,
  isDetailMode,
  isCreateMode,
  isAddToReceiveMode,
  inbType,
}: {
  doIndex: number;
  removeDO: () => void;
  totalDO: number;
  isEditMode?: boolean;
  isDetailMode?: boolean;
  isCreateMode?: boolean;
  isAddToReceiveMode?: boolean;
  inbType: "PO" | "SO" | "RETUR";
}) {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<FormValues>();

  const {
    fields: posFields,
    remove: removePos,
    replace: replacePos,
    append,
  } = useFieldArray({
    control,
    name: `deliveryOrders.${doIndex}.pos`,
  });

  // 1. KUNCI UTAMA: Gunakan ref untuk sinkronisasi instan
  const lastValidatedDONo = useRef<string>("");

  const {
    doStatus,
    setDoStatus,
    isDOChecked,
    setIsDOChecked,
    watchedDONo,
    handleCheckDO,
  } = useDOValidation(doIndex, replacePos, append, inbType);

  const [open, setOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const integrationStatus = watch(
    `deliveryOrders.${doIndex}.integration_status` as any,
  );
  const fileUrl = watch(`deliveryOrders.${doIndex}.attachment`);

  // ✅ Auto-unlock jika mode Detail/Edit data sudah ada
  useEffect(() => {
    if ((isDetailMode || isEditMode) && watchedDONo) {
      setIsDOChecked(true);
      lastValidatedDONo.current = watchedDONo; // Isi ref agar tidak kena reset
    }
  }, [isDetailMode, isEditMode, watchedDONo, setIsDOChecked]);

  // ✅ Wrapper Handle Check DO
  const onCheckDO = async () => {
    if (inbType !== "PO" && inbType !== "SO") {
      showErrorToast("Hanya PO atau SO yang bisa divalidasi!");
      return;
    }
    lastValidatedDONo.current = watchedDONo || "";
    await handleCheckDO();
  };

  // ✅ Reset status: Hanya jika user mengganti nomor SJ secara manual
  useEffect(() => {
    if (!isDOChecked || isDetailMode) return;

    // BANDINGKAN: Jika input saat ini beda dengan yang divalidasi terakhir
    if (watchedDONo !== lastValidatedDONo.current) {
      const handler = setTimeout(() => {
        setDoStatus(null);
        setIsDOChecked(false);
        lastValidatedDONo.current = ""; // Reset ref juga
      }, 1000);
      return () => clearTimeout(handler);
    }
  }, [watchedDONo, isDOChecked, isDetailMode, setDoStatus, setIsDOChecked]);

  // --- Logic UI (Sync Details & Upload) ---
  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const handleToggle = () => setOpen(el.open);
    el.addEventListener("toggle", handleToggle);
    return () => el.removeEventListener("toggle", handleToggle);
  }, []);

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    try {
      if (fileUrl) await deleteFileFromS3(fileUrl).catch(() => null);
      const newUrl = await uploadFileToS3(file);
      if (newUrl) {
        setValue(`deliveryOrders.${doIndex}.attachment`, newUrl, {
          shouldValidate: true,
        });
        showSuccessToast("Upload berhasil");
      }
    } catch {
      showErrorToast("Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const isInputDisabled = !isCreateMode && !isEditMode && !isAddToReceiveMode;
  const isValidType = inbType === "PO" || inbType === "SO";

  return (
    <div className="bg-white rounded-lg shadow p-3 md:p-5">
      <details ref={detailsRef} open={open}>
        <summary className="flex justify-between items-center cursor-pointer px-3 py-2 bg-orange-100 rounded-md">
          <div className="flex items-center gap-3">
            {open ? <FaChevronDown /> : <FaChevronRight />}
            <span className="text-sm font-semibold">
              Surat Jalan #{doIndex + 1}
            </span>
            {integrationStatus && (
              <StatusBadge
                status={integrationStatus}
                colorMap={STATUS_MAP_INTEGRATION_INBOUND}
                variant="solid"
                size="sm"
              />
            )}
          </div>
          {!isDetailMode && totalDO > 1 && (
            <Button size="xsm" variant="danger" onClick={removeDO}>
              <FaTrash className="mr-1" /> Discard
            </Button>
          )}
        </summary>

        <div className="p-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* No Surat Jalan */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">
                No Surat Jalan *{" "}
                {doStatus && (
                  <span
                    className={
                      doStatus === "success" ? "text-green-600" : "text-red-600"
                    }
                  >
                    ({doStatus === "success" ? "Valid" : "Invalid"})
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  {...register(`deliveryOrders.${doIndex}.do_no`, {
                    required: "Wajib diisi",
                  })}
                  className={`${inputCls} flex-1 ${errors.deliveryOrders?.[doIndex]?.do_no ? "border-red-500" : ""}`}
                  disabled={isInputDisabled}
                />
                {!isDetailMode && (
                  <Button
                    type="button"
                    size="xsm"
                    variant="primary"
                    onClick={onCheckDO} // Gunakan wrapper onCheckDO
                    disabled={
                      !isValidType || (isDOChecked && doStatus === "success")
                    }
                  >
                    <FaSearch />
                  </Button>
                )}
              </div>
            </div>

            {/* Attachment */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">
                Attachment (Maks 2MB)
              </label>
              {fileUrl ? (
                <div className="flex items-center gap-2 text-sm">
                  <a
                    href={fileUrl}
                    target="_blank"
                    className="text-blue-600 underline"
                    rel="noreferrer"
                  >
                    Lihat file
                  </a>
                  {!isDetailMode && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteFileFromS3(fileUrl);
                        setValue(`deliveryOrders.${doIndex}.attachment`, "");
                      }}
                      className="text-red-600"
                    >
                      <FaTrash size={12} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    className={`${inputCls} text-xs w-full`}
                    disabled={isDetailMode || uploading || !isDOChecked}
                    onChange={(e) =>
                      e.target.files?.[0] && handleUploadFile(e.target.files[0])
                    }
                  />
                  {!isDOChecked && !isDetailMode && (
                    <div className="absolute inset-0 bg-gray-100/70 flex items-center justify-center text-[10px] text-gray-500 pointer-events-none">
                      🔒 Validasi SJ dahulu
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">
                Tanggal Surat Jalan *
              </label>
              <Controller
                control={control}
                name={`deliveryOrders.${doIndex}.date`}
                rules={{ required: "Wajib diisi" }}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) =>
                      field.onChange(
                        date
                          ? formatDateIndo(Array.isArray(date) ? date[0] : date)
                          : "",
                      )
                    }
                    readOnly={isDetailMode || !isDOChecked}
                    id={`date-${doIndex}`}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            {posFields.map((posField, posIndex) => (
              <POCard
                key={posField.id}
                doIndex={doIndex}
                posIndex={posIndex}
                removePos={() => removePos(posIndex)}
                totalPO={posFields.length}
                isEditMode={isEditMode}
                isDetailMode={isDetailMode}
                isCreateMode={isCreateMode}
                isAddToReceiveMode={isAddToReceiveMode}
                InbType={inbType}
                dataPO={inbType === "PO" ? posField.po_no : posField.so_no}
                isDOChecked={isDOChecked}
              />
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}