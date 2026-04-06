import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import PrintTemplate from "./PrintTemplate";
import { useStoreOutboundDeliveryOrder } from "../../../../../DynamicAPI/stores/Store/MasterStore";
import Swal from "sweetalert2";
import Button from "../../../../../components/ui/button/Button";
import { FaArrowLeft, FaPrint } from "react-icons/fa";
import { formatDateIndo } from "../../../../../helper/FormatDate";

const PrintSuratJalan = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stateAny = location.state as any;
  const params = stateAny?.params ?? stateAny?.data ?? stateAny ?? undefined;

  console.log("params print SJ", params);
  

  const { fetchById, detail } = useStoreOutboundDeliveryOrder();

  // State
  const [selectedMemo, setSelectedMemo] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params) fetchById(params);
  }, [params, fetchById]);

  const handleConfirmPrint = async () => {
    const result = await Swal.fire({
      title: "KONFIRMASI",
      text: "Apakah Anda yakin ingin mencetak Surat Jalan ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Cetak",
      cancelButtonText: "Batal",
      confirmButtonColor: "#16a34a",
      reverseButtons: true,
      target: document.body,
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = "10000";
      },
    });

    if (result.isConfirmed) {
      handlePrint();
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Surat-Jalan-${selectedMemo?.outbound_memo_number}`,
  });

  const openModal = (memo: any) => {
    setSelectedMemo(memo);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMemo(null);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans select-none">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Print Surat Jalan
            </h1>
            <p className="text-slate-500 text-sm">
              Pratinjau dokumen operasional sebelum dicetak
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => navigate(-1)}
            startIcon={<FaArrowLeft />}
          >
            Back to List DO
          </Button>
        </header>

        {/* Tabel List Memo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">
                  No
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  No. Memo
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">
                  Address
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">
                  Delivery Date
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detail?.outbound_memos?.map((memo: any, idx: number) => (
                <tr
                  key={memo.id}
                  className="hover:bg-blue-50/50 transition tracking-tight"
                >
                  <td className="p-4 text-sm text-slate-600 font-medium">
                    {idx + 1}
                  </td>
                  <td className="p-4 text-sm text-blue-600 font-bold">
                    {memo.outbound_memo_number}
                  </td>
                  <td className="p-4 text-sm text-slate-700 font-semibold">
                    {memo.requestor}
                  </td>
                  <td className="p-4 text-sm text-slate-500 italic">
                    <div className="line-clamp-2">{memo.ship_to}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-700 font-semibold">
                    {formatDateIndo(memo.delivery_date)}
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => openModal(memo)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition active:scale-95 flex items-center gap-2 mx-auto"
                    >
                      <FaPrint size={14} /> Preview & Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL PREVIEW (Langsung Preview) --- */}
      {showModal && selectedMemo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex flex-col">
                <h3 className="font-bold text-slate-800 text-lg">
                  Preview Surat Jalan
                </h3>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                  Memo: {selectedMemo.outbound_memo_number}
                </span>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 text-3xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Body (Preview Area) */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-200/50 flex justify-center">
              <div className="bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] origin-top">
                <div ref={printRef} className="print-area">
                  <PrintTemplate
                    memo={selectedMemo}
                    doNumber={detail?.outbound_do_number ?? ""}
                    expedition={detail?.expedition ?? ""}
                    licensePlate={detail?.license_plate ?? ""}
                    sealNumber={detail?.seal_number ?? ""} // Mengambil seal yang sudah diinput sebelumnya
                    containerNumber={detail?.container_number ?? ""}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition"
              >
                Tutup
              </button>
              <button
                onClick={handleConfirmPrint}
                className="bg-green-600 hover:bg-green-700 text-white px-10 py-2.5 rounded-xl font-bold shadow-lg shadow-green-200 transition active:scale-95 flex items-center gap-2"
              >
                <FaPrint /> Cetak Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintSuratJalan;
