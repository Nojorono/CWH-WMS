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
