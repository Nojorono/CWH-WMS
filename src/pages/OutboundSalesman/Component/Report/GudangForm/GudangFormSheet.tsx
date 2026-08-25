import React from "react";
import { GUDANG_FORM_CONFIG } from "./config";
import { formatDisplayDate } from "./formatters";
import { GudangFormTable } from "./GudangFormTable";
import { GudangFormRow, GudangFormVariant } from "./types";

export type GudangFormSheetProps = {
  variant: GudangFormVariant;
  organizationName?: string;
  formDate?: string;
  doDate?: string;
  rows?: GudangFormRow[];
};

/** Konten form yang dicetak (tanpa chrome modal). */
export const GudangFormSheet = React.forwardRef<
  HTMLDivElement,
  GudangFormSheetProps
>(function GudangFormSheet(
  {
    variant,
    organizationName = "-",
    formDate,
    doDate,
    rows = [],
  },
  ref,
) {
  const config = GUDANG_FORM_CONFIG[variant];

  return (
    <div ref={ref} className="gudang-form-sheet bg-white text-black">
      <div className="mx-auto max-w-5xl border-2 border-gray-400 bg-white p-10 print:m-0 print:max-w-none print:border-0 print:p-0">
        <h1 className="mb-6 text-center text-2xl font-bold uppercase tracking-wide print:mb-3 print:text-lg">
          {config.formTitle}
        </h1>

        <div className="mb-6 space-y-1 print:mb-3">
          <h2 className="text-lg font-bold print:text-sm">{organizationName}</h2>
          <div className="grid grid-cols-[220px_1fr] text-sm print:grid-cols-[180px_1fr] print:text-xs">
            <span>{config.dateLabel}</span>
            <span className="font-semibold">
              : {formatDisplayDate(formDate)}
            </span>
            <span>Untuk DO Hari / Tanggal</span>
            <span className="font-semibold">: {formatDisplayDate(doDate)}</span>
          </div>
        </div>

        <GudangFormTable config={config} rows={rows} />
      </div>
    </div>
  );
});
