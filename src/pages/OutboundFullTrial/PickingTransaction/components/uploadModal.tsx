import { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  FaCloudUploadAlt,
  FaFilePdf,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import { OutboundDo } from "../Helper/doTypes";
import { showErrorToast } from "../../../../components/toast";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDO: OutboundDo | null;
  onUploadConfirm?: (file: File) => Promise<void>;
  continueToShipConfirm?: boolean;
}

const UploadModal = ({
  isOpen,
  onClose,
  selectedDO,
  onUploadConfirm,
  continueToShipConfirm = false,
}: UploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Fungsi bantu untuk mereset state saat modal ditutup
  const handleClose = () => {
    setFile(null);
    setIsDragActive(false);
    setIsUploading(false);
    onClose();
  };

  // Validasi tipe file (hanya menerima PDF)
  const validateAndSetFile = (selectedFile: File) => {
    const allowedExtensions = /(\.pdf)$/i;
    if (!allowedExtensions.exec(selectedFile.name)) {
      showErrorToast(
        "Format file tidak didukung! Harap unggah file PDF (.pdf).",
      );
      return;
    }
    setFile(selectedFile);
  };

  // --- DRAG & DROP HANDLERS ---
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // --- MANUAL SELECTION HANDLER ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // --- SUBMIT HANDLER ---
  const handleSubmit = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      if (onUploadConfirm) {
        await onUploadConfirm(file);
      } else {
        // Simulasi jika belum disambung ke API backend
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log("File siap diupload:", file.name);
      }
      handleClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  // Helper konversi ukuran file ke KB / MB
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 p-6">
        <h3 className="font-bold text-slate-800 text-lg mb-1">
          {continueToShipConfirm
            ? "Upload File DO Subdist untuk Ship Confirm"
            : "Upload File DO Subdist"}
        </h3>
        <p className="text-sm text-slate-500 mb-5">
          DO:{" "}
          <span className="font-semibold text-slate-700">
            {selectedDO?.outbound_do_number}
          </span>
          {continueToShipConfirm && (
            <span className="block mt-1 text-xs text-amber-600">
              Setelah upload berhasil, proses Ship Confirm Subdist akan dilanjutkan otomatis.
            </span>
          )}
        </p>

        {/* Input file disembunyikan, di-trigger via ref click */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {/* 🔹 AREA DROPZONE INTERAKTIF */}
        {!file ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3
              ${
                isDragActive
                  ? "border-blue-500 bg-blue-50 text-blue-600 scale-[0.99]"
                  : "border-slate-300 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:border-slate-400"
              }`}
          >
            <FaCloudUploadAlt
              className={`text-4xl transition-transform ${isDragActive ? "animate-bounce text-blue-500" : "text-slate-400"}`}
            />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-slate-700">
                Tarik & letakkan File DO Subdist (PDF) di sini
              </p>
              <p className="text-xs text-slate-400">
                atau{" "}
                <span className="text-blue-600 font-semibold underline">
                  pilih dari komputer Anda
                </span>
              </p>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1">
              Menerima .pdf
            </p>
          </div>
        ) : (
          /* 🔹 TAMPILAN KETIKA FILE BERHASIL DIPILIH */
          <div className="border-2 border-emerald-500 bg-emerald-50/30 rounded-xl p-4 flex items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-emerald-500 p-3 rounded-xl text-white shadow-md shadow-emerald-100">
                <FaFilePdf className="text-xl" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-black text-slate-800 truncate pr-2">
                  {file.name}
                </p>
                <p className="text-xs font-bold text-slate-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              disabled={isUploading}
              className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition active:scale-90 disabled:opacity-50"
              title="Hapus File"
            >
              <FaTimes className="text-base" />
            </button>
          </div>
        )}

        {/* 🔹 FOOTER ACTIONS */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || isUploading}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition shadow-lg
              ${
                !file || isUploading
                  ? "bg-slate-300 opacity-70 cursor-not-allowed shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-emerald-100"
              }`}
          >
            {isUploading ? (
              <>
                <FaSpinner className="animate-spin text-sm" />
                Processing...
              </>
            ) : continueToShipConfirm ? (
              "Upload & Lanjut Ship Confirm"
            ) : (
              "Upload & Konfirmasi"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
