import React, { useEffect, useMemo, useState } from "react";
import {
  FaChevronDown,
  FaChevronRight,
  FaDatabase,
  FaBoxOpen,
  FaInfoCircle,
  FaCalendarAlt,
} from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_INTEGRATION_INBOUND } from "../../../../constants/statusMaps";
import { useStoreInboundIntegration } from "../../../../DynamicAPI/stores/Store/MasterStore";
import ActIndicator from "../../../../components/ui/activityIndicator";
import ExpandableTableComponent from "../component/Table";
import { formatDateTimeIndo } from "../../../../helper/FormatDateTime";

const AdjustTable = ({ globalFilter, setGlobalFilter, filteredIO }: any) => {
  const { fetchAll, list, pagination, isLoading } =
    useStoreInboundIntegration();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredData = useMemo(() => {
    if (!list) return [];

    let result = [...list];

    // 1. Filter berdasarkan Organization ID (filteredIO)
    if (filteredIO) {
      result = result.filter(
        (item: any) => item.organization_id === filteredIO,
      );
    }

    // 2. Filter berdasarkan Global Search (Opsional jika ingin client-side search juga)
    if (globalFilter) {
      const lowerFilter = globalFilter.toLowerCase();
      result = result.filter(
        (item: any) =>
          item.receipt_number?.toLowerCase().includes(lowerFilter) ||
          item.rsh_attribute1?.toLowerCase().includes(lowerFilter) ||
          item.transaction_type?.toLowerCase().includes(lowerFilter),
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
        header: "Receipt Info",
        accessorKey: "receipt_number",
        cell: ({ row }) => (
          <>
            <div className="flex flex-col">
              Receipt Number
              <span className="font-bold text-green-700 font-mono tracking-tight text-sm">
                {row.original.receipt_number || (
                  <span className="font-bold text-red-500 font-mono tracking-tight text-sm">
                    no receipt number
                  </span>
                )}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[13px] leading-tight text-orange-400 font-medium">
                {row.original.transaction_type}
              </span>
            </div>
          </>
        ),
      },
      {
        header: "Vehicle Info",
        accessorKey: "rsh_attribute1",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold uppercase text-slate-800 text-[13px]">
              {row.original.rsh_attribute1 || "-"}
            </span>
            <span className="text-[10px] text-slate-500">
              {row.original.rsh_attribute2 || "No Driver"}
            </span>
          </div>
        ),
      },
      {
        header: "Total Lines",
        accessorKey: "total_lines",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[11px] font-extrabold uppercase">
              {row.original.total_lines} Items
            </span>
          </div>
        ),
      },
      {
        header: "Sync Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            colorMap={STATUS_MAP_INTEGRATION_INBOUND}
            variant="solid"
            size="sm"
          />
        ),
      },
      {
        header: "Inbound Integration Date",
        accessorKey: "creation_date",
        cell: ({ row }) => (
          <div className="text-[11px] text-slate-600 font-semibold">
            {formatDateTimeIndo(row.original.creation_date)}
          </div>
        ),
      },
    ],
    [],
  );

  const renderRowDetails = (row: any) => {
    const data = row.original;

    const hasSelisihValue = (status: unknown) =>
      status != null && String(status).trim() !== "";

    // Cek apakah ada setidaknya satu line yang memiliki status selisih terisi
    const hasSelisih = data.lines?.some((line: any) =>
      hasSelisihValue(line.status_selisih),
    );

    return (
      <div className="p-6 bg-[#f8fafc] border-x-4 border-l-blue-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1, 2, 3 tetap sama... */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <h4 className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-4 uppercase tracking-widest border-b pb-2">
              <FaDatabase /> System Identifiers
            </h4>
            <div className="space-y-3">
              <InfoItem
                label="Id Data"
                value={data.id}
                mono
                color="text-green-800"
              />
              <InfoItem label="Request ID" value={data.request_id} />
              <InfoItem label="Iface Header ID" value={data.iface_header_id} />
              <InfoItem label="Inbound ID" value={data.inbound_id} mono />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <h4 className="flex items-center gap-2 text-orange-600 font-bold text-xs mb-4 uppercase tracking-widest border-b pb-2">
              <FaInfoCircle /> Integration Detail
            </h4>
            <div className="space-y-3">
              <InfoItem
                label="Source System"
                value={`${data.source_system} (${data.receipt_source_code})`}
                color="text-orange-700 font-bold"
              />
              <InfoItem
                label="Vendor"
                value={`ID: ${data.vendor_id} (Site: ${data.vendor_site_id})`}
              />
              <InfoItem label="Driver Name" value={`${data.rsh_attribute2}`} />
              <InfoItem label="Org ID" value={data.organization_id} mono />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <h4 className="flex items-center gap-2 text-emerald-600 font-bold text-xs mb-4 uppercase tracking-widest border-b pb-2">
              <FaCalendarAlt /> History Timeline
            </h4>
            <div className="space-y-3">
              <InfoItem
                label="Created At"
                value={formatDateTimeIndo(data.createdAt)}
                color="text-emerald-700 font-medium"
              />
              <InfoItem
                label="Last Updated"
                value={formatDateTimeIndo(data.updatedAt)}
              />
              <InfoItem
                label="Last Sync By"
                value={`User ID: ${data.last_updated_by}`}
              />
              <InfoItem
                label="Process Date"
                value={formatDateTimeIndo(data.last_updated_date)}
              />
            </div>
          </div>

          {/* Full Width Section: Inbound Lines */}
          <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
              <h4 className="flex items-center gap-2 text-white font-bold text-[11px] uppercase tracking-widest">
                <FaBoxOpen /> Line Details
              </h4>
              <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {data.lines?.length} Items
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50 text-slate-500 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-tighter">
                      PO & Line
                    </th>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-tighter">
                      Inventory Item
                    </th>
                    <th className="px-4 py-2 text-center font-bold uppercase tracking-tighter">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-tighter">
                      Subinventory / Locator
                    </th>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-tighter">
                      Sync Log
                    </th>

                    {hasSelisih && (
                      <th className="px-4 py-2 text-left font-bold uppercase tracking-tighter">
                        Status Selisih
                      </th>
                    )}

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {data.lines?.map((line: any) => (
                    <React.Fragment key={line.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-blue-700">
                            {line.po_number}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            ID: {line.iface_line_id}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {line.inventory_item_id}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-slate-800 text-xs">
                            {line.quantity}
                          </span>
                          <span className="ml-1 text-slate-400 font-medium uppercase">
                            {line.uom_code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-700">
                            {line.subinventory}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Loc: {line.locator_id}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[320px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-2 h-2 rounded-full ${line.status === "S" ? "bg-green-500" : "bg-red-500"}`}
                              ></div>
                              <span
                                className={`text-[10px] font-bold uppercase ${
                                  line.status === "S"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {line.status === "S" ? "Success" : "Failed"}
                              </span>
                            </div>
                            {line.status !== "S" && line.message && (
                              <p
                                className="text-[11px] text-red-600 leading-snug"
                                title={line.message}
                              >
                                {line.message}
                              </p>
                            )}
                          </div>
                        </td>

                        {hasSelisih && (
                          <td className="px-4 py-3">
                            {hasSelisihValue(line.status_selisih) && (
                              <span
                                className={`px-2 py-0.5 rounded text-[12px] font-bold ${
                                  line.status_selisih === "E"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-amber-100 text-amber-600"
                                }`}
                              >
                                {line.status_selisih}
                              </span>
                            )}
                          </td>
                        )}

                      </tr>

                      {/* Detail Selisih row muncul untuk line yang status_selisih terisi */}
                      {hasSelisihValue(line.status_selisih) && (
                        <tr className="bg-amber-50/50">
                          <td
                            colSpan={hasSelisih ? 6 : 5}
                            className="px-4 py-2"
                          >
                            <div className="flex items-center gap-4 text-[10px]">
                              <span className="font-bold text-amber-700 uppercase tracking-wider">
                                ⚠️ Detail Selisih:
                              </span>
                              <div className="flex gap-4">
                                <span>
                                  Qty{" "}
                                  <span className="font-mono font-bold text-amber-800">
                                    {line.quantity_selisih || 0}
                                  </span>
                                </span>
                                <span>
                                  SUB-INV{" "}
                                  <span className="font-mono font-bold text-amber-800">
                                    {line.subinventory_selisih || "-"}
                                  </span>
                                </span>
                                <span>
                                  LOCATOR_ID{" "}
                                  <span className="font-mono font-bold text-amber-800">
                                    {line.locator_id_selisih || "N/A"}
                                  </span>
                                </span>
                              </div>
                              {line.message_selisih && (
                                <span className="text-red-500 italic ml-auto text-[15px]">
                                  Message Selisih: {line.message_selisih}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {(data.status === "E" || data.message) && (
          <div
            className={`mt-5 p-3 border-l-4 rounded flex items-start gap-3 ${
              data.status === "E" || data.message
                ? "bg-red-50 border-red-500"
                : "bg-slate-50 border-slate-400"
            }`}
          >
            <div
              className={`px-2 py-1 rounded text-white text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                data.status === "E" || data.message
                  ? "bg-red-500"
                  : "bg-slate-500"
              }`}
            >
              Header Error
            </div>
            <div className="min-w-0">
              <p className="text-[13px] text-red-700 font-medium leading-snug">
                {data.message || "Integration failed. Check line errors below."}
              </p>
              {data.status === "E" && (
                <p className="text-[11px] text-red-500 mt-1 font-semibold uppercase tracking-wide">
                  Sync Status: Error
                </p>
              )}
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
            📍 Showing results for Organization ID: {filteredIO}
          </span>
          <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-bold">
            {filteredData.length} Matches Found
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
        onPageChange={(page, size) => {
          setPageIndex(page);
          setPageSize(size);
        }}
      />
    </div>
  );
};

// Helper Mini Component agar kode bersih
const InfoItem = ({
  label,
  value,
  mono = false,
  color = "text-black-600",
}: any) => (
  <div className="flex flex-col gap-0.5 border-b border-slate-50 pb-1 last:border-0">
    <span className="text-[12px] text-slate-400 tracking-tighter">{label}</span>
    <span
      className={`text-[12px] truncate ${mono ? "font-mono" : ""} ${color}`}
      title={value}
    >
      {value || "-"}
    </span>
  </div>
);

export default AdjustTable;
