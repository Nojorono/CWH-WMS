import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { FormValues } from "../formTypes";
import { inputCls } from "../constants";
import POCard from "./POCard";
import Button from "../../../../../../components/ui/button/Button";
import DatePicker from "../../../../../../components/form/date-picker";
import {
  FaPlus,
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
import { EndPoint } from "../../../../../../utils/EndPoint";

export default function DeliveryOrderCard({
  doIndex,
  removeDO,
  totalDO,
  isEditMode,
  inbType,
}: {
  doIndex: number;
  removeDO: () => void;
  totalDO: number;
  isEditMode: boolean;
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
    append: appendPos,
    remove: removePos,
    replace: replacePos,
  } = useFieldArray({
    control,
    name: `deliveryOrders.${doIndex}.pos`,
  });

  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [daftarPO, setDaftarPO] = useState<string[]>([]); // sekarang array

  const detailsRef = useRef<HTMLDetailsElement>(null);
  const doNo = watch(`deliveryOrders.${doIndex}.do_no`);
  

  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const handleToggle = () => setOpen(el.open);
    el.addEventListener("toggle", handleToggle);
    return () => el.removeEventListener("toggle", handleToggle);
  }, []);

  const getError = (field: "do_no" | "attachment" | "date") =>
    errors.deliveryOrders?.[doIndex]?.[field];

  const inputClass = (hasError?: boolean) =>
    `${inputCls} ${hasError ? "border-red-500 focus:ring-red-500" : ""} ${
      !isEditMode ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
    }`;

  const handleDeleteFile = async (fileUrl: string) => {
    setDeleting(true);
    try {
      await deleteFileFromS3(fileUrl);
      setValue(`deliveryOrders.${doIndex}.attachment`, "", {
        shouldValidate: true,
      });
    } catch {
      showErrorToast("Gagal menghapus file");
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fileUrl = await uploadFileToS3(file);
      if (fileUrl) {
        setValue(`deliveryOrders.${doIndex}.attachment`, fileUrl, {
          shouldValidate: true,
        });
      } else {
        showErrorToast(`Upload gagal untuk ${file.name}`);
      }
    } catch {
      showErrorToast(`Upload error untuk ${file.name}`);
    } finally {
      setUploading(false);
    }
  };

  const fileUrl = watch(`deliveryOrders.${doIndex}.attachment`);

  // ✅ VALIDASI DO DAN AUTO-GENERATE PO
  const handleCheckDO = async () => {
    const doNo = watch(`deliveryOrders.${doIndex}.do_no`);
    if (!doNo) {
      showErrorToast("No Surat Jalan wajib diisi");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      showErrorToast("Token tidak ditemukan");
      return;
    }
    try {
      const res = await fetch(`${EndPoint}inbound/do-validation/${doNo}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (
        res.ok &&
        data?.success &&
        data?.data?.status &&
        Array.isArray(data?.data?.data)
      ) {
        const daftarPOString = data?.data?.data?.[0]?.DAFTAR_NO_PO || "";
        const daftarPOArr = daftarPOString
          ? daftarPOString.split(",").map((po: string) => po.trim())
          : [];

        setDaftarPO(daftarPOArr);

        if (daftarPOArr.length > 0) {
          // hapus semua PO lama, lalu buat baru otomatis
          replacePos(
            daftarPOArr.map((po: any) => ({
              po_no: po,
              items: [],
            }))
          );

          showSuccessToast(
            `Validasi berhasil: ditemukan ${
              daftarPOArr.length
            } PO (${daftarPOArr.join(", ")})`
          );
        } else {
          // tidak ada PO
          replacePos([]);
          showErrorToast("Tidak ada PO ditemukan. Tambahkan manual.");
        }
      } else {
        replacePos([]);
        showErrorToast("Validasi gagal atau format tidak sesuai");
      }
    } catch (err) {
      replacePos([]);
      showErrorToast("Gagal cek Surat Jalan");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 md:p-4 lg:p-5">
      <details ref={detailsRef}>
        <summary className="flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer px-3 py-2 bg-orange-100 rounded-md gap-2">
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

          {isEditMode && (
            <div className="flex flex-wrap gap-2">
              {/* <Button
                size="xsm"
                type="button"
                variant="secondary"
                onClick={() => appendPos({ po_no: "", items: [] })}
                className="w-full sm:w-auto"
              >
                <FaPlus className="inline" />
                <span className="ml-1">Add PO</span>
              </Button> */}

              <Button
                size="xsm"
                type="button"
                variant="secondary"
                onClick={() => appendPos({ po_no: "", items: [] })}
                className="w-full sm:w-auto"
                disabled={!isEditMode || !doNo} // ⛔ disabled kalau belum isi SJ
              >
                <FaPlus className="inline" />
                <span className="ml-1">Add PO</span>
              </Button>

              {totalDO > 1 && (
                <Button
                  size="xsm"
                  type="button"
                  variant="danger"
                  onClick={removeDO}
                  className="w-full sm:w-auto"
                >
                  <FaTrash className="inline" />
                  <span className="ml-1">Discard</span>
                </Button>
              )}
            </div>
          )}
        </summary>

        {/* ======= FORM SECTION ======= */}
        <div className="p-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* === DO No === */}
            <div className="flex flex-col">
              <label className="block text-xs text-slate-600 mb-1">
                No Surat Jalan <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  {...register(`deliveryOrders.${doIndex}.do_no` as const, {
                    required: "No Surat Jalan wajib diisi",
                  })}
                  className={`${inputClass(
                    !!getError("do_no")
                  )} w-full sm:flex-1`}
                  disabled={!isEditMode}
                />
                <Button
                  type="button"
                  size="xsm"
                  variant="primary"
                  onClick={handleCheckDO}
                  disabled={!isEditMode}
                >
                  <FaSearch />
                </Button>
              </div>
              {getError("do_no") && (
                <p className="text-red-500 text-xs mt-1">
                  {getError("do_no")?.message as string}
                </p>
              )}
            </div>

            {/* === Attachment === */}
            <div className="flex flex-col">
              <label className="block text-xs text-slate-600 mb-1">
                Attachment <span className="text-red-500">*</span>
              </label>
              {fileUrl ? (
                <div className="flex items-center gap-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline break-all"
                  >
                    Lihat file
                  </a>
                  {isEditMode && (
                    <button
                      type="button"
                      className="text-red-600 text-xs flex items-center gap-1"
                      disabled={deleting}
                      onClick={() => handleDeleteFile(fileUrl)}
                    >
                      {deleting ? "Deleting..." : <FaTrash size={12} />}
                      {!deleting && "Delete"}
                    </button>
                  )}
                </div>
              ) : (
                <input
                  type="file"
                  className={`${inputClass(!!getError("attachment"))} text-xs`}
                  disabled={!isEditMode || uploading}
                  onChange={async (e) => {
                    if (!isEditMode) return;
                    const file = e.target.files?.[0];
                    if (file) await handleUploadFile(file);
                  }}
                />
              )}
              {uploading && (
                <p className="text-xs text-slate-500 mt-1">Uploading...</p>
              )}
            </div>

            {/* === DO Date === */}
            <div className="flex flex-col">
              <label className="block text-xs text-slate-600 mb-1">
                Tanggal Surat Jalan <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name={`deliveryOrders.${doIndex}.date` as const}
                rules={{ required: "Tanggal wajib diisi" }}
                render={({ field }) => (
                  <DatePicker
                    id="date-picker"
                    placeholder="Select a date"
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date: Date | Date[]) => {
                      if (!isEditMode) return;
                      const selectedDate = Array.isArray(date) ? date[0] : date;
                      field.onChange(
                        selectedDate ? formatDateIndo(selectedDate) : ""
                      );
                    }}
                    readOnly={!isEditMode}
                  />
                )}
              />
            </div>
          </div>

          {/* === PO Cards === */}
          <div className="space-y-4">
            {posFields.map((posField, posIndex) => (
              <POCard
                key={posField.id}
                doIndex={doIndex}
                posIndex={posIndex}
                removePos={() => removePos(posIndex)}
                totalPO={posFields.length}
                isEditMode={isEditMode}
                InbType={inbType}
                dataPO={posField.po_no || ""}
              />
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
