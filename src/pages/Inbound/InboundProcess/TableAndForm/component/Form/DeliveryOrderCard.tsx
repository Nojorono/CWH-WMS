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
    watch, // ✅ sekarang ada
    formState: { errors },
  } = useFormContext<FormValues>();

  const {
    fields: posFields,
    append: appendPos,
    remove: removePos,
  } = useFieldArray({
    control,
    name: `deliveryOrders.${doIndex}.pos`,
  });

  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const handleToggle = () => setOpen(el.open);
    el.addEventListener("toggle", handleToggle);
    return () => el.removeEventListener("toggle", handleToggle);
  }, []);

  // ✅ helper untuk ambil error field
  const getError = (field: "do_no" | "attachment" | "date") =>
    errors.deliveryOrders?.[doIndex]?.[field];

  // ✅ helper untuk bikin className input
  const inputClass = (hasError?: boolean) =>
    `${inputCls} ${hasError ? "border-red-500 focus:ring-red-500" : ""} ${
      !isEditMode ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
    }`;

  // ✅ helper untuk hapus file
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

  // ✅ helper untuk upload file
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

      console.log("DO validation response:", data);

      // Jika data.data.data adalah array kosong, anggap tidak tervalidasi
      if (
        res.ok &&
        data?.success &&
        data?.data?.status &&
        Array.isArray(data?.data?.data) &&
        data?.data?.data.length > 0
      ) {
        const daftarPO = data?.data?.data?.[0]?.DAFTAR_NO_PO;
        const jmlPO = data?.data?.data?.[0]?.JML_NO_PO;

        setValue(`deliveryOrders.${doIndex}.flag_validated`, true, {
          shouldValidate: true,
        });

        showSuccessToast(
          `Validasi berhasil: ${
            data?.data?.message || "Berhasil"
          }\nPO: ${daftarPO}\nJumlah PO: ${jmlPO}`
        );
      } else {
        setValue(`deliveryOrders.${doIndex}.flag_validated`, false, {
          shouldValidate: true,
        });
        // Jika array kosong, tampilkan pesan khusus
        if (
          res.ok &&
          data?.success &&
          data?.data?.status &&
          Array.isArray(data?.data?.data) &&
          data?.data?.data.length === 0
        ) {
          showErrorToast(
            "Surat Jalan tidak ditemukan di database (tidak tervalidasi)"
          );
        } else {
          showErrorToast(
            data?.data?.message || data?.message || "Validasi gagal"
          );
        }
      }
    } catch (err) {
      setValue(`deliveryOrders.${doIndex}.flag_validated`, false, {
        shouldValidate: true,
      });
      showErrorToast("Gagal cek Surat Jalan");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 md:p-4 lg:p-5">
      <details ref={detailsRef}>
        {/* ======= HEADER ======= */}
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
              <Button
                size="xsm"
                type="button"
                variant="secondary"
                onClick={() => appendPos({ po_no: "", items: [] })}
                className="w-full sm:w-auto"
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
          {/* FORM GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* === Delivery Order No === */}
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
                <div className="relative group">
                  <Button
                    type="button"
                    size="xsm"
                    variant="primary"
                    onClick={handleCheckDO}
                    disabled={!isEditMode}
                    className="w-full sm:w-auto flex items-center justify-center gap-1"
                  >
                    <FaSearch />
                    {/* <span className="hidden sm:inline">Cek Surat Jalan</span> */}
                  </Button>
                  <div className="absolute left-1/2 -translate-x-1/2 mt-1 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    Cek Surat Jalan ke META
                  </div>
                </div>
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
                      className="text-red-600 text-xs flex items-center gap-1 disabled:opacity-50"
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

              {getError("attachment") && (
                <p className="text-red-500 text-xs mt-1">
                  {getError("attachment")?.message as string}
                </p>
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
                      const formattedDate = selectedDate
                        ? formatDateIndo(selectedDate)
                        : "";
                      field.onChange(formattedDate);
                    }}
                    readOnly={!isEditMode}
                  />
                )}
              />
              {getError("date") && (
                <p className="text-red-500 text-xs mt-1">
                  {getError("date")?.message as string}
                </p>
              )}
            </div>
          </div>

          {/* === PO Cards Section === */}
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
              />
            ))}
          </div>
        </div>
      </details>
    </div>
  );

  // return (
  //   <div className="bg-white rounded-lg shadow p-3">
  //     <details ref={detailsRef}>
  //       <summary className="flex justify-between items-center cursor-pointer px-3 py-2 bg-orange-100 rounded">
  //         <div className="flex items-center gap-2">
  //           {open ? (
  //             <FaChevronDown className="transition-transform" />
  //           ) : (
  //             <FaChevronRight className="transition-transform" />
  //           )}
  //           <span className="text-sm font-medium">
  //             Surat Jalan #{doIndex + 1}
  //           </span>
  //         </div>

  //         {isEditMode && (
  //           <div className="flex gap-2 items-center">
  //             <Button
  //               size="xsm"
  //               type="button"
  //               variant="secondary"
  //               onClick={() => appendPos({ po_no: "", items: [] })}
  //             >
  //               <FaPlus className="inline" />
  //               Add PO
  //             </Button>
  //             {totalDO > 1 && (
  //               <Button
  //                 size="xsm"
  //                 type="button"
  //                 variant="danger"
  //                 onClick={removeDO}
  //               >
  //                 <FaTrash className="inline" />
  //                 Discard
  //               </Button>
  //             )}
  //           </div>
  //         )}
  //       </summary>

  //       <div className="p-3 space-y-3">
  //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
  //           {/* Delivery Order No */}
  //           <div className="flex flex-col">
  //             <label className="block text-xs text-slate-600 mb-1">
  //               No Surat Jalan <span className="text-red-500">*</span>
  //             </label>
  //             <div className="flex flex-col sm:flex-row gap-2">
  //               <input
  //                 {...register(`deliveryOrders.${doIndex}.do_no` as const, {
  //                   required: "No Surat Jalan wajib diisi",
  //                 })}
  //                 className={`${inputClass(
  //                   !!getError("do_no")
  //                 )} w-full sm:w-40 md:w-60`}
  //                 disabled={!isEditMode}
  //               />
  //               <Button
  //                 type="button"
  //                 size="xsm"
  //                 variant="primary"
  //                 onClick={() => {
  //                   handleCheckDO();
  //                 }}
  //                 disabled={!isEditMode}
  //                 className="w-full sm:w-auto"
  //               >
  //                 <FaSearch />
  //                 <span className="hidden sm:inline">Cek Surat Jalan</span>
  //               </Button>
  //             </div>
  //             {getError("do_no") && (
  //               <p className="text-red-500 text-xs mt-1">
  //                 {getError("do_no")?.message as string}
  //               </p>
  //             )}
  //           </div>

  //           {/* Attachment */}
  //           <div className="flex flex-col">
  //             <label className="block text-xs text-slate-600 mb-1">
  //               Attachment <span className="text-red-500">*</span>
  //             </label>

  //             {fileUrl ? (
  //               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
  //                 <a
  //                   href={fileUrl}
  //                   target="_blank"
  //                   rel="noopener noreferrer"
  //                   className="text-sm text-blue-600 underline"
  //                 >
  //                   Lihat file
  //                 </a>
  //                 {isEditMode && (
  //                   <button
  //                     type="button"
  //                     className="text-red-600 text-xs flex items-center gap-1 disabled:opacity-50"
  //                     disabled={deleting}
  //                     onClick={() => handleDeleteFile(fileUrl)}
  //                   >
  //                     {deleting ? "Deleting..." : <FaTrash size={12} />}
  //                     {!deleting && "Delete"}
  //                   </button>
  //                 )}
  //               </div>
  //             ) : (
  //               <input
  //                 type="file"
  //                 className={inputClass(!!getError("attachment"))}
  //                 disabled={!isEditMode || uploading}
  //                 onChange={async (e) => {
  //                   if (!isEditMode) return;
  //                   const file = e.target.files?.[0];
  //                   if (file) {
  //                     await handleUploadFile(file);
  //                   }
  //                 }}
  //               />
  //             )}

  //             {uploading && (
  //               <p className="text-xs text-slate-500 mt-1">Uploading...</p>
  //             )}

  //             {getError("attachment") && (
  //               <p className="text-red-500 text-xs mt-1">
  //                 {getError("attachment")?.message as string}
  //               </p>
  //             )}
  //           </div>

  //           {/* DO Date */}
  //           <div className="flex flex-col">
  //             <label className="block text-xs text-slate-600 mb-1">
  //               Tanggal Surat Jalan <span className="text-red-500">*</span>
  //             </label>
  //             <Controller
  //               control={control}
  //               name={`deliveryOrders.${doIndex}.date` as const}
  //               rules={{ required: "Tanggal wajib diisi" }}
  //               render={({ field }) => (
  //                 <DatePicker
  //                   id="date-picker"
  //                   placeholder="Select a date"
  //                   value={field.value ? new Date(field.value) : undefined}
  //                   onChange={(date: Date | Date[]) => {
  //                     if (!isEditMode) return;
  //                     const selectedDate = Array.isArray(date) ? date[0] : date;
  //                     const formattedDate = selectedDate
  //                       ? formatDateIndo(selectedDate)
  //                       : "";
  //                     field.onChange(formattedDate);
  //                   }}
  //                   readOnly={!isEditMode}
  //                   width="100%"
  //                 />
  //               )}
  //             />
  //             {getError("date") && (
  //               <p className="text-red-500 text-xs mt-1">
  //                 {getError("date")?.message as string}
  //               </p>
  //             )}
  //           </div>
  //         </div>

  //         {/* PO Cards */}
  //         <div className="space-y-3">
  //           {posFields.map((posField, posIndex) => (
  //             <POCard
  //               key={posField.id}
  //               doIndex={doIndex}
  //               posIndex={posIndex}
  //               removePos={() => removePos(posIndex)}
  //               totalPO={posFields.length}
  //               isEditMode={isEditMode}
  //               InbType={inbType}
  //             />
  //           ))}
  //         </div>
  //       </div>
  //     </details>
  //   </div>
  // );
}
