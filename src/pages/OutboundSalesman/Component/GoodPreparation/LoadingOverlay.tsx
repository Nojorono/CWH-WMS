import React from "react";

type LoadingOverlayProps = {
  visible: boolean;
  btbDate: string;
  title?: string;
  subtitle?: string;
};

export const LoadingOverlay = ({
  visible,
  btbDate,
  title = "Sinkronisasi Data",
  subtitle,
}: LoadingOverlayProps) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="relative size-12">
          <div className="absolute size-12 rounded-full border-4 border-slate-100 border-t-orange-600 animate-spin" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            {subtitle ?? (
              <>
                Mengambil data BTB Tanggal:{" "}
                <span className="text-orange-600">{btbDate}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

