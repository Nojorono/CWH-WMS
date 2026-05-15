import {
  useFormContext,
  useFieldArray,
  Controller,
  useWatch,
} from "react-hook-form";
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
  FaPlus,
  FaFileInvoice,
  FaCheckCircle,
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
import { useNavigate } from "react-router-dom";
import { FaCircleXmark } from "react-icons/fa6";
import { showConfirmDialog } from "../../../../../../components/swal-confirm";
import { cancelSJservice } from "../Helper/cancelSJservice";

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
  inbType: "PO" | "SO_INTERNAL" | "SO_SUBDIST";
}) {
  const navigate = useNavigate();

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

  const receiptNumber = watch(
    `deliveryOrders.${doIndex}.inbound_integration.receipt_number` as any,
  );

  const inbIntegrationData = watch(
    `deliveryOrders.${doIndex}.inbound_integration` as any,
  );
  
  const allDeliveryOrders = useWatch({
    name: "deliveryOrders",
    defaultValue: [],
  });

  const normalizedThisDONo = (watchedDONo || "").trim().toUpperCase();
  const isDuplicateDO = allDeliveryOrders.some((doItem: any, index: number) => {
    if (index === doIndex) return false;
    const currentDONo = (doItem?.do_no || "").trim().toUpperCase();
    return normalizedThisDONo !== "" && currentDONo === normalizedThisDONo;
  });

  useEffect(() => {
    if ((isDetailMode || isEditMode) && watchedDONo) {
      setIsDOChecked(true);
      lastValidatedDONo.current = watchedDONo;
    }
  }, [isDetailMode, isEditMode, watchedDONo, setIsDOChecked]);

  const onCheckDO = async () => {
    if (isDuplicateDO) {
      showErrorToast(
        `Nomor SJ/DO "${watchedDONo}" sudah dipakai pada SJ lain. Gunakan nomor yang berbeda.`,
      );
      return;
    }

    if (inbType !== "PO" && inbType !== "SO_INTERNAL") {
      showErrorToast("Hanya PO, SO Internal yang bisa divalidasi!");
      return;
    }

    setDoStatus(null);
    setIsDOChecked(false);
    lastValidatedDONo.current = "";

    lastValidatedDONo.current = watchedDONo || "";
    await handleCheckDO(null);
  };

  useEffect(() => {
    if (!isDOChecked || isDetailMode) return;

    if (watchedDONo !== lastValidatedDONo.current) {
      const handler = setTimeout(() => {
        setDoStatus(null);
        setIsDOChecked(false);
        lastValidatedDONo.current = "";
      }, 1000);
      return () => clearTimeout(handler);
    }
  }, [watchedDONo, isDOChecked, isDetailMode, setDoStatus, setIsDOChecked]);

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
  const isValidType =
    inbType === "PO" || inbType === "SO_INTERNAL" || inbType === "SO_SUBDIST";

  const inboundId = watch("id" as any);
  const currentDO = watch(`deliveryOrders.${doIndex}`);

  const addToReceive = (data: any) => {
    // Ambil PO pertama dari SJ ini
    const firstPO = data.pos?.[0];
    const activePOno = firstPO?.po_no;
    const activeSOno = firstPO?.so_no;

    // Ambil data dari Root Form
    const inboundNo = watch("inbound_plan_no" as any);
    const inboundTypeRaw = watch("inbound_type" as any);
    const inboundType =
      typeof inboundTypeRaw === "object"
        ? inboundTypeRaw?.value
        : inboundTypeRaw;

    // ✅ AMBIL RECEIPT NUMBER DARI DATA SJ INI
    const receiptNo = data.inbound_integration?.receipt_number;

    const payload = {
      id: inboundId,
      do_no: data.do_no,
      activePOno: activePOno,
      activeSOno: activeSOno,
      inbound_number: inboundNo,
      inboundType: inboundType,
      receipt_number: receiptNo,
    };

    navigate("/inbound_planning/process", {
      state: {
        data: payload,
        mode: "add",
        title: "Add to Receive",
      },
    });
  };

  const cancelSJ = (currentDO: any) => {
    const idDO = currentDO.do_id;

    showConfirmDialog(
      async () => {
        try {
          const result = await cancelSJservice(idDO);
          if (result?.success === true) {
            navigate("/inbound_planning");
          } else {
            throw new Error(
              result?.message || "Gagal memproses pembatalan di server.",
            );
          }
        } catch (error: any) {
          console.error(error);
        }
      },
      {
        title: "Confirm Cancel",
        text: "Anda yakin ingin cancel data ini?",
        confirmButtonText: "Yes!",
        cancelButtonText: "No",
      },
    );
  };

  return (
    <div
      className={`transition-all duration-300 border rounded-xl overflow-hidden shadow-sm hover:shadow-md ${open ? "mb-6" : "mb-3"}`}
    >
      <details ref={detailsRef} open={open} className="group">
        <summary className="flex flex-wrap justify-between items-center cursor-pointer px-4 py-4 bg-slate-50 group-open:bg-orange-100 border-b border-transparent group-open:border-blue-100 transition-colors list-none">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 group-hover:text-blue-600 group-hover:border-blue-500 transition-all">
              {open ? (
                <FaChevronDown className="text-[10px]" />
              ) : (
                <FaChevronRight className="text-[10px]" />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <FaFileInvoice className="text-slate-400" />
                  Surat Jalan #{doIndex + 1}
                </span>

                {/* Penambahan Label Konteks untuk User Awam */}
                <div className="flex items-center gap-1.5 ml-1 border-l pl-3 border-slate-300">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-tight">
                    Meta Status:
                  </span>
                  {integrationStatus ? (
                    <StatusBadge
                      status={integrationStatus}
                      colorMap={STATUS_MAP_INTEGRATION_INBOUND}
                      variant="solid"
                      size="sm"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 italic font-medium">
                      Belum Terintegrasi
                    </span>
                  )}
                </div>
              </div>

              {/* ✅ RECEIPT NUMBER DIPASANG DI SUMMARY AGAR TERLIHAT SAAT COLLAPSED */}
              {receiptNumber && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    Receipt No: {receiptNumber}
                  </span>
                  <FaCheckCircle className="text-green-500 text-xs" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-auto sm:ml-0">
            {isDetailMode && receiptNumber && (
              <Button
                size="xsm"
                variant="action"
                onClick={() => addToReceive(currentDO)}
                className="shadow-sm animate-in fade-in zoom-in duration-300"
              >
                <FaPlus className="mr-1" /> Add to Receive
              </Button>
            )}

            {!isDetailMode && totalDO > 1 && (
              <Button
                size="xsm"
                variant="danger"
                onClick={() => removeDO()}
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                <FaTrash className="mr-1" /> Discard
              </Button>
            )}

            {isDetailMode && integrationStatus !== "SUCCESS" && (
              <Button
                size="xsm"
                variant="danger"
                onClick={() => cancelSJ(currentDO)}
                className="shadow-sm animate-in fade-in zoom-in duration-300"
              >
                <FaCircleXmark className="mr-1" /> Cancel SJ
              </Button>
            )}
          </div>
        </summary>

        <div className="p-5 bg-white space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
            {/* PO Group Selection */}
            {inbType === "PO" && (
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">
                  PO Type *
                </label>
                <Controller
                  control={control}
                  name={`deliveryOrders.${doIndex}.po_type`}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`${inputCls} !py-1.5 !text-xs !bg-white ${errors.deliveryOrders?.[doIndex]?.po_type ? "border-red-500" : ""}`}
                      disabled={isInputDisabled}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value === "PO_NON_GROUP") {
                          setIsDOChecked(true);
                        } else {
                          setIsDOChecked(false);
                          setDoStatus(null);
                        }
                      }}
                    >
                      <option value="PO_GROUP">PO Group</option>
                      <option value="PO_NON_GROUP">PO Non Group</option>
                    </select>
                  )}
                />
              </div>
            )}

            {/* No Surat Jalan */}
            <div className="flex flex-col lg:col-span-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider flex justify-between">
                No Surat Jalan *
                {doStatus && (
                  <span
                    className={`px-1.5 rounded-sm font-bold ${doStatus === "success" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
                  >
                    {doStatus === "success" ? "MATCHED" : "NOT FOUND"}
                  </span>
                )}
              </label>
              <div className="flex gap-2 relative">
                <input
                  {...register(`deliveryOrders.${doIndex}.do_no`, {
                    required: "No Surat Jalan wajib diisi",
                  })}
                  placeholder="Input DO Number..."
                  className={`${inputCls} !py-1.5 !text-xs !bg-white flex-1 ${
                    errors.deliveryOrders?.[doIndex]?.do_no || isDuplicateDO
                      ? "border-red-500"
                      : ""
                  }`}
                  disabled={isInputDisabled}
                />
                {!isDetailMode && (
                  <Button
                    type="button"
                    size="xsm"
                    variant="primary"
                    onClick={onCheckDO}
                    className="!py-1"
                    disabled={
                      !isValidType ||
                      (isDOChecked && doStatus === "success") ||
                      isDuplicateDO
                    }
                  >
                    <FaSearch className="text-[10px]" />
                  </Button>
                )}
              </div>
              {isDuplicateDO && (
                <p className="mt-1 text-[10px] font-medium text-red-600 animate-pulse">
                  ⚠️ Nomor SJ duplikat dalam form ini!
                </p>
              )}
            </div>

            {/* Attachment */}
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">
                Attachment
              </label>
              {fileUrl ? (
                <div className="flex items-center gap-2 text-xs bg-blue-50 px-3 py-1.5 rounded border border-blue-100">
                  <a
                    href={fileUrl}
                    target="_blank"
                    className="text-blue-700 font-semibold hover:underline truncate max-w-[150px]"
                    rel="noreferrer"
                  >
                    View File
                  </a>
                  {!isDetailMode && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteFileFromS3(fileUrl);
                        setValue(`deliveryOrders.${doIndex}.attachment`, "");
                      }}
                      className="ml-auto p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                    >
                      <FaTrash size={10} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative group">
                  <input
                    type="file"
                    className={`${inputCls} !py-1 !text-[10px] !bg-white w-full file:mr-2 file:py-1 file:px-2 file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer`}
                    disabled={isDetailMode || uploading || !isDOChecked}
                    onChange={(e) =>
                      e.target.files?.[0] && handleUploadFile(e.target.files[0])
                    }
                  />
                  {!isDOChecked && !isDetailMode && (
                    <div className="absolute inset-0 bg-slate-100/80 flex items-center justify-center text-[9px] text-slate-500 font-bold uppercase pointer-events-none rounded border border-dashed border-slate-300">
                      🔒 Validate SJ First
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">
                SJ Date *
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

          {/* Item List Section */}
          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                PO/SO Details
              </h3>
            </div>

            <div className="space-y-4">
              {posFields.map((posField, posIndex) => (
                <>
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
                    isPOValidated={!!(posField as any).validation_surat_jalan}
                  />
                </>
              ))}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
