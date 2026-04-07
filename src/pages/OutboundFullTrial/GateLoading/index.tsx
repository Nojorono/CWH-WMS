/// NEW CODE
// import React, { useEffect, useState, useMemo } from "react";
// import { mapOutboundGateToUILoading } from "./helper/mapOutboundGateToUILoading";
// import { fetchAssignedGate } from "./service/fetchData";
// import { DODetailPanel } from "./newComponents/DODetailPanel";
// import { FaSyncAlt, FaCheckCircle, FaClock } from "react-icons/fa"; // Tambah icon
// import { isGateLoadComplete } from "./helper/isGateLoadComplete"; // Import fungsi pengecekan

// const GateLoadingPage = () => {
//   const [loading, setLoading] = useState(true);
//   const [assignedGateList, setAssignedGateList] = useState<any[]>([]);
//   const [selectedDOId, setSelectedDOId] = useState<string | null>(null);

//   const refreshData = async () => {
//     setLoading(true);
//     const res = await fetchAssignedGate();
//     if (res.success) {
//       let uiData = mapOutboundGateToUILoading(res.data);
//       console.log("Mapped UI Data:", uiData);

//       setAssignedGateList(uiData);
//       if (uiData.length > 0 && !selectedDOId) setSelectedDOId(uiData[0].do_id);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     refreshData();
//   }, []);

//   const activeDO = useMemo(
//     () => assignedGateList.find((doItem) => doItem.do_id === selectedDOId),
//     [assignedGateList, selectedDOId],
//   );

//   // Urutkan assignedGateList: yang pending (belum selesai) di atas, selesai di bawah
//   const sortedGateList = useMemo(() => {
//     return [...assignedGateList].sort((a, b) => {
//       const aFinished = isGateLoadComplete(a);
//       const bFinished = isGateLoadComplete(b);
//       if (aFinished === bFinished) return 0;
//       return aFinished ? 1 : -1; // Pending (false) duluan
//     });
//   }, [assignedGateList]);

//   return (
//     <div className="flex h-screen w-full bg-slate-100 overflow-hidden">
//       {/* --- SIDEBAR KIRI (MASTER LIST) --- */}
//       <aside className="w-[240px] bg-white border-r flex flex-col shrink-0 shadow-xl z-20">
//         <div className="p-6 bg-indigo-900 text-white shrink-0">
//           <h1 className="text-xl font-black tracking-tight">GATE LOADING</h1>
//           <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">
//             Central Warehouse
//           </p>
//         </div>

//         {/* List scrollable */}
//         <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50 text-sm">
//           {sortedGateList.map((item) => {
//             // Logika pengecekan status
//             const isFinished = isGateLoadComplete(item);
//             const isSelected = selectedDOId === item.do_id;

//             return (
//               <div
//                 key={item.do_id}
//                 onClick={() => setSelectedDOId(item.do_id)}
//                 className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm relative overflow-hidden ${
//                   isSelected
//                     ? "border-orange-500 ring-2 ring-orange-100 z-10"
//                     : "border-transparent"
//                 } ${
//                   isFinished
//                     ? "bg-emerald-50 hover:bg-emerald-100"
//                     : "bg-white hover:bg-slate-50"
//                 }`}
//               >
//                 {/* Status Indicator Strip di sisi kiri */}
//                 <div
//                   className={`absolute left-0 top-0 bottom-0 w-1.5 ${
//                     isFinished ? "bg-emerald-500" : "bg-rose-400"
//                   }`}
//                 />

//                 <div className="flex justify-between items-start mb-2 pl-2">
//                   <span
//                     className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
//                       isFinished
//                         ? "bg-emerald-200 text-emerald-700"
//                         : "bg-indigo-100 text-indigo-700"
//                     }`}
//                   >
//                     {item.gate.gate_name}
//                   </span>

//                   {/* Icon Status */}
//                   {isFinished ? (
//                     <div className="flex items-center gap-1 text-emerald-600 animate-bounce-short">
//                       <FaCheckCircle size={14} />
//                       <span className="text-[9px] font-black uppercase">
//                         Done
//                       </span>
//                     </div>
//                   ) : (
//                     <div className="flex items-center gap-1 text-rose-400">
//                       <FaClock size={12} />
//                       <span className="text-[9px] font-black uppercase">
//                         Pending
//                       </span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="pl-2">
//                   <h4
//                     className={`font-black text-lg leading-tight ${
//                       isFinished ? "text-emerald-900" : "text-slate-800"
//                     }`}
//                   >
//                     {item.do_number}
//                   </h4>

//                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
//                     Plat: {item.driver.license_plate}
//                   </p>
//                 </div>

//                 {/* Badge Selesai Jika Sudah Green */}
//                 {isFinished && (
//                   <div className="absolute -right-4 -bottom-1 opacity-10 text-emerald-600">
//                     <FaCheckCircle size={60} />
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </aside>

//       {/* --- PANEL KANAN (DETAIL AREA) --- */}
//       <main className="flex-1 flex flex-col overflow-hidden bg-slate-100">
//         <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
//           <div className="flex items-center gap-2">
//             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
//               Selected DO:
//             </span>
//             <span className="font-black text-slate-800 underline decoration-orange-400 decoration-2">
//               {activeDO?.do_number || "-"}
//             </span>
//           </div>
//           <button
//             onClick={refreshData}
//             className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
//           >
//             <FaSyncAlt className={loading ? "animate-spin" : ""} />
//             REFRESH DATA
//           </button>
//         </header>

//         <div className="flex-1 overflow-y-auto custom-scrollbar">
//           {activeDO ? (
//             <DODetailPanel doData={activeDO} onRefresh={refreshData} />
//           ) : (
//             <div className="h-full flex items-center justify-center text-slate-400 italic">
//               Pilih DO di sebelah kiri untuk melihat detail
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// };

// export default GateLoadingPage;

// // ...existing code...
// import React, { useEffect, useState } from "react";
// import { mapOutboundGateToUILoading } from "./helper/mapOutboundGateToUILoading";
// import GateLoadingDOList from "./components/GateLoadingDOList";
// import { fetchAssignedGate } from "./service/fetchData";
// import Button from "../../../components/ui/button/Button";
// import { FaSyncAlt } from "react-icons/fa";

// const GateLoadingPage = () => {
//   const [loading, setLoading] = useState(true);
//   const [assignedGateList, setAssignedGateList] = useState<any[]>([]);

//   const [openedDOId, setOpenedDOId] = useState<string | null>(null);
//   const [loadingDOId, setLoadingDOId] = useState<string | null>(null);

//   const refreshAssignedGate = async () => {
//     setLoading(true);
//     try {
//       const res = await fetchAssignedGate();
//       if (res.success) {
//         const uiData = mapOutboundGateToUILoading(res.data);
//         setAssignedGateList(uiData);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     refreshAssignedGate();
//   }, []);

//   if (loading) {
//     return (
//       <div className="text-sm text-gray-500">Loading assigned gate...</div>
//     );
//   }

//   return (
//     <div className="min-h-screen w-full px-6 py-6 bg-gray-100">
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-2xl font-bold">Gate Loading – DO List</h1>
//         <Button
//           variant="action"
//           onClick={refreshAssignedGate}
//           disabled={loading}
//           startIcon={<FaSyncAlt />}
//         >
//           Refresh Halaman
//         </Button>
//       </div>

//       <GateLoadingDOList
//         data={assignedGateList}
//         onRefresh={refreshAssignedGate}
//         openedDOId={openedDOId}
//         loadingDOId={loadingDOId}
//         setLoadingDOId={setLoadingDOId}
//         setOpenedDOId={setOpenedDOId}
//       />
//     </div>
//   );
// };

// export default GateLoadingPage;

import React, { useEffect, useState, useMemo } from "react";
import { mapOutboundGateToUILoading } from "./helper/mapOutboundGateToUILoading";
import { fetchAssignedGate } from "./service/fetchData";
import { DODetailPanel } from "./newComponents/DODetailPanel";
import { FaSyncAlt, FaCheckCircle, FaClock } from "react-icons/fa";
import { isGateLoadComplete } from "./helper/isGateLoadComplete";

const GateLoadingPage = () => {
  const [loading, setLoading] = useState(true);
  const [assignedGateList, setAssignedGateList] = useState<any[]>([]);
  const [selectedDOId, setSelectedDOId] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    const res = await fetchAssignedGate();
    if (res.success) {
      let uiData = mapOutboundGateToUILoading(res.data);
      setAssignedGateList(uiData);
      if (uiData.length > 0 && !selectedDOId) setSelectedDOId(uiData[0].do_id);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const activeDO = useMemo(
    () => assignedGateList.find((doItem) => doItem.do_id === selectedDOId),
    [assignedGateList, selectedDOId],
  );

  const sortedGateList = useMemo(() => {
    return [...assignedGateList].sort((a, b) => {
      const aFinished = isGateLoadComplete(a);
      const bFinished = isGateLoadComplete(b);
      if (aFinished === bFinished) return 0;
      return aFinished ? 1 : -1;
    });
  }, [assignedGateList]);

  return (
    // Memastikan tinggi tepat 1200px (h-screen) dan lebar 1920px
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden text-base">
      {/* --- SIDEBAR KIRI: Lebar dioptimalkan untuk tablet (350px) --- */}
      <aside className="w-[350px] bg-white border-r flex flex-col shrink-0 shadow-2xl z-20">
        <div className="p-8 bg-indigo-900 text-white shrink-0">
          <h1 className="text-2xl font-black tracking-tight">GATE LOADING</h1>
          <p className="text-xs text-indigo-300 font-bold uppercase tracking-[0.2em] mt-2">
            Central Warehouse
          </p>
        </div>

        {/* List scrollable dengan padding lebih lega untuk touch area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {sortedGateList.map((item) => {
            const isFinished = isGateLoadComplete(item);
            const isSelected = selectedDOId === item.do_id;

            return (
              <div
                key={item.do_id}
                onClick={() => setSelectedDOId(item.do_id)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm relative overflow-hidden ${
                  isSelected
                    ? "border-orange-500 ring-4 ring-orange-100 z-10 scale-[1.02]"
                    : "border-transparent"
                } ${isFinished ? "bg-emerald-50" : "bg-white"}`}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-2 ${
                    isFinished ? "bg-emerald-500" : "bg-rose-400"
                  }`}
                />

                <div className="flex justify-between items-start mb-3 pl-2">
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full uppercase ${
                      isFinished
                        ? "bg-emerald-200 text-emerald-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {item.gate.gate_name}
                  </span>

                  {isFinished ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <FaCheckCircle size={18} />
                      <span className="text-xs uppercase">Done</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                      <FaClock size={16} />
                      <span className="text-xs uppercase">Pending</span>
                    </div>
                  )}
                </div>

                <div className="pl-2">
                  <h4
                    className={`font-black text-xl leading-tight ${
                      isFinished ? "text-emerald-900" : "text-slate-800"
                    }`}
                  >
                    {item.do_number}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold uppercase mt-2 tracking-widest">
                    PLAT: {item.driver.license_plate}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* --- PANEL KANAN: Detail Area --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b flex items-center justify-between px-10 shrink-0 shadow-sm z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Selected Delivery Order
            </span>
            <span className="font-black text-2xl text-slate-800">
              {activeDO?.do_number || "Select DO"}
            </span>
          </div>

          <button
            onClick={refreshData}
            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-black transition-all shadow-lg active:scale-95"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            REFRESH SYSTEM
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
          {activeDO ? (
            <div className="max-w-5xl mx-auto">
              <DODetailPanel doData={activeDO} onRefresh={refreshData} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="bg-white p-10 rounded-full mb-4 shadow-inner">
                <FaSyncAlt size={48} className="opacity-20" />
              </div>
              <p className="text-lg font-medium italic">
                Silakan pilih DO untuk melihat detail pemuatan
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GateLoadingPage;
