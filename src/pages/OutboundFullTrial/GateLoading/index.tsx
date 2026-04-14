// import React, { useEffect, useState, useMemo } from "react";
// import { mapOutboundGateToUILoading } from "./helper/mapOutboundGateToUILoading";
// import { fetchAssignedGate } from "./service/fetchData";
// import { DODetailPanel } from "./newComponents/DODetailPanel";
// import { FaSyncAlt, FaCheckCircle, FaClock } from "react-icons/fa";
// import { isGateLoadComplete } from "./helper/isGateLoadComplete";

// const GateLoadingPage = () => {
//   const [loading, setLoading] = useState(true);
//   const [assignedGateList, setAssignedGateList] = useState<any[]>([]);
//   const [selectedDOId, setSelectedDOId] = useState<string | null>(null);

//   const refreshData = async () => {
//     setLoading(true);
//     const res = await fetchAssignedGate();
//     if (res.success) {
//       let uiData = mapOutboundGateToUILoading(res.data);
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

//   console.log("activeDO", activeDO);

//   const sortedGateList = useMemo(() => {
//     return [...assignedGateList].sort((a, b) => {
//       const aFinished = isGateLoadComplete(a);
//       const bFinished = isGateLoadComplete(b);
//       if (aFinished === bFinished) return 0;
//       return aFinished ? 1 : -1;
//     });
//   }, [assignedGateList]);

//   return (
//     <div className="flex h-screen w-full bg-slate-100 overflow-hidden text-sm">
//       {/* SIDEBAR: Dikecilkan maksimal ke 240px agar area SKU di kanan sangat luas */}
//       <aside className="w-[200px] bg-white border-r flex flex-col shrink-0 shadow-sm z-20">
//         <div className="p-4 bg-indigo-950 text-white shrink-0">
//           <h1 className="text-sm font-black tracking-tighter uppercase leading-none">
//             Gate-Loading
//           </h1>
//           <p className="text-[8px] text-indigo-300 font-bold uppercase mt-1">
//             Central Warehouse
//           </p>
//         </div>

//         <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-slate-50">
//           {sortedGateList.map((item) => {
//             const isFinished = isGateLoadComplete(item);
//             const isSelected = selectedDOId === item.do_id;

//             return (
//               <div
//                 key={item.do_id}
//                 onClick={() => setSelectedDOId(item.do_id)}
//                 className={`p-2.5 rounded-lg border-2 transition-all cursor-pointer relative overflow-hidden ${
//                   isSelected
//                     ? "border-indigo-600 bg-white shadow-sm scale-[0.98]"
//                     : "border-transparent bg-white/40 opacity-80"
//                 }`}
//               >
//                 <div
//                   className={`absolute left-0 top-0 bottom-0 w-1 ${isFinished ? "bg-emerald-500" : "bg-rose-400"}`}
//                 />
//                 <div className="flex justify-between items-center mb-0.5 pl-1">
//                   <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
//                     {item.gate.gate_name}
//                   </span>
//                   {isFinished && (
//                     <FaCheckCircle className="text-emerald-500" size={10} />
//                   )}
//                 </div>
//                 <div className="pl-1">
//                   <h4
//                     className={`font-black text-xs truncate ${isSelected ? "text-slate-900" : "text-slate-500"}`}
//                   >
//                     {item.do_number}
//                   </h4>
//                   <p className="text-[9px] text-blue-400 font-bold mt-0.5">
//                     {item.driver.license_plate}
//                   </p>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </aside>

//       {/* PANEL KANAN: Area Kerja Utama */}
//       <main className="flex-1 flex flex-col overflow-hidden">
//         <header className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10">
//           <div className="flex flex-col">
//             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
//               Active DO
//             </span>
//             <span className="font-black text-lg text-slate-800 leading-tight">
//               {activeDO?.do_number || "Select DO"}
//             </span>
//           </div>
//           <button
//             onClick={refreshData}
//             className="bg-indigo-600 text-white p-2 rounded-lg text-[10px] font-black flex items-center gap-2"
//           >
//             <FaSyncAlt size={10} className={loading ? "animate-spin" : ""} />{" "}
//             REFRESH
//           </button>
//         </header>

//         <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
//           {activeDO ? (
//             <div className="w-full">
//               <DODetailPanel doData={activeDO} onRefresh={refreshData} />
//             </div>
//           ) : (
//             <div className="h-full flex items-center justify-center text-slate-300 uppercase font-black text-xs">
//               Pilih DO dari Sidebar
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// };

// export default GateLoadingPage;

import React, { useEffect, useState, useMemo } from "react";
import { mapOutboundGateToUILoading } from "./helper/mapOutboundGateToUILoading";
import { fetchAssignedGate } from "./service/fetchData";
import { DODetailPanel } from "./newComponents/DODetailPanel";
import {
  FaSyncAlt,
  FaCheckCircle,
  FaClock,
  FaTruckLoading,
  FaBoxOpen,
} from "react-icons/fa";
import { isGateLoadComplete } from "./helper/isGateLoadComplete";

const GateLoadingPage = () => {
  const [loading, setLoading] = useState(true);
  const [assignedGateList, setAssignedGateList] = useState<any[]>([]);
  const [selectedDOId, setSelectedDOId] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await fetchAssignedGate();
      if (res.success) {
        let uiData = mapOutboundGateToUILoading(res.data);
        setAssignedGateList(uiData);
        // Auto-select DO pertama jika belum ada yang dipilih
        if (uiData.length > 0 && !selectedDOId) {
          setSelectedDOId(uiData[0].do_id);
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
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
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden text-sm">
      {/* SIDEBAR */}
      <aside className="w-[200px] bg-white border-r flex flex-col shrink-0 shadow-sm z-20">
        <div className="p-4 bg-indigo-950 text-white shrink-0">
          <h1 className="text-sm font-black tracking-tighter uppercase leading-none">
            Gate-Loading
          </h1>
          <p className="text-[8px] text-indigo-300 font-bold uppercase mt-1">
            Central Warehouse
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-slate-50">
          {sortedGateList.map((item) => {
            const isFinished = isGateLoadComplete(item);
            const isSelected = selectedDOId === item.do_id;

            return (
              <div
                key={item.do_id}
                onClick={() => setSelectedDOId(item.do_id)}
                className={`p-2.5 rounded-lg border-2 transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? "border-indigo-400 bg-white shadow-sm scale-[0.98]"
                    : "border-transparent bg-white/40 opacity-80 hover:opacity-100"
                }`}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-2 ${
                    isFinished ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                <div className="flex justify-between items-center mb-0.5 pl-1">
                  <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {item.gate.gate_name}
                  </span>
                  {isFinished && (
                    <FaCheckCircle className="text-emerald-500" size={10} />
                  )}
                </div>
                <div className="pl-1">
                  <h4
                    className={`font-black text-xs truncate ${
                      isSelected ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {item.do_number}
                  </h4>
                  <p className="text-[9px] text-blue-400 font-bold mt-0.5">
                    {item.driver.license_plate}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* PANEL KANAN */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              Active DO
            </span>
            <span className="font-black text-lg text-slate-800 leading-tight">
              {activeDO?.do_number || "Select DO"}
            </span>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[10px] font-black flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <FaSyncAlt size={10} className={loading ? "animate-spin" : ""} />{" "}
            REFRESH
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
          {!activeDO ? (
            /* KONDISI 1: Belum pilih DO */
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-12 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2rem]">
                <FaClock className="mx-auto mb-3 text-slate-200" size={32} />
                <p className="text-slate-400 uppercase font-black text-[10px] tracking-widest">
                  Silakan pilih DO dari sidebar untuk memulai
                </p>
              </div>
            </div>
          ) : activeDO.assigned_pallets.length === 0 ||
            activeDO.assigned_gate_loads.length === 0 ? (
            /* KONDISI 2: DO dipilih, tapi data muatan/palet kosong */
            <div className="h-full flex items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem] shadow-sm m-4">
              <div className="text-center max-w-sm p-8">
                <div className="w-20 h-20 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaBoxOpen size={32} />
                </div>
                <h3 className="text-slate-800 font-black text-lg uppercase tracking-tight mb-2">
                  Data Muatan Belum Tersedia
                </h3>
                <div className="mt-8 px-6 py-2 bg-slate-50 text-slate-400 text-[9px] font-black rounded-full border border-slate-100 uppercase tracking-widest inline-flex items-center gap-2">
                  <FaTruckLoading /> Waiting Staging Process
                </div>
              </div>
            </div>
          ) : (
            /* KONDISI 3: Data Siap */
            <div className="w-full animate-in fade-in duration-500">
              <DODetailPanel doData={activeDO} onRefresh={refreshData} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GateLoadingPage;
