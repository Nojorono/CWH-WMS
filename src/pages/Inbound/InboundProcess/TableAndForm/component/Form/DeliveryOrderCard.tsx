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
import { EndPoint } from "../../../../../../utils/EndPoint";
import StatusBadge from "../../../../../../common/statusBadge";
import { STATUS_MAP_INTEGRATION_INBOUND } from "../../../../../../constants/statusMaps";

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

  const [open, setOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDOChecked, setIsDOChecked] = useState(false);
  const [doStatus, setDoStatus] = useState<"success" | "failed" | null>(null);

  const detailsRef = useRef<HTMLDetailsElement>(null);
  const integrationStatus = watch(
    `deliveryOrders.${doIndex}.integration_status` as any,
  );
  const fileUrl = watch(`deliveryOrders.${doIndex}.attachment`);
  const watchedDONo = watch(`deliveryOrders.${doIndex}.do_no`);

  // ✅ GOAL: Auto-unlock jika mode Detail/Edit data sudah ada
  useEffect(() => {
    if ((isDetailMode || isEditMode) && watchedDONo) {
      setIsDOChecked(true);
    }
  }, [isDetailMode, isEditMode, watchedDONo]);

  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const handleToggle = () => setOpen(el.open);
    el.addEventListener("toggle", handleToggle);
    return () => el.removeEventListener("toggle", handleToggle);
  }, []);

  // Reset status jika user mengubah nomor SJ secara manual
  useEffect(() => {
    if (!isDOChecked || isDetailMode) return;
    const handler = setTimeout(() => {
      setDoStatus(null);
      setIsDOChecked(false);
    }, 600);
    return () => clearTimeout(handler);
  }, [watchedDONo]);

  const handleCheckDO = async () => {
    if (!watchedDONo) return showErrorToast("No Surat Jalan wajib diisi");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${EndPoint}inbound/do-validation/${watchedDONo}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();

      if (res.ok && data?.success) {
        const poString = data?.data?.data?.[0]?.DAFTAR_NO_PO || "";
        const poArr = poString
          ? poString.split(",").map((s: string) => s.trim())
          : [];

        setValue(`deliveryOrders.${doIndex}.flag_validated`, true);
        setValue(
          `deliveryOrders.${doIndex}.validation_surat_jalan`,
          poArr.length > 0,
        );

        if (poArr.length > 0) {
          setDoStatus("success");
          replacePos(
            poArr.map((po: string) => ({
              po_no: po,
              items: [],
              vendor_name: "",
              principal: "",
            })),
          );
          showSuccessToast(
            `Validasi berhasil: ditemukan ${poArr.length} Dokumen`,
          );
        } else {
          setDoStatus("failed");
          replacePos([]);
          append({ po_no: "", items: [], vendor_name: "", principal: "" });
          showErrorToast("Nomor PO tidak ditemukan, silakan isi manual.");
        }
      } else {
        setDoStatus("failed");
        showErrorToast(data?.message || "Gagal validasi Surat Jalan");
      }
    } catch (err) {
      setDoStatus("failed");
      showErrorToast("Terjadi kesalahan koneksi");
    } finally {
      setIsDOChecked(true);
    }
  };

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
                    onClick={handleCheckDO}
                    disabled={isDOChecked && doStatus === "success"}
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
                    <div className="absolute inset-0 bg-gray-100/70 flex items-center justify-center text-[10px] text-gray-500">
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
                    id={""}
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
                dataPO={posField.po_no}
                isDOChecked={isDOChecked}
              />
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}

// import { useFormContext, useFieldArray, Controller } from "react-hook-form";
// import { FormValues } from "../formTypes";
// import { inputCls } from "../constants";
// import POCard from "./POCard";
// import Button from "../../../../../../components/ui/button/Button";
// import DatePicker from "../../../../../../components/form/date-picker";
// import {
//   FaTrash,
//   FaChevronDown,
//   FaChevronRight,
//   FaSearch,
// } from "react-icons/fa";
// import { useEffect, useRef, useState } from "react";
// import { formatDateIndo } from "../../../../../../helper/FormatDate";
// import { uploadFileToS3 } from "../Helper/uploadFileToS3";
// import { deleteFileFromS3 } from "../Helper/deleteFileFromS3";
// import {
//   showErrorToast,
//   showSuccessToast,
// } from "../../../../../../components/toast";
// import { EndPoint } from "../../../../../../utils/EndPoint";
// import StatusBadge from "../../../../../../common/statusBadge";
// import { STATUS_MAP_INTEGRATION_INBOUND } from "../../../../../../constants/statusMaps";

// export default function DeliveryOrderCard({
//   doIndex,
//   removeDO,
//   totalDO,
//   isEditMode,
//   isDetailMode,
//   isCreateMode,
//   isAddToReceiveMode,
//   inbType,
// }: {
//   doIndex: number;
//   removeDO: () => void;
//   totalDO: number;
//   isEditMode?: boolean;
//   isDetailMode?: boolean;
//   isCreateMode?: boolean;
//   isAddToReceiveMode?: boolean;
//   inbType: "PO" | "SO" | "RETUR";
// }) {
//   const {
//     control,
//     register,
//     setValue,
//     watch,
//     formState: { errors },
//   } = useFormContext<FormValues>();

//   const {
//     fields: posFields,
//     append: appendPos,
//     remove: removePos,
//     replace: replacePos,
//     append,
//   } = useFieldArray({
//     control,
//     name: `deliveryOrders.${doIndex}.pos`,
//   });

//   const [open, setOpen] = useState(true);
//   const [uploading, setUploading] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [daftarPO, setDaftarPO] = useState<string[]>([]);
//   const [isDOChecked, setIsDOChecked] = useState(false);

//   const detailsRef = useRef<HTMLDetailsElement>(null);
//   const integrationStatus = watch(
//     `deliveryOrders.${doIndex}.integration_status` as any,
//   );

//   useEffect(() => {
//     const el = detailsRef.current;
//     if (!el) return;
//     const handleToggle = () => setOpen(el.open);
//     el.addEventListener("toggle", handleToggle);
//     return () => el.removeEventListener("toggle", handleToggle);
//   }, []);

//   const getError = (field: "do_no" | "attachment" | "date") =>
//     errors.deliveryOrders?.[doIndex]?.[field];

//   const inputClass = (hasError?: boolean) =>
//     `${inputCls} ${hasError ? "border-red-500 focus:ring-red-500" : ""}`;

//   const fileUrl = watch(`deliveryOrders.${doIndex}.attachment`);

//   const handleDeleteFile = async (fileUrl: string) => {
//     setDeleting(true);
//     try {
//       await deleteFileFromS3(fileUrl);
//       setValue(`deliveryOrders.${doIndex}.attachment`, "", {
//         shouldValidate: true,
//       });
//       showSuccessToast("File berhasil dihapus");
//     } catch {
//       showErrorToast("Gagal menghapus file");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const handleUploadFile = async (file: File) => {
//     setUploading(true);
//     try {
//       // Ambil file lama (jika ada)
//       const oldFileUrl = watch(`deliveryOrders.${doIndex}.attachment`);

//       // Kalau ada file lama → hapus dulu dari S3
//       if (oldFileUrl) {
//         try {
//           await deleteFileFromS3(oldFileUrl);
//           console.log("✅ File lama dihapus:", oldFileUrl);
//         } catch (err) {
//           console.warn("⚠️ Gagal hapus file lama:", err);
//           // Tidak fatal, lanjut upload baru saja
//         }
//       }

//       // Upload file baru
//       const newFileUrl = await uploadFileToS3(file);

//       if (newFileUrl) {
//         setValue(`deliveryOrders.${doIndex}.attachment`, newFileUrl, {
//           shouldValidate: true,
//         });
//         showSuccessToast(`Upload berhasil: ${file.name}`);
//       } else {
//         showErrorToast(`Upload gagal untuk ${file.name}`);
//       }
//     } catch (error) {
//       console.error("Upload error:", error);
//       showErrorToast(`Upload error untuk ${file.name}`);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const [doStatus, setDoStatus] = useState<"success" | "failed" | null>(null);
//   const [isCheckDisabled, setIsCheckDisabled] = useState(false);

//   // ✅ VALIDASI DO DAN AUTO-GENERATE PO
//   const handleCheckDO = async () => {
//     const doNo = watch(`deliveryOrders.${doIndex}.do_no`);
//     if (!doNo) {
//       showErrorToast("No Surat Jalan wajib diisi");
//       return;
//     }

//     const token = localStorage.getItem("token");
//     if (!token) {
//       showErrorToast("Token tidak ditemukan");
//       return;
//     }

//     try {
//       const res = await fetch(`${EndPoint}inbound/do-validation/${doNo}`, {
//         method: "GET",
//         headers: {
//           accept: "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const data = await res.json();

//       if (
//         res.ok &&
//         data?.success &&
//         data?.data?.status &&
//         Array.isArray(data?.data?.data)
//       ) {
//         const daftarPOString = data?.data?.data?.[0]?.DAFTAR_NO_PO || "";
//         const daftarPOArr = daftarPOString
//           ? daftarPOString.split(",").map((po: string) => po.trim())
//           : [];

//         setDaftarPO(daftarPOArr);

//         // === ✅ Tandai sudah dicek (flag_validated)
//         setValue(`deliveryOrders.${doIndex}.flag_validated`, true);
//         // === ✅ Jika ada PO, berarti validasi surat jalan TRUE
//         setValue(
//           `deliveryOrders.${doIndex}.validation_surat_jalan`,
//           daftarPOArr.length > 0,
//         );

//         if (daftarPOArr.length > 0) {
//           setDoStatus("success");
//           replacePos(
//             daftarPOArr.map((po: any) => ({
//               po_no: po,
//               so_no: "",
//               vendor_name: "",
//               principal: "",
//               items: [],
//             })),
//           );
//           showSuccessToast(
//             `Validasi Surat Jalan berhasil: ditemukan ${
//               daftarPOArr.length
//             } Dokumen (${daftarPOArr.join(", ")})`,
//           );
//         } else {
//           setDoStatus("failed");
//           replacePos([]);
//           showErrorToast(
//             "Tidak ada nomor PO/SO ditemukan dalam Surat Jalan ini. Tambahkan PO/SO secara manual !",
//           );
//           append({
//             po_no: "",
//             po_date: "",
//             vendor_name: "",
//             principal: "",
//             items: [],
//           });
//         }
//       } else {
//         replacePos([]);
//         setDoStatus("failed");
//         if (data?.message) {
//           showErrorToast(`Gagal cek Surat Jalan: ${data.message}`);
//         }
//       }
//     } catch (err) {
//       replacePos([]);
//       setDoStatus("failed");
//       showErrorToast(`Gagal cek Surat Jalan: ${(err as Error).message}`);
//     } finally {
//       setIsDOChecked(true);
//       setIsCheckDisabled(true);
//     }
//   };

//   // ✅ Hitung kondisi input aktif
//   const canInputDO =
//     (isCreateMode || isEditMode || isAddToReceiveMode) && !!inbType;
//   const canClickCheckDO =
//     (isCreateMode || isEditMode || isAddToReceiveMode) &&
//     !!inbType &&
//     !isDetailMode;

//   const watchedDO = watch(`deliveryOrders.${doIndex}.do_no`);
//   useEffect(() => {
//     if (!isDOChecked) return; // hanya kalau sudah pernah validasi

//     const handler = setTimeout(() => {
//       // user ubah DO => reset status & aktifkan tombol kembali
//       setDoStatus(null);
//       setIsDOChecked(false);
//       setIsCheckDisabled(false);
//     }, 600);

//     return () => clearTimeout(handler);
//   }, [watchedDO]);

//   return (
//     <div className="bg-white rounded-lg shadow p-3 md:p-4 lg:p-5">
//       <details ref={detailsRef} open={open}>
//         <summary
//           className="flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer
//              px-3 py-2 bg-orange-100 rounded-md gap-3 sm:gap-4"
//         >
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full sm:w-auto gap-2">
//             <div className="flex items-center gap-2">
//               {open ? (
//                 <FaChevronDown className="transition-transform" />
//               ) : (
//                 <FaChevronRight className="transition-transform" />
//               )}
//               <span className="text-sm font-semibold text-gray-800">
//                 Surat Jalan #{doIndex + 1}
//               </span>
//             </div>

//             {integrationStatus && (
//               <div className="flex items-center gap-2 sm:ml-4">
//                 <span className="text-xs text-gray-600 font-medium">
//                   Integration Status:
//                 </span>
//                 <StatusBadge
//                   status={integrationStatus}
//                   colorMap={STATUS_MAP_INTEGRATION_INBOUND}
//                   variant="solid"
//                   size="sm"
//                 />
//               </div>
//             )}
//           </div>

//           {/* === RIGHT SECTION: Action Buttons === */}
//           {(isEditMode || isCreateMode || isAddToReceiveMode) && (
//             <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
//               {totalDO > 1 && (
//                 <Button
//                   size="xsm"
//                   type="button"
//                   variant="danger"
//                   onClick={removeDO}
//                 >
//                   <FaTrash className="inline mr-1" />
//                   Discard
//                 </Button>
//               )}
//             </div>
//           )}
//         </summary>

//         {/* ======= FORM SECTION ======= */}
//         <div className="p-3 space-y-4">
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//             {/* === DO No === */}
//             <div className="flex flex-col">
//               <label className="block text-xs text-slate-600 mb-1">
//                 No Surat Jalan{" "}
//                 <span className="text-red-500">
//                   *{" "}
//                   {doStatus === "success" && (
//                     <span className="text-green-600 text-xs">
//                       <strong>Tervalidasi</strong>
//                     </span>
//                   )}
//                   {doStatus === "failed" && (
//                     <span className="text-red-600 text-xs">
//                       <strong>Tak Tervalidasi</strong>
//                     </span>
//                   )}
//                 </span>
//               </label>
//               <div className="flex flex-col sm:flex-row gap-2">
//                 <input
//                   {...register(`deliveryOrders.${doIndex}.do_no` as const, {
//                     required: "No Surat Jalan wajib diisi",
//                   })}
//                   className={`${inputClass(
//                     !!getError("do_no"),
//                   )} w-full sm:flex-1`}
//                   disabled={!canInputDO}
//                 />

//                 <Button
//                   type="button"
//                   size="xsm"
//                   variant="primary"
//                   onClick={handleCheckDO}
//                   disabled={!canClickCheckDO || isCheckDisabled}
//                 >
//                   <FaSearch />
//                 </Button>
//               </div>
//               {getError("do_no") && (
//                 <p className="text-red-500 text-xs mt-1">
//                   {getError("do_no")?.message as string}
//                 </p>
//               )}
//             </div>

//             {/* === Attachment === */}
//             <div className="flex flex-col">
//               <label className="block text-xs text-slate-600 mb-1">
//                 Attachment{" "}
//                 <span className="text-red-500">*tidak boleh dari 2 MB</span>
//               </label>

//               {fileUrl ? (
//                 // === Jika sudah ada file ===
//                 <div className="flex items-center gap-2">
//                   <a
//                     href={fileUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-sm text-blue-600 underline break-all"
//                   >
//                     Lihat file
//                   </a>

//                   {/* Tombol Delete hanya muncul di Create/Edit Mode */}
//                   {(isCreateMode || isEditMode || isAddToReceiveMode) && (
//                     <button
//                       type="button"
//                       className={`text-xs flex items-center gap-1 ${
//                         deleting
//                           ? "text-gray-400 cursor-not-allowed"
//                           : "text-red-600 hover:text-red-700"
//                       }`}
//                       disabled={deleting}
//                       onClick={() => handleDeleteFile(fileUrl)}
//                     >
//                       {deleting ? "Deleting..." : <FaTrash size={12} />}
//                       {!deleting && "Delete"}
//                     </button>
//                   )}
//                 </div>
//               ) : (
//                 // === Jika belum ada file ===
//                 <div
//                   className={`relative w-full ${
//                     isDetailMode || uploading
//                       ? "bg-gray-100 cursor-not-allowed"
//                       : ""
//                   }`}
//                 >
//                   <input
//                     type="file"
//                     className={`${inputClass(
//                       !!getError("attachment"),
//                     )} text-xs w-full ${
//                       isDetailMode || uploading
//                         ? "bg-gray-100 cursor-not-allowed"
//                         : ""
//                     }`}
//                     disabled={
//                       isDetailMode ||
//                       uploading ||
//                       ((isCreateMode || isAddToReceiveMode) && !isDOChecked)
//                     }
//                     onChange={async (e) => {
//                       if (isDetailMode) return;
//                       const file = e.target.files?.[0];
//                       if (file) await handleUploadFile(file);
//                     }}
//                   />

//                   {(isCreateMode || isAddToReceiveMode) && !isDOChecked && (
//                     <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70 text-gray-500 text-xs rounded cursor-not-allowed pointer-events-none">
//                       🔒 Harus validasi SJ dahulu
//                     </div>
//                   )}
//                 </div>
//               )}

//               {uploading && (
//                 <p className="text-xs text-slate-500 mt-1">Uploading...</p>
//               )}
//             </div>

//             {/* === DO Date === */}
//             <div className="flex flex-col">
//               <label className="block text-xs text-slate-600 mb-1">
//                 Tanggal Surat Jalan <span className="text-red-500">*</span>
//               </label>
//               <Controller
//                 control={control}
//                 name={`deliveryOrders.${doIndex}.date` as const}
//                 rules={{ required: "Tanggal wajib diisi" }}
//                 render={({ field, fieldState }) => (
//                   <>
//                     <DatePicker
//                       id="date-picker"
//                       placeholder="Select a date"
//                       value={field.value ? new Date(field.value) : undefined}
//                       onChange={(date: Date | Date[]) => {
//                         if (isDetailMode) return;
//                         const selectedDate = Array.isArray(date)
//                           ? date[0]
//                           : date;
//                         field.onChange(
//                           selectedDate ? formatDateIndo(selectedDate) : "",
//                         );
//                       }}
//                       readOnly={isDetailMode || !isDOChecked}
//                     />
//                     {/* ✅ tampilkan error jika ada */}
//                     {fieldState.error && (
//                       <p className="text-xs text-red-500 mt-1">
//                         {fieldState.error.message}
//                       </p>
//                     )}
//                   </>
//                 )}
//               />
//             </div>
//           </div>

//           {/* === PO Cards === */}
//           <div className="space-y-4">
//             {posFields.map((posField, posIndex) => (
//               <POCard
//                 key={posField.id}
//                 doIndex={doIndex}
//                 posIndex={posIndex}
//                 removePos={() => removePos(posIndex)}
//                 totalPO={posFields.length}
//                 isEditMode={isEditMode}
//                 isDetailMode={isDetailMode}
//                 isCreateMode={isCreateMode}
//                 isAddToReceiveMode={isAddToReceiveMode}
//                 InbType={inbType}
//                 dataPO={posField.po_no || ""}
//                 isDOChecked={isDOChecked}
//               />
//             ))}
//           </div>
//         </div>
//       </details>
//     </div>
//   );
// }
