interface IrSoCheckingOverlayProps {
  isOpen: boolean;
  title?: string;
  description?: string;
}

const IrSoCheckingOverlay = ({
  isOpen,
  title = "Memeriksa status IR/SO...",
  description = "Mohon tunggu, jangan pindah aksi dulu",
}: IrSoCheckingOverlayProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99990] flex items-center justify-center bg-slate-900/30 backdrop-blur-[1px]">
      <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-lg border border-slate-200">
        <span className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-orange-600" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default IrSoCheckingOverlay;
