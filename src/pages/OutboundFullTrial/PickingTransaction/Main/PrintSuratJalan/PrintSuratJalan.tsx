import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import PrintTemplate from "./PrintTemplate";
import { useStoreOutboundDeliveryOrder } from "../../../../../DynamicAPI/stores/Store/MasterStore";
import Swal from "sweetalert2";
import Button from "../../../../../components/ui/button/Button";
import { FaArrowLeft } from "react-icons/fa";

const PrintSuratJalan = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stateAny = location.state as any;
  const params = stateAny?.params ?? stateAny?.data ?? stateAny ?? undefined;

  const { fetchById, detail } = useStoreOutboundDeliveryOrder();

  // State
  const [selectedMemo, setSelectedMemo] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [tempSeal, setTempSeal] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params) fetchById(params);
  }, [params, fetchById]);

  const handleConfirmPrint = async () => {
    const result = await Swal.fire({
      title: "PERHATIAN",
      html: `Pastikan Nomor Seal dan data lainnya sudah benar.<br><br>Dokumen yang sudah dicetak <b>tidak dapat diubah kembali</b>.<br><br>Lanjutkan cetak?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Cetak Sekarang",
      cancelButtonText: "Batal",
      reverseButtons: true,
      focusCancel: true,
      // Tambahkan ini agar alert muncul di atas modal
      target: document.body,
      didOpen: () => {
        // Memaksa Z-Index SweetAlert lebih tinggi dari modal Anda (9999)
        const container = Swal.getContainer();
        if (container) {
          container.style.zIndex = "10000";
        }
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
    setTempSeal(""); // Reset seal saat ganti memo
    setIsConfirmed(false);
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
              Pilih memo untuk mencetak dokumen operasional
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

        {/* Tabel List Memo yang Diperbaiki */}
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
                  Alamat Pengiriman
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                  Aksi
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
                  <td className="p-4 text-sm text-slate-500 leading-relaxed italic">
                    <div className="line-clamp-2" title={memo.ship_to}>
                      {memo.ship_to}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => openModal(memo)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition"
                    >
                      Proses Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Modern */}
      {showModal && selectedMemo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {isConfirmed
                  ? "Preview Surat Jalan"
                  : "Input Kelengkapan Dokumen"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {!isConfirmed ? (
                /* State 1: Input Seal Number */
                <div className="py-10 flex flex-col items-center">
                  <div className="w-full max-w-md">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Input Seal Number untuk{" "}
                      {selectedMemo.outbound_memo_number}
                    </label>
                    <input
                      autoFocus
                      type="text"
                      className="w-full border-2 border-slate-200 p-4 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-lg transition"
                      placeholder="Contoh: 0004059"
                      value={tempSeal}
                      onChange={(e) => setTempSeal(e.target.value)}
                    />
                    <p className="mt-3 text-sm text-slate-500 italic">
                      *Seal number wajib diisi sebelum mencetak.
                    </p>
                    <button
                      disabled={!tempSeal}
                      onClick={() => setIsConfirmed(true)}
                      className="w-full mt-6 bg-indigo-600 disabled:bg-slate-300 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition shadow-indigo-200"
                    >
                      Konfirmasi & Lihat Preview
                    </button>
                  </div>
                </div>
              ) : (
                /* State 2: Preview Surat Jalan */
                <div className="flex flex-col items-center">
                  <div className="bg-slate-100 p-8 rounded-lg shadow-inner w-full flex justify-center overflow-x-auto">
                    <div ref={printRef} className="bg-white shadow-lg">
                      <PrintTemplate
                        memo={selectedMemo}
                        doNumber={detail?.outbound_do_number ?? ""}
                        expedition={detail?.expedition ?? ""}
                        licensePlate={detail?.license_plate ?? ""}
                        sealNumber={tempSeal}
                        containerNumber={detail?.container_number ?? ""}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Muncul hanya saat Preview) */}
            {isConfirmed && (
              <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                <button
                  onClick={() => setIsConfirmed(false)}
                  className="text-slate-600 font-semibold hover:underline"
                >
                  ← Ubah Seal Number
                </button>
                <button
                  onClick={handleConfirmPrint}
                  className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-green-200 transition active:scale-95"
                >
                  Cetak Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintSuratJalan;
