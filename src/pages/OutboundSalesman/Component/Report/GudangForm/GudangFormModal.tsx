import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import Swal from "sweetalert2";
import { GUDANG_FORM_CONFIG } from "./config";
import { GudangFormSheet } from "./GudangFormSheet";
import { GUDANG_FORM_PRINT_PAGE_STYLE } from "./printStyles";
import { GudangFormRow, GudangFormVariant } from "./types";

export type GudangFormModalProps = {
  variant: GudangFormVariant;
  onClose: () => void;
  organizationName?: string;
  formDate?: string;
  doDate?: string;
  rows?: GudangFormRow[];
  /**
   * Untuk retur/tambahan: Confirm → jalankan update (return true) → baru print.
   * Permintaan: biarkan undefined (print langsung).
   */
  onBeforePrint?: (
    setProgress: (text: string) => void,
  ) => Promise<boolean>;
  /** Dipanggil setelah print dialog selesai (atau dibatalkan user). */
  onAfterPrintSuccess?: () => void | Promise<void>;
  /** Teks progress awal saat update berjalan */
  updatingLabel?: string;
};

const CONFIRM_COPY: Partial<
  Record<
    GudangFormVariant,
    { title: string; text: string; confirmText: string }
  >
> = {
  retur: {
    title: "Konfirmasi Print Form Retur?",
    text: "Apakah Anda yakin ingin mencetak form retur ini?",
    confirmText: "Ya, Print",
  },
  tambahan: {
    title: "Konfirmasi Print Form Tambahan?",
    text: "Apakah Anda yakin ingin mencetak form tambahan ini?",
    confirmText: "Ya, Print",
  },
};

const GudangFormModal = ({
  variant,
  onClose,
  organizationName = "-",
  formDate,
  doDate,
  rows = [],
  onBeforePrint,
  onAfterPrintSuccess,
  updatingLabel = "Memproses update data…",
}: GudangFormModalProps) => {
  const config = GUDANG_FORM_CONFIG[variant];
  const printRef = useRef<HTMLDivElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progressText, setProgressText] = useState(updatingLabel);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: config.formTitle,
    pageStyle: GUDANG_FORM_PRINT_PAGE_STYLE,
    onAfterPrint: () => {
      void onAfterPrintSuccess?.();
    },
  });

  const runPrintFlow = async () => {
    if (!onBeforePrint) {
      handlePrint();
      return;
    }

    const copy = CONFIRM_COPY[variant];
    const confirm = await Swal.fire({
      title: copy?.title || "Konfirmasi Print?",
      text: copy?.text || "Lanjutkan print form ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: copy?.confirmText || "Ya, Print",
      cancelButtonText: "Batal",
      confirmButtonColor: "#F26522",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = "1600000";
      },
    });

    if (!confirm.isConfirmed) return;

    setIsUpdating(true);
    setProgressText(updatingLabel);
    try {
      const ok = await onBeforePrint(setProgressText);
      if (!ok) return;
      // Update sukses → buka dialog print Windows
      handlePrint();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1500000] flex items-center justify-center bg-black/50 print:hidden">
      <div className="relative flex h-[90vh] w-11/12 max-w-6xl flex-col overflow-hidden rounded-lg bg-gray-100 shadow-2xl">
        {isUpdating && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 px-6 text-center">
              <div className="relative size-12">
                <div className="absolute size-12 animate-spin rounded-full border-4 border-slate-100 border-t-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Menyiapkan Print
                </h3>
                <p className="mt-1 max-w-sm text-[11px] font-semibold text-slate-500">
                  {progressText}
                </p>
                <p className="mt-2 text-[10px] text-slate-400">
                  Jangan tutup jendela ini sampai proses selesai
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div className="flex items-center space-x-2">
            <svg
              className="h-5 w-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-800">
              {config.previewTitle}
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => void runPrintFlow()}
              className="flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={onClose}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <GudangFormSheet
            ref={printRef}
            variant={variant}
            organizationName={organizationName}
            formDate={formDate}
            doDate={doDate}
            rows={rows}
          />
        </div>
      </div>
    </div>
  );
};

export default GudangFormModal;
