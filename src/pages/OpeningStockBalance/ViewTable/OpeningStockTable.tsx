import React from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaLayerGroup,
  FaSpinner,
} from "react-icons/fa";
import { PaginationMeta } from "../../../DynamicAPI/services/Service/OpeningStockBalanceService";
import {
  DynamicColumn,
  OPENING_STOCK_DETAIL_COLUMNS,
  OPENING_STOCK_MASTER_COLUMNS,
  OpeningStockDetailRow,
  OpeningStockListRow,
  getAlignClass,
  getRowDetailItems,
  getVisibleColumns,
  resolveCellValue,
} from "./openingStockTableConfig";

type OpeningStockTableProps = {
  data: OpeningStockListRow[];
  isLoading?: boolean;
  expandedRows: Record<string, boolean>;
  onToggleRow: (id: string) => void;
  meta?: PaginationMeta | null;
  onPageChange: (page: number) => void;
  masterColumns?: DynamicColumn<OpeningStockListRow>[];
  detailColumns?: DynamicColumn<OpeningStockDetailRow>[];
};

export default function OpeningStockTable({
  data,
  isLoading = false,
  expandedRows,
  onToggleRow,
  meta,
  onPageChange,
  masterColumns = OPENING_STOCK_MASTER_COLUMNS,
  detailColumns = OPENING_STOCK_DETAIL_COLUMNS,
}: OpeningStockTableProps) {
  const visibleMaster = getVisibleColumns(masterColumns);
  const visibleDetail = getVisibleColumns(detailColumns);
  const colSpan = visibleMaster.length + 1;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-10" />
              {visibleMaster.map((col) => (
                <th
                  key={col.id}
                  className={`py-3.5 px-4 ${getAlignClass(col.align)} ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {isLoading ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="py-12 text-center text-slate-400 font-medium"
                >
                  <div className="flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin text-blue-600 w-5 h-5" />
                    Loading data ledger...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="py-12 text-center text-slate-400 font-medium"
                >
                  Belum ada data opening stock ditemukan.
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isExpanded = Boolean(expandedRows[row.id]);
                const detailItems = getRowDetailItems(row);

                return (
                  <React.Fragment key={row.id}>
                    <tr
                      onClick={() => onToggleRow(row.id)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${isExpanded ? "bg-blue-50/20" : ""}`}
                    >
                      <td className="py-4 px-4 text-center">
                        {isExpanded ? (
                          <FaChevronUp className="w-3 h-3 text-slate-400" />
                        ) : (
                          <FaChevronDown className="w-3 h-3 text-slate-400" />
                        )}
                      </td>
                      {visibleMaster.map((col) => (
                        <td
                          key={col.id}
                          className={`py-4 px-4 ${getAlignClass(col.align)} ${col.cellClassName || ""}`}
                          title={
                            col.id === "file_name"
                              ? String(row.file_name || "")
                              : undefined
                          }
                        >
                          {resolveCellValue(col, row)}
                        </td>
                      ))}
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/40">
                        <td
                          colSpan={colSpan}
                          className="p-4 border-t border-b border-slate-100"
                        >
                          <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-inner">
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                              <FaLayerGroup className="text-blue-500" />
                              <span>
                                Material Item Lines ({detailItems.length})
                              </span>
                            </div>

                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                                  {visibleDetail.map((col) => (
                                    <th
                                      key={col.id}
                                      className={`py-2.5 px-3 ${getAlignClass(col.align)} ${col.headerClassName || ""}`}
                                    >
                                      {col.header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-600">
                                {detailItems.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={visibleDetail.length}
                                      className="py-6 text-center text-slate-400"
                                    >
                                      Tidak ada detail item.
                                    </td>
                                  </tr>
                                ) : (
                                  detailItems.map((item, index) => (
                                    <tr
                                      key={item.id}
                                      className="hover:bg-slate-50/50"
                                    >
                                      {visibleDetail.map((col) => (
                                        <td
                                          key={col.id}
                                          className={`py-2 px-3 ${getAlignClass(col.align)} ${col.cellClassName || ""}`}
                                          title={
                                            col.id === "description"
                                              ? String(item.item?.description || "")
                                              : col.id === "notes"
                                                ? String(item.notes || "")
                                                : undefined
                                          }
                                        >
                                          {resolveCellValue(col, item, index)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {meta && (
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3.5 flex items-center justify-between">
          <div className="text-xs font-medium text-slate-500">
            Showing page{" "}
            <span className="font-bold text-slate-700">{meta.page}</span> of{" "}
            <span className="font-bold text-slate-700">{meta.totalPages}</span>{" "}
            ({meta.total} entries)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={!meta.hasPreviousPage || isLoading}
              onClick={() => onPageChange(Math.max(meta.page - 1, 1))}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
            >
              Previous
            </button>
            <button
              disabled={!meta.hasNextPage || isLoading}
              onClick={() => onPageChange(meta.page + 1)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
