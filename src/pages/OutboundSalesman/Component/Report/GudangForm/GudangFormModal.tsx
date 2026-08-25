import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
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
};

const GudangFormModal = ({
  variant,
  onClose,
  organizationName = "-",
  formDate,
  doDate,
  rows = [],
}: GudangFormModalProps) => {
  const config = GUDANG_FORM_CONFIG[variant];
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: config.formTitle,
    pageStyle: GUDANG_FORM_PRINT_PAGE_STYLE,
  });

  return (
    <div className="fixed inset-0 z-[1500000] flex items-center justify-center bg-black/50 print:hidden">
      <div className="flex h-[90vh] w-11/12 max-w-6xl flex-col overflow-hidden rounded-lg bg-gray-100 shadow-2xl">
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
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handlePrint()}
              className="flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
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
              onClick={onClose}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600"
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
