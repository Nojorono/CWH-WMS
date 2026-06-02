import React, { useState } from "react";
// Menggunakan react-icons/md sesuai kebutuhan proyek
import {
  MdCalendarToday,
  MdPlace,
  MdAssignment,
  MdCardTravel,
  MdLocalShipping,
  MdArrowForward,
} from "react-icons/md";

// ==========================================
// INTERFACES & DUMMY DATA
// ==========================================
interface SkuItem {
  sku: string;
  qty: number;
  uom: string;
  remark: string;
}

interface CustomerProduct {
  name: string;
  qty: number;
}

interface CustomerSummaryItem {
  id: string;
  customerName: string;
  skuTarget: string;
  date: string;
  products: CustomerProduct[];
}

const INITIAL_SKU_DATA: SkuItem[] = [
  {
    sku: "Class Mild 16",
    qty: 52,
    uom: "BKS",
    remark: "Keep based on route demand",
  },
  { sku: "Minak Djinggo", qty: 32, uom: "BKS", remark: "No Change" },
];

const INITIAL_CUSTOMER_DATA: CustomerSummaryItem[] = [
  {
    id: "c1",
    customerName: "PT Maju Jaya",
    skuTarget: "Class Mild 16",
    date: "2026-04-29",
    products: [
      { name: "Produk A", qty: 52 },
      { name: "Produk B", qty: 32 },
    ],
  },
  {
    id: "c2",
    customerName: "CV Sinar Baru",
    skuTarget: "Class Mild 16",
    date: "2026-04-29",
    products: [
      { name: "Produk A", qty: 12 },
      { name: "Produk B", qty: 25 },
    ],
  },
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function SuggestionDraftSummary() {
  const [skuData] = useState<SkuItem[]>(INITIAL_SKU_DATA);
  const [customerData] = useState<CustomerSummaryItem[]>(INITIAL_CUSTOMER_DATA);
  const [selectedDate, setSelectedDate] = useState<string>("2026-04-29");

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-[#f8fafc] rounded-2xl shadow-sm font-sans text-slate-800 antialiased">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Suggestion Draft Summary
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Sales Owner :{" "}
            <span className="font-semibold text-slate-700">Agus Setiawan</span>
          </p>
        </div>
        <button className="bg-[#f26522] hover:bg-[#d94f12] text-white px-5 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 transition-all shadow-sm">
          Review Suggestion <MdArrowForward size={16} />
        </button>
      </div>

      {/* Detail Information Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Detail Information
          </span>
          <span className="bg-emerald-50 text-emerald-600 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200/50">
            Draft Generated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
          <InfoRow
            icon={<MdAssignment size={16} />}
            label="Route Number"
            value="CP-2026-041"
          />
          <InfoRow
            icon={<MdCalendarToday size={15} />}
            label="Tanggal Awal"
            value="2025-04-29"
          />
          <InfoRow
            icon={<MdCardTravel size={16} />}
            label="Trip Type"
            value="Luar Kota"
          />
          <InfoRow
            icon={<MdAssignment size={16} />}
            label="Call Plan Number"
            value="CP-2026-041"
          />
          <InfoRow
            icon={<MdCalendarToday size={15} />}
            label="Tanggal Akhir"
            value="2025-04-30"
          />
        </div>
      </div>

      {/* SKU Table Card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f26522] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="px-5 py-3 w-1/4">SKU</th>
                <th className="px-5 py-3 text-center">QTY</th>
                <th className="px-5 py-3 text-center">UOM</th>
                <th className="px-5 py-3">REMARK</th>
                <th className="px-5 py-3 text-center w-40">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {skuData.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-900">
                    {item.sku}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 text-center">
                    {item.qty}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 text-center font-medium">
                    {item.uom}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 italic">
                    {item.remark}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button className="w-full border border-orange-200 text-[#f26522] text-xs py-1.5 rounded-lg hover:bg-orange-50 font-semibold transition-colors">
                      Lihat Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Summary Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {/* Customer Section Header */}
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-[#f26522] font-bold text-sm tracking-wide uppercase">
            <MdLocalShipping size={18} />
            <span>Customer Summary</span>
          </div>

          {/* Date Picker Component */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-200 rounded-lg pl-3 pr-9 py-1.5 text-xs font-medium text-slate-700 w-40 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              placeholder="Pilih tanggal"
            />
            <MdCalendarToday
              size={14}
              className="absolute right-3 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Customer Cards Container dengan Scrollbar Premium */}
        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
          {customerData.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-xl border border-slate-200/70 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card Meta Info */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-50 text-[#f26522] rounded-lg border border-orange-100">
                    <MdPlace size={14} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {customer.customerName}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                  <MdCalendarToday size={12} />
                  <span>{customer.date}</span>
                </div>
              </div>

              {/* SKU Target Info */}
              <div className="text-[11px] font-medium text-slate-400 mb-3 pl-8 flex items-center gap-1">
                <span>SKU</span>
                <span className="text-slate-600 font-semibold">
                  {customer.skuTarget}
                </span>
              </div>

              {/* Sub-table Inside Card */}
              <div className="pl-8">
                <div className="overflow-hidden rounded-lg border border-slate-100 shadow-2xs">
                  <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-100 px-4 py-2 text-[11px] font-bold text-slate-500">
                    <div>Nama Produk</div>
                    <div className="text-right sm:text-left sm:pl-8">Qty</div>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    {customer.products.map((prod, pIdx) => (
                      <div
                        key={pIdx}
                        className="grid grid-cols-2 px-4 py-2.5 text-xs"
                      >
                        <div className="font-bold text-slate-700">
                          {prod.name}
                        </div>
                        <div className="text-slate-600 text-right sm:text-left sm:pl-8">
                          {prod.qty}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS custom untuk scrollbar tipis khas enterprise dashboard */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

// ==========================================
// HELPER COMPONENT (SUB-ROW INFO)
// ==========================================
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-slate-400 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
          {label}
        </span>
        <span className="text-xs font-bold text-slate-700 mt-0.5">{value}</span>
      </div>
    </div>
  );
}
