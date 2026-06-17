import { FaTruck, FaFileAlt, FaClipboardList, FaDatabase, FaFingerprint, FaBarcode, FaExclamationTriangle } from "react-icons/fa";
import { formatDateTimeIndo } from "../../../../../helper/FormatDateTime";
import { OutboundDoUI } from "../../../../../DynamicAPI/types/ShipConfirmType";

interface RowDetailProps {
  doData: OutboundDoUI;
}

export const ShipConfirmRowDetail = ({ doData }: RowDetailProps) => {
  return (
    <div className="p-6 bg-slate-50 border-x-4 border-l-blue-500 flex flex-col gap-6">
      {/* 🔹 HEADER: Logistics Info (Level DO) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 text-slate-50 group-hover:text-blue-50 transition-colors">
          <FaTruck size={45} />
        </div>
        <h4 className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-3 uppercase tracking-widest border-b pb-2">
          <FaTruck /> Logistics Info (DO Level)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoItem label="Expedition" value={doData.expedition} color="text-slate-900 font-bold" />
          <InfoItem label="Driver Name" value={doData.driver_name ? `${doData.driver_name} (${doData.driver_phone || "-"})` : "-"} />
          <InfoItem label="License Plate" value={doData.license_plate} mono />
          <InfoItem label="Truck Type" value={doData.truck_utilitas} />
          <InfoItem label="Container #" value={doData.container_number} mono />
          <InfoItem label="Seal #" value={doData.seal_number} mono />
          <InfoItem label="Vendor PO" value={doData.vendor_po_number} />
          <InfoItem label="Delivery Date" value={formatDateTimeIndo(doData.delivery_date)} />
        </div>
      </div>

      {/* 🔹 LOOPING: Memo Level */}
      <div className="flex flex-col gap-4">
        {doData.outbound_memos?.map((memo, mIdx) => (
          <div key={mIdx} className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
            {/* Memo Header */}
            <div className="bg-orange-50/50 p-4 border-b border-orange-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                  <FaFileAlt size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Memo Route</span>
                  <span className="text-sm font-black text-slate-800 font-mono">{memo.outbound_memo_number}</span>
                </div>
              </div>
              <div className="text-right flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase">Destination</span>
                <span className="text-xs font-bold text-emerald-700">{memo.destination}</span>
              </div>
            </div>

            {/* Memo Items (ERP Integration Level) */}
            <div className="p-4 flex flex-col gap-4">
              {memo.outbound_memo_items?.map((item, iIdx) => {
                const intg = item.integration_data || {};
                const hasError = intg.create_delivery_message || intg.pick_release_message || intg.ship_confirm_message;

                return (
                  <div key={iIdx} className="border border-slate-100 rounded-lg p-4 bg-slate-50/50 relative">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* 1. Line Item */}
                      <div className="flex flex-col gap-2">
                        <h5 className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase border-b pb-1">
                          <FaClipboardList /> Line Item
                        </h5>
                        <InfoItem label="Item ID" value={item.item_id} mono color="text-blue-700 font-bold" />
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-lg font-black text-slate-800">{item.quantity_plan}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{item.uom}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase mt-1 ${item.status === "PROCESS" ? "text-orange-500" : "text-green-500"}`}>
                          Status: {item.status}
                        </span>
                      </div>

                      {/* 2. ERP Mapping */}
                      <div className="flex flex-col gap-2">
                        <h5 className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 uppercase border-b pb-1">
                          <FaDatabase /> ERP Mapping
                        </h5>
                        <InfoItem label="ISO Header ID" value={intg.iso_header_id} mono />
                        <InfoItem label="Inv Item ID" value={intg.iso_inventory_item_id} mono />
                        <InfoItem label="Delivery Name" value={intg.delivery_name} mono />
                      </div>

                      {/* 3. Attributes */}
                      <div className="flex flex-col gap-2">
                        <h5 className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase border-b pb-1">
                          <FaFingerprint /> Attributes
                        </h5>
                        <InfoItem label="Iface ID" value={intg.iface_id} mono />
                        <InfoItem label="Transaction Type" value={intg.transaction_type} />
                        <InfoItem label="Category" value={intg.delivery_attribute_category} />
                      </div>

                      {/* 4. Delivery Status */}
                      <div className="flex flex-col gap-2">
                        <h5 className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase border-b pb-1">
                          <FaBarcode /> Delivery Status
                        </h5>
                        <div className="flex flex-col gap-1.5">
                          <MiniStatus label="Create" status={intg.create_delivery_status} />
                          <MiniStatus label="Update" status={intg.update_delivery_status} />
                          <MiniStatus label="Pick" status={intg.pick_release_status} />
                          <MiniStatus label="Ship Confirm" status={intg.ship_confirm_status} />
                        </div>
                      </div>
                    </div>

                    {/* Error Banners */}
                    {hasError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h5 className="flex items-center gap-2 text-[10px] font-bold text-red-600 uppercase mb-2">
                          <FaExclamationTriangle /> Integration Errors
                        </h5>
                        <div className="space-y-1.5 text-[11px] text-red-800">
                          {intg.create_delivery_message && (
                            <div className="flex gap-2"><strong className="w-12 font-mono">CREATE:</strong> <span>{intg.create_delivery_message}</span></div>
                          )}
                          {intg.pick_release_message && (
                            <div className="flex gap-2"><strong className="w-12 font-mono">PICK:</strong> <span>{intg.pick_release_message}</span></div>
                          )}
                          {intg.ship_confirm_message && (
                            <div className="flex gap-2"><strong className="w-12 font-mono">SHIP:</strong> <span>{intg.ship_confirm_message}</span></div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- HELPER SUB-COMPONENTS ---
const InfoItem = ({ label, value, mono = false, color = "text-slate-600" }: any) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{label}</span>
    <span className={`text-[11px] truncate leading-tight ${mono ? "font-mono" : ""} ${color}`} title={value}>
      {value || "-"}
    </span>
  </div>
);

const MiniStatus = ({ label, status }: { label: string; status: string }) => (
  <div className="flex items-center justify-between bg-white border border-slate-200 px-2 py-1 rounded shadow-sm w-full max-w-[120px]">
    <span className="text-[9px] font-bold text-slate-500 uppercase">{label}</span>
    <span className={`text-[10px] font-black ${status === "S" ? "text-green-600" : status === "E" ? "text-red-600" : "text-orange-500"}`}>
      {status || "U"}
    </span>
  </div>
);