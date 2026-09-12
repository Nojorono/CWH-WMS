// File: component/PrintAllSKU.tsx
import React, { useState } from "react";
import { FaPrint } from "react-icons/fa";
import dayjs from "dayjs";

interface PrintAllSKUProps {
    isOpen: boolean;
    onClose: () => void;
    data: any[];
    targetDate: string;
    organizationName: string;
    spbCount: number;
    callplanNumber: string;
}

export const PrintAllSKU = ({
    isOpen,
    onClose,
    data,
    targetDate,
    organizationName,
    spbCount,
    callplanNumber,
}: PrintAllSKUProps) => {
    const [runningNumber, setRunningNumber] = useState("0001");
    const [printedDate] = useState(() => dayjs().format("DD MMMM YYYY HH:mm"));

    if (!isOpen) return null;

    // Menghasilkan No. DAR dengan format AMO/DAR/[Tanggal SPB]/[Jumlah SPB]/[CALLPLAN NUMBER]/[Running Number]
    const darNumber = `AMO/DAR/${targetDate}/${spbCount}/${callplanNumber}/${runningNumber}`;

    return (
        <div className="fixed inset-0 z-[150000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            {/* CSS Overrides untuk mencetak area print-area saja */}
            <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                {/* Modal Header (Akan tersembunyi saat dicetak) */}
                <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center print:hidden">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">
                            Print Preview: All SKU Picklist (DAR)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Accumulated Dokumen Ambil Rokok
                        </p>
                    </div>

                    {/* Control Panel: Edit Running Number & Print Action */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-700">Running No:</label>
                            <input
                                type="text"
                                value={runningNumber}
                                onChange={(e) => setRunningNumber(e.target.value)}
                                className="w-20 px-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
                                placeholder="0001"
                            />
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow transition-colors flex items-center gap-2"
                        >
                            <FaPrint /> Print / Save PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-650 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                        >
                            Tutup
                        </button>
                    </div>
                </div>

                {/* Modal Body (Printable Area) */}
                <div className="p-12 overflow-y-auto flex-1 bg-white" id="print-area">

                    {/* Document Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-lg font-black text-black tracking-wide uppercase">
                            DOKUMEN AMBIL ROKOK
                        </h1>
                    </div>

                    {/* Metadata Header */}
                    <div className="text-xs font-bold text-black space-y-3 mb-8 max-w-2xl">
                        <div className="flex items-center">
                            <span className="w-32">Printed Date</span>
                            <span className="mr-2">:</span>
                            <span className="flex-1 font-semibold">{printedDate}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-32">Tanggal SPB</span>
                            <span className="mr-2">:</span>
                            <span className="flex-1 font-semibold">{dayjs(targetDate).format("DD-MM-YYYY")}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-32">No. DAR</span>
                            <span className="mr-2">:</span>
                            <span className="flex-1 font-semibold uppercase">{darNumber}</span>
                        </div>
                    </div>

                    {/* Table of Aggregated SKUs */}
                    <table className="w-full text-xs text-left border-collapse">
                        <thead>
                            <tr className="border-t-2 border-b-2 border-black font-bold text-black uppercase">
                                <th className="px-3 py-2.5 text-left">JENIS ROKOK</th>
                                <th className="px-3 py-2.5 text-right w-28">TOTAL SPB</th>
                                <th className="px-3 py-2.5 text-right w-28">STOCK SISA</th>
                                <th className="px-3 py-2.5 text-right w-28">AMBIL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={index} className="text-black font-bold border-b border-dashed border-slate-400">
                                    <td className="px-3 py-3 text-left uppercase">{item.itemName}</td>
                                    <td className="px-3 py-3 text-right">{item.finalQty}</td>
                                    <td className="px-3 py-3 text-right">{item.btbQty}</td>
                                    <td className="px-3 py-3 text-right font-black">{item.topUpQty}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Document Footer (Tanda Tangan) */}
                    <div className="mt-16 flex justify-between items-center text-xs text-black px-4">
                        <div className="flex flex-col items-center w-48">
                            <p className="font-bold">Helper Gudang</p>
                            <div className="h-20"></div>
                            <p className="font-bold">(Nama & Tgl)</p>
                        </div>
                        <div className="flex flex-col items-center w-48">
                            <p className="font-bold">Kepala Gudang</p>
                            <div className="h-20"></div>
                            <p className="font-bold">(Nama & Tgl)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};