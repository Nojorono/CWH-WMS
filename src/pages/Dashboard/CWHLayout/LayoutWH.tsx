import { useState, useMemo } from "react";
import {
  FaBox,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaChevronDown,
  FaWarehouse,
  FaCubes,
} from "react-icons/fa";

const WarehouseMapView = ({ data }: { data: any[] }) => {
  const [selectedPallet, setSelectedPallet] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Grouping Data menggunakan useMemo agar tidak re-render berat
  const zones = useMemo(() => {
    return data.reduce((acc: any, item: any) => {
      const zoneName = item.warehouse_sub_name;
      if (!acc[zoneName]) acc[zoneName] = {};
      const binName = item.warehouse_bin_name || "-";
      if (!acc[zoneName][binName]) acc[zoneName][binName] = [];
      acc[zoneName][binName].push(item);
      return acc;
    }, {});
  }, [data]);

  // Helper untuk cek apakah semua SKU qty-nya 0 (hanya untuk pallet tanpa bad_inventory)
  const isPalletUnused = (pallet: any) => {
    // Jika ada bad_inventory, abaikan (biarkan seperti sekarang)
    if (Array.isArray(pallet.bad_inventory) && pallet.bad_inventory.length > 0)
      return false;
    // Jika tidak ada current_items, dianggap unused
    if (
      !Array.isArray(pallet.current_items) ||
      pallet.current_items.length === 0
    )
      return true;
    // Jika semua qty === 0, unused
    return pallet.current_items.every(
      (item: any) => Number(item.current_quantity) === 0,
    );
  };


  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 p-6">
      {/* --- HEADER CONTROL --- */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`group flex items-center justify-between p-5 mb-6 rounded-2xl cursor-pointer transition-all duration-300 border shadow-sm
          ${isExpanded ? "bg-white border-blue-100 shadow-blue-50" : "bg-blue-600 border-blue-500 shadow-lg shadow-blue-100"}`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl transition-colors ${isExpanded ? "bg-blue-50 text-blue-600" : "bg-blue-500 text-white"}`}
          >
            <FaWarehouse size={24} />
          </div>
          <div>
            <h2
              className={`text-xl font-bold transition-colors ${isExpanded ? "text-gray-800" : "text-white"}`}
            >
              Warehouse Visual Map
            </h2>
            <p
              className={`text-sm ${isExpanded ? "text-gray-500" : "text-blue-100"}`}
            >
              Monitoring {Object.keys(zones).length} Active Zones
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-3 transition-all duration-500 ${isExpanded ? "rotate-180" : "rotate-0"}`}
        >
          <div
            className={`p-2 rounded-full ${isExpanded ? "bg-gray-100 text-gray-400" : "bg-white/20 text-white"}`}
          >
            <FaChevronDown size={18} />
          </div>
        </div>
      </div>
      {/* --- MAIN CONTENT AREA --- */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-500 ease-in-out origin-top
        ${isExpanded ? "opacity-100 scale-100 h-auto" : "opacity-0 scale-95 h-0 overflow-hidden"}`}
      >
        {Object.keys(zones).map((zoneName) => (
          <div
            key={zoneName}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
          >
            {/* Zone Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-600 rounded-full" />
                <h3 className="text-gray-800 font-extrabold tracking-tight">
                  ZONE {zoneName}
                </h3>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                <FaCubes className="text-slate-400" size={12} />
                {/* <span className="text-[11px] font-bold text-slate-600 uppercase italic">
                  {zones[zoneName] ? Object.keys(zones[zoneName]).length : 0}
                  Bins
                </span> */}
              </div>
            </div>

            {/* Bins Grid */}
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-6 bg-slate-50/30">
              {Object.keys(zones[zoneName]).map((binName) => (
                <div key={binName} className="flex flex-col gap-2 group">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Bin {binName}
                    </span>
                  </div>

                  {/* Slot Container */}
                  <div className="min-h-[120px] p-3 bg-white border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-wrap gap-2 transition-colors group-hover:border-blue-200 shadow-inner">
                    {zones[zoneName][binName].map((pallet: any) => {
                      const unused = isPalletUnused(pallet);
                      return (
                        <button
                          key={pallet.id}
                          onClick={() => setSelectedPallet(pallet)}
                          className={`group relative flex flex-col items-center justify-center w-full h-20 rounded-2xl transition-all border-2 
                            ${
                              unused
                                ? "bg-red-100 border-gray-300 hover:border-gray-400"
                                : pallet.bad_inventory.length > 0
                                  ? "bg-red-50 border-red-100 hover:border-red-400 hover:shadow-md hover:shadow-red-50"
                                  : "bg-blue-50 border-blue-50 hover:border-blue-400 hover:shadow-md hover:shadow-blue-50"
                            }`}
                        >
                          <FaBox
                            className={
                              unused
                                ? "text-red-500"
                                : pallet.bad_inventory.length > 0
                                  ? "text-black-500"
                                  : "text-blue-500"
                            }
                            size={22}
                          />
                          <span className="text-[10px] font-black mt-2 text-gray-700 truncate w-full px-2">
                            {pallet.pallet_code}
                          </span>

                          {/* Unused badge */}
                          {unused && (
                            <div className="absolute top-2 right-2 bg-red-400 text-white rounded-full px-2 py-0.5 text-[9px] font-bold shadow">
                              UNUSED
                            </div>
                          )}

                          {/* Bad inventory badge */}
                          {!unused && pallet.bad_inventory.length > 0 && (
                            <div className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 shadow-lg animate-pulse">
                              <FaExclamationTriangle size={10} />
                            </div>
                          )}

                          {/* Status Label */}
                          <div className="absolute -bottom-1 bg-white px-2 py-0.5 rounded-full text-[8px] font-bold border border-gray-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            DETAIL
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* --- EMPTY STATE (When Collapsed) --- */}
      {!isExpanded && <></>}
      {/* --- SIDEBAR DETAIL --- */}
      {selectedPallet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex justify-end transition-all duration-500">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-white/20">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  Pallet Detail
                </h3>
                <p className="text-sm text-gray-500">
                  Detailed stock breakdown
                </p>
              </div>
              <button
                onClick={() => setSelectedPallet(null)}
                className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all text-2xl font-light"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6">
              {/* Card Pallet Info */}
              <div className="relative p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-xl shadow-blue-100 overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                  <FaBox size={120} />
                </div>
                <p className="text-blue-200 text-[10px] uppercase font-black tracking-widest mb-1">
                  Pallet Identity
                </p>
                <h4 className="text-3xl font-black text-white">
                  {selectedPallet.pallet_code}
                </h4>
                <div className="mt-6 flex gap-3">
                  <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/20 italic">
                    {selectedPallet.warehouse_sub_name}
                  </div>
                  <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/20">
                    Bin: {selectedPallet.warehouse_bin_name}
                  </div>
                </div>
              </div>

              {/* SKU List */}
              <div className="space-y-4 pt-4">
                <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">
                  Inventory Items
                </h5>
                {/* Jika unused tampilkan info last used */}
                {isPalletUnused(selectedPallet) ? (
                  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <span className="text-gray-400 text-lg font-bold mb-2">
                      Pallet Unused
                    </span>
                    <span className="text-xs text-red-500">
                      You can check history for this Pallet in Master Pallet
                      menu.
                    </span>
                  </div>
                ) : selectedPallet.current_items &&
                  selectedPallet.current_items.length > 0 ? (
                  // Normal Items
                  selectedPallet.current_items.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white transition-all"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {item.item_name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          Prod. Date:{" "}
                          {item.production_date
                            ? new Date(
                                item.production_date,
                              ).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-blue-600">
                          {item.current_quantity}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold">
                          {item.uom}
                        </p>
                      </div>
                    </div>
                  ))
                ) : selectedPallet.bad_inventory &&
                  selectedPallet.bad_inventory.length > 0 ? (
                  // Jika tidak ada current_items, tampilkan bad_inventory
                  selectedPallet.bad_inventory.map((bad: any, i: number) => (
                    <div
                      key={i}
                      className="flex flex-col p-4 bg-red-50 rounded-2xl border border-red-100 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 px-2 py-0.5 bg-red-500 text-[8px] font-black text-white uppercase rounded-bl-lg">
                        Bad Stock
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold text-red-900">
                            {bad.item_name || bad.item_id}
                          </p>
                          <p className="text-[10px] text-red-400 font-medium">
                            Prod. Date:{" "}
                            {bad.production_date
                              ? new Date(
                                  bad.production_date,
                                ).toLocaleDateString()
                              : "-"}
                          </p>
                          <p className="text-[10px] text-red-400 font-medium">
                            Year: {bad.year || "-"}
                          </p>
                          <p className="text-[10px] text-red-400 font-medium">
                            HJE: {bad.hje || "-"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-red-600">
                            {bad.quantity}
                          </p>
                          <p className="text-[9px] text-red-400 font-bold uppercase">
                            {bad.uom}
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] text-red-700 italic border-t border-red-200/50 pt-2 mt-1 font-medium leading-relaxed">
                        "{bad.notes || "No damage records found"}"
                      </p>
                    </div>
                  ))
                ) : (
                  // Jika tidak ada item sama sekali
                  <div className="text-center text-gray-400 italic text-xs py-6">
                    Tidak ada item
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseMapView;
