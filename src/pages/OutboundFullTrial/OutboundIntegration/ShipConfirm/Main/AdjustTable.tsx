import { useEffect, useMemo, useState } from "react";
import {
  FaChevronDown,
  FaChevronRight,
  FaDatabase,
  FaBoxOpen,
  FaInfoCircle,
  FaCalendarAlt,
  FaRoute,
  FaFingerprint,
  FaTruck,
  FaFileAlt,
  FaBarcode,
  FaClipboardList,
} from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import { formatDateIndo } from "../../../../../helper/FormatDate";
import StatusBadge from "../../../../../common/statusBadge";
import { STATUS_MAP_INTEGRATION_OUTBOUND } from "../../../../../constants/statusMaps";
import { useStoreShipConfirm } from "../../../../../DynamicAPI/stores/Store/MasterStore";
import ActIndicator from "../../../../../components/ui/activityIndicator";
import ExpandableTableComponent from "../component/Table";

const OutboundShipConfirmTable = ({
  globalFilter,
  setGlobalFilter,
  filteredIO,
}: any) => {
  const { fetchAll, list, pagination, isLoading } = useStoreShipConfirm();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredData = useMemo(() => {
    if (!list) return [];
    let result = [...list];

    if (filteredIO) {
      result = result.filter((item: any) => item.organization_id === filteredIO);
    }

    if (globalFilter) {
      const lowerFilter = globalFilter.toLowerCase();
      result = result.filter(
        (item: any) =>
          item.outbound_do?.outbound_do_number?.toLowerCase().includes(lowerFilter) ||
          item.outbound_memo?.outbound_memo_number?.toLowerCase().includes(lowerFilter) ||
          item.iso_header_id?.toLowerCase().includes(lowerFilter) ||
          item.transaction_type?.toLowerCase().includes(lowerFilter)
      );
    }

    return result;
  }, [list, filteredIO, globalFilter]);

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <button className="p-1 rounded-full bg-slate-100 group-hover:bg-white transition-colors">
              {row.getIsExpanded() ? (
                <FaChevronDown className="text-blue-600 w-3 h-3" />
              ) : (
                <FaChevronRight className="text-slate-400 w-3 h-3" />
              )}
            </button>
          </div>
        ),
      },
      {
        header: "DO & Memo",
        accessorKey: "outbound_do.outbound_do_number",
        cell: ({ row }) => (
          <>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">DO Number</span>
              <span className="font-bold text-blue-700 font-mono tracking-tight text-sm">
                {row.original.outbound_do?.outbound_do_number || "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 rounded font-mono">
                Memo: {row.original.outbound_memo?.outbound_memo_number || "-"}
              </span>
            </div>
          </>
        ),
      },
      {
        header: "Transaction Type",
        accessorKey: "transaction_type",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-[11px] leading-tight text-orange-600 font-bold">
              {row.original.transaction_type}
            </span>
            <span className="text-[10px] text-slate-500 italic">
              Source: {row.original.source_system}
            </span>
          </div>
        ),
      },
      {
        header: "Ship Status",
        accessorKey: "ship_confirm_status",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
             <StatusBadge
                status={row.original.ship_confirm_status}
                colorMap={STATUS_MAP_INTEGRATION_OUTBOUND || {}}
                variant="solid"
                size="sm"
            />
            <span className="text-[9px] text-slate-400 font-mono">ID: {row.original.ship_confirm_request_id || "N/A"}</span>
          </div>
        ),
      },
      {
        header: "Expedition Info",
        accessorKey: "outbound_do.expedition",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-700 font-bold truncate max-w-[150px]">
              {row.original.outbound_do?.expedition || "-"}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <FaTruck size={10} />
              <span>{row.original.outbound_do?.license_plate}</span>
            </div>
          </div>
        ),
      },
      {
        header: "Integration Date",
        accessorKey: "createdAt",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-700 font-semibold">
              {formatDateIndo(row.original.createdAt)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ISO ID: {row.original.iso_header_id}
            </span>
          </div>
        ),
      },
    ],
    []
  );

  const renderRowDetails = (row: any) => {
    const data = row.original;
    return (
      <div className="p-6 bg-[#f8fafc] border-x-4 border-l-blue-500">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Card 1: Logistics & Vehicle */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-slate-50 group-hover:text-blue-50 transition-colors">
              <FaTruck size={35} />
            </div>
            <h4 className="flex items-center gap-2 text-blue-700 font-bold text-[10px] mb-3 uppercase tracking-widest border-b pb-2">
              <FaTruck /> Logistics Info
            </h4>
            <div className="space-y-2">
              <InfoItem label="Expedition" value={data.outbound_do?.expedition} color="text-slate-900 font-bold" />
              <InfoItem label="Driver Name" value={`${data.outbound_do?.driver_name} (${data.outbound_do?.driver_phone})`} />
              <div className="grid grid-cols-2 gap-2">
                <InfoItem label="License Plate" value={data.outbound_do?.license_plate} mono />
                <InfoItem label="Truck Type" value={data.outbound_do?.truck_utilitas} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InfoItem label="Container #" value={data.outbound_do?.container_number} mono />
                <InfoItem label="Seal #" value={data.outbound_do?.seal_number} mono />
              </div>
            </div>
          </div>

          {/* Card 2: Memo & Destination */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-slate-50 group-hover:text-orange-50 transition-colors">
              <FaRoute size={35} />
            </div>
            <h4 className="flex items-center gap-2 text-orange-600 font-bold text-[10px] mb-3 uppercase tracking-widest border-b pb-2">
              <FaFileAlt /> Memo & Route
            </h4>
            <div className="space-y-2">
              <InfoItem label="Memo Number" value={data.outbound_memo?.outbound_memo_number} color="text-orange-700 font-bold" mono />
              <InfoItem label="Origin" value={data.outbound_memo?.origin} />
              <InfoItem label="Destination" value={data.outbound_memo?.destination} color="text-emerald-700 font-bold" />
              <InfoItem label="Ship To Address" value={data.outbound_memo?.ship_to} />
            </div>
          </div>

          {/* Card 3: ERP Integration Details (EBS/ISO) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-slate-50 group-hover:text-purple-50 transition-colors">
              <FaDatabase size={35} />
            </div>
            <h4 className="flex items-center gap-2 text-purple-700 font-bold text-[10px] mb-3 uppercase tracking-widest border-b pb-2">
              <FaBarcode /> ERP Mapping (ISO)
            </h4>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <InfoItem label="ISO Header ID" value={data.iso_header_id} mono />
                <InfoItem label="ISO Line ID" value={data.iso_line_id} mono />
              </div>
              <InfoItem label="Inv Item ID" value={data.iso_inventory_item_id} mono />
              <InfoItem label="Batch Info" value={data.batch_name || "No Batch"} />
              <div className="pt-2 mt-2 border-t border-slate-100">
                 <span className="text-[9px] text-slate-400 uppercase block mb-1">Process Status</span>
                 <div className="flex flex-wrap gap-1">
                    <MiniStatus label="Create" status={data.create_delivery_status} />
                    <MiniStatus label="Update" status={data.update_delivery_status} />
                    <MiniStatus label="Pick" status={data.pick_release_status} />
                    <MiniStatus label="Ship" status={data.ship_confirm_status} />
                 </div>
              </div>
            </div>
          </div>

          {/* Card 4: Technical & Attribute Details */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-slate-50 group-hover:text-slate-100 transition-colors">
              <FaFingerprint size={35} />
            </div>
            <h4 className="flex items-center gap-2 text-slate-700 font-bold text-[10px] mb-3 uppercase tracking-widest border-b pb-2">
              <FaInfoCircle /> Attributes
            </h4>
            <div className="space-y-2">
              <InfoItem label="Category" value={data.delivery_attribute_category} />
              <InfoItem label="Vendor PO" value={data.outbound_do?.vendor_po_number} />
              <InfoItem label="Delivery Date" value={formatDateIndo(data.outbound_do?.delivery_date)} />
              <InfoItem label="System ID" value={data.id} mono />
            </div>
          </div>

          {/* Full Width Section: Detailed Item Details */}
          <div className="md:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
              <h4 className="flex items-center gap-2 text-white font-bold text-[10px] uppercase tracking-widest">
                <FaClipboardList /> Line Item Detail
              </h4>
              <span className="bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                UOM: {data.outbound_memo_item?.uom}
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 uppercase">Item Identifier</span>
                  <span className="text-sm font-bold text-blue-800 font-mono">{data.outbound_memo_item?.item_id}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 uppercase">Quantity Information</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-800">{data.outbound_memo_item?.quantity_plan}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase">{data.outbound_memo_item?.uom} Plan</span>
                  </div>
               </div>
               <div className="flex flex-col gap-1 text-right">
                  <span className="text-[10px] text-slate-400 uppercase">Line Status</span>
                  <span className={`text-sm font-black uppercase ${data.outbound_memo_item?.status === 'PROCESS' ? 'text-orange-500' : 'text-green-500'}`}>
                    {data.outbound_memo_item?.status}
                  </span>
               </div>
            </div>
          </div>
        </div>

        {/* Error Banners */}
        {(data.ship_confirm_message || data.pick_release_message || data.create_delivery_message) && (
          <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
            <h5 className="text-[10px] font-bold text-red-600 uppercase mb-1">System Error Messages</h5>
            <div className="space-y-1 text-xs text-red-800">
              {data.create_delivery_message && <div><strong className="font-mono text-[10px]">CREATE:</strong> {data.create_delivery_message}</div>}
              {data.pick_release_message && <div><strong className="font-mono text-[10px]">PICK:</strong> {data.pick_release_message}</div>}
              {data.ship_confirm_message && <div><strong className="font-mono text-[10px]">SHIP:</strong> {data.ship_confirm_message}</div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-[#f1f5f9] p-4 min-h-screen">
      {isLoading && <ActIndicator />}

      {filteredIO && (
        <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
          <span className="text-xs text-blue-700 font-semibold uppercase">
            📍 Showing results for Org ID: {filteredIO}
          </span>
          <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-bold">
            {filteredData.length} Matches
          </span>
        </div>
      )}

      <ExpandableTableComponent
        data={filteredData}
        columns={columns}
        renderRowDetails={renderRowDetails}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalPages={pagination?.totalPages || 0}
        onPageChange={(page: number, size: number) => {
          setPageIndex(page);
          setPageSize(size);
        }}
      />
    </div>
  );
};

// --- Helper Components ---

const InfoItem = ({ label, value, mono = false, color = "text-slate-600" }: any) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{label}</span>
    <span className={`text-[11px] truncate leading-tight ${mono ? "font-mono" : ""} ${color}`} title={value}>
      {value || "-"}
    </span>
  </div>
);

const MiniStatus = ({ label, status }: { label: string; status: string }) => (
  <div className="flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
    <span className="text-[8px] font-bold text-slate-500 uppercase">{label}:</span>
    <span className={`text-[9px] font-extrabold ${status === "S" ? "text-green-600" : status === "E" ? "text-red-600" : "text-orange-400"}`}>
      {status || "U"}
    </span>
  </div>
);

export default OutboundShipConfirmTable;