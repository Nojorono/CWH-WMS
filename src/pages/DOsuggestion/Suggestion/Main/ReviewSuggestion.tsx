import React, { useState } from 'react';
import { 
  MdCalendarToday, 
  MdKeyboardArrowDown, 
  MdHistory, 
  MdLocalShipping,
  MdPerson,
  MdCheckBox
} from "react-icons/md";

// --- Dummy Data ---
const SUGGESTION_DATA = [
  {
    id: 1,
    storeName: "Toko Maju Jaya",
    day: "Sabtu",
    week: "Ganjil",
    date: "2026-04-29",
    lastTransaction: "2026-04-05",
    tripType: null,
    items: [
      { sku: "Class Mild 16", qty: 18, uom: "BKS", status: "Draft" },
      { sku: "Minak Djinggo", qty: 10, uom: "BKS", status: "Draft" },
    ]
  },
  {
    id: 2,
    storeName: "CV Sinar Baru",
    day: "Sabtu",
    week: "Ganjil",
    date: "2026-04-29",
    lastTransaction: "2026-04-05",
    tripType: "Luar Kota (Multi Trip)",
    items: [
      { sku: "Class Mild 16", qty: 14, uom: "BKS", status: "Draft" },
      { sku: "Minak Djinggo", qty: 12, uom: "BKS", status: "Draft" },
    ]
  },
  {
    id: 3,
    storeName: "UD Berkah",
    day: "Minggu",
    week: "Ganjil",
    date: "2026-04-30",
    lastTransaction: "2026-04-06",
    tripType: "Luar Kota (Multi Trip)",
    items: [
      { sku: "Class Mild 16", qty: 20, uom: "BKS", status: "Draft" },
      { sku: "Minak Djinggo", qty: 10, uom: "BKS", status: "Draft" },
    ]
  }
];

const SuggestionDashboard = () => {
  const [selectedWeek, setSelectedWeek] = useState("Ganjil");

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] font-sans antialiased pb-28">
      {/* --- Top Header Section --- */}
      <div className="bg-white border-b border-slate-200 p-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-6 max-w-[1600px] mx-auto">
          
          {/* User Profile Info */}
          <div className="flex items-center gap-4 bg-white border border-slate-100 p-3 rounded-2xl shadow-sm min-w-[240px]">
            <div className="w-12 h-12 bg-orange-50 text-[#f26522] rounded-xl flex items-center justify-center border border-orange-100">
              <MdPerson size={28} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Sales Detail</p>
              <h2 className="text-sm font-bold text-slate-800">Budi Santoso</h2>
              <p className="text-xs text-slate-500">EMP00123</p>
            </div>
          </div>

          {/* Filters Area */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 ml-1">Tanggal</label>
              <div className="relative group">
                <input 
                  type="text" 
                  readOnly 
                  value="2026/04/01 - 2026/04/30"
                  className="bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-700 w-64 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                />
                <MdCalendarToday className="absolute right-3.5 top-3 text-slate-400 group-hover:text-orange-500 transition-colors" size={18} />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 ml-1">Week</label>
              <div className="relative min-w-[140px]">
                <select 
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="appearance-none w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                >
                  <option>Ganjil</option>
                  <option>Genap</option>
                </select>
                <MdKeyboardArrowDown className="absolute right-3.5 top-3 text-slate-400 pointer-events-none" size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
        {SUGGESTION_DATA.map((store) => (
          <div key={store.id} className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
            
            {/* Store Header Info */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">{store.storeName}</h3>
                  <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
                    <InfoBlock label="Hari" value={store.day} icon={<MdCheckBox size={20}/>} />
                    <InfoBlock label="Week" value={store.week} icon={<div className="w-4 h-4 border-2 border-slate-300 rounded-[4px]"/>} />
                    <InfoBlock label="Date" value={store.date} icon={<MdCalendarToday size={18}/>} />
                    
                    {store.tripType && (
                      <InfoBlock label="Trip" value={store.tripType} icon={<MdLocalShipping size={20}/>} />
                    )}

                    <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
                      <div className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                        <MdHistory size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Transaksi Terakhir</p>
                        <p className="text-sm font-bold text-slate-600">{store.lastTransaction}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100 px-10 py-2 rounded-full text-slate-400 text-xs font-extrabold uppercase tracking-widest self-start md:self-center">
                  Draft
                </div>
              </div>

              {/* SKU Table Container */}
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-[#fafbfc]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                        <th className="px-6 py-4">SKU</th>
                        <th className="px-6 py-4 text-center">Suggestion Qty</th>
                        <th className="px-6 py-4 text-center">Uom</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {store.items.map((item, idx) => (
                        <tr key={idx} className="bg-white hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5 text-sm font-bold text-slate-800">{item.sku}</td>
                          <td className="px-6 py-5 text-center text-sm text-slate-600 font-semibold">{item.qty}</td>
                          <td className="px-6 py-5 text-center text-xs text-slate-500 font-bold tracking-wider">{item.uom}</td>
                          <td className="px-6 py-5 text-center">
                            <span className="inline-block bg-[#fff7ed] text-[#f26522] px-10 py-1.5 rounded-full text-[11px] font-extrabold border border-orange-100/50 shadow-sm">
                              {item.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Fixed Footer Action --- */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-lg border-t border-slate-100 z-30 flex justify-center">
        <button className="bg-[#f26522] hover:bg-[#d94f12] text-white w-full max-w-4xl py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-orange-200 transition-all active:scale-[0.98] tracking-wide">
          Continue to Revision
        </button>
      </div>
    </div>
  );
};

interface InfoBlockProps {
  label: string;
  value: string | number;
  icon: React.ReactNode; // ReactNode memungkinkan icon berupa komponen atau element
}

// --- Reusable Info Component ---
const InfoBlock = ({ label, value, icon }: InfoBlockProps) => (
  <div className="flex items-center gap-3">
    <div className="p-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100">
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-700 leading-none">{value}</p>
    </div>
  </div>
);

export default SuggestionDashboard;