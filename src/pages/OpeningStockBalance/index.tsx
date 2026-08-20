import React, { useState, useRef } from "react";
import {
  FaDownload,
  FaCloudUploadAlt,
  FaFileExcel,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import { useOpeningStockStore } from "../../DynamicAPI/services/Service/OpeningStockBalanceService";
import { usePersistAuthStore } from "../../API/store/AuthStore/PersistAuthStore";
import DatePicker from "../../components/form/date-picker";
import OpeningStockListPage from "./ViewTable/OpeningStockListPage";
import { showSuccessToast } from "../../components/toast";

export default function OpeningStockUploadPage() {
  // Ambil state dan action dari Zustand Store
  const {
    isUploading,
    isLoading,
    error,
    downloadTemplateFile,
    uploadTemplateFile,
    clearError,
  } = useOpeningStockStore();

  const user = usePersistAuthStore((state) => state.user);
  const organizationId =
    user?.userDetail?.organizationId ||
    user?.userDetail?.organization?.id ||
    "";
  const organizationName =
    user?.userDetail?.organization?.organization_name ||
    user?.userDetail?.organization?.organization_code ||
    "";
  const roleName = user?.role?.name;
  const isManager = roleName === "MANAGER";

  // State internal untuk Form Metadata
  const [periodDate, setPeriodDate] = useState(
    new Date().toISOString().split("T")[0],
  ); // Default hari ini
  const [weekNumber, setWeekNumber] = useState<number | "">("");
  const [documentNo, setDocumentNo] = useState("");
  const [notes, setNotes] = useState("");

  // State untuk penampung file Excel
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Validasi ekstensi excel sederhana
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        setSelectedFile(file);
        clearError();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      clearError();
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !organizationId || !periodDate) return;

    const result = await uploadTemplateFile({
      file: selectedFile,
      organization_id: organizationId,
      period_date: periodDate,
      week_number: weekNumber === "" ? null : Number(weekNumber),
      document: documentNo || undefined,
      notes: notes || undefined,
    });

    if (result) {
      showSuccessToast(`Berhasil unggah! Dokumen Opening Stock: ${result.code}`);
      setSelectedFile(null);
    }
  };

  return (
    <div>
      {/* ==========================================
       * GLOBAL LOADING OVERLAY BLOCKER
       * ========================================== */}
      {!isManager && isUploading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm pointer-events-auto select-none">
          <div className="bg-white px-8 py-6 rounded-xl shadow-xl border border-slate-100 flex flex-col items-center space-y-4 max-w-sm text-center animate-in fade-in zoom-in-95 duration-200">
            <FaSpinner className="w-10 h-10 text-blue-600 animate-spin" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Mengunggah Saldo Awal
              </h3>
              <p className="text-xs text-slate-500 mt-1 px-2">
                Sistem sedang memproses, memvalidasi kolom, dan menyimpan baris
                item data WMS Anda. Mohon tunggu sebentar...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Konten Utama Page */}
      {!isManager && (
      <div className="max-w-8xl mx-auto p-6 space-y-6">
        {/* Header Halaman */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Opening Stock Balance
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Unggah berkas opening stock gudang melalui template Excel.
            </p>
          </div>
        </div>

        {/* Handling Pesan Error dari Store */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <div className="flex-1 text-sm text-rose-700 font-medium">
              {error}
            </div>
            <button
              onClick={clearError}
              className="text-rose-500 hover:text-rose-700 transition mt-0.5"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Grid Layout Utama */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* KOLOM KIRI: Form Metadata Header */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 h-fit">
            <h2 className="text-sm font-bold text-slate-800 tracking-wider uppercase">
              Document Metadata
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Organization *
              </label>
              <input
                type="text"
                readOnly
                value={organizationName || "-"}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-700 cursor-not-allowed focus:outline-none"
              />
              {!organizationId && (
                <p className="mt-1 text-[11px] text-rose-500">
                  Organization login tidak ditemukan. Silakan login ulang.
                </p>
              )}
            </div>

            <div>
              <DatePicker
                id="opening-stock-period-date"
                label="Period Date *"
                placeholder="Select period date"
                value={periodDate}
                onChange={([date]) => {
                  if (!date) {
                    setPeriodDate("");
                    return;
                  }
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  setPeriodDate(`${year}-${month}-${day}`);
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Week Number
              </label>
              <input
                type="number"
                placeholder="Optional"
                value={weekNumber}
                onChange={(e) =>
                  setWeekNumber(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Document Name / Ref
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={documentNo}
                onChange={(e) => setDocumentNo(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                placeholder="Tambahkan catatan dokumen di sini..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition resize-none"
              />
            </div>
          </div>

          {/* KOLOM KANAN: File Management Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Section Aksi Download Template */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 flex items-center justify-center">
                  <FaDownload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Butuh template kolom berkas?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gunakan berkas berstruktur resmi agar data baris item
                    tervalidasi dengan tepat.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isLoading}
                onClick={downloadTemplateFile}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition disabled:opacity-60 shadow-sm whitespace-nowrap"
              >
                <FaDownload className="w-3 h-3 text-slate-500" />
                {isLoading ? "Mengunduh..." : "Unduh Template"}
              </button>
            </div>

            {/* Section Drag & Drop File Upload */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-800 tracking-wider uppercase">
                File Upload
              </h2>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50/40"
                    : selectedFile
                      ? "border-emerald-500 bg-emerald-50/10"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center justify-center">
                      <FaFileExcel className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition"
                    >
                      Hapus File
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-3.5 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
                      <FaCloudUploadAlt className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        <span className="text-blue-600 font-semibold hover:underline">
                          Pilih file Excel
                        </span>{" "}
                        atau seret kesini
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Mendukung format berkas .xlsx, .xls
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tombol Eksekusi Aksi */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setSelectedFile(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition disabled:opacity-50"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={
                    isUploading ||
                    !selectedFile ||
                    !organizationId ||
                    !periodDate
                  }
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg shadow-sm transition flex items-center gap-2"
                >
                  Execute & Save
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      )}

      {isManager && <OpeningStockListPage />}
    </div>
  );
}
