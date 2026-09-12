import { OutboundDo } from "../Helper/doTypes";

interface SealModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDO: OutboundDo | null;
  sealInput: string;
  setSealInput: (value: string) => void;
  onConfirm: () => void;
}

const SealModal = ({
  isOpen,
  onClose,
  selectedDO,
  sealInput,
  setSealInput,
  onConfirm,
}: SealModalProps) => {
  // Guard clause jika modal tidak terbuka
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Input Seal Number</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            &times;
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">
            Silahkan masukkan nomor seal untuk DO{" "}
            <b>{selectedDO?.outbound_do_number}</b> sebelum mencetak Surat
            Jalan.
          </p>
          <input
            autoFocus
            type="text"
            placeholder="Contoh: SEAL123456"
            className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none transition-all font-bold text-lg"
            value={sealInput}
            onChange={(e) => setSealInput(e.target.value)}
          />
          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              Batal
            </button>
            <button
              disabled={!sealInput}
              onClick={onConfirm}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 shadow-lg shadow-blue-200 transition active:scale-95"
            >
              Simpan & Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SealModal;
