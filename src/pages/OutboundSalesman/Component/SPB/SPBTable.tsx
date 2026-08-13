import React from "react";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { Callplan } from "../../types/CallplanTypes";
import {
  getAlignClass,
  getVisibleColumns,
  resolveCellValue,
  SPB_DETAIL_COLUMNS,
  SPB_DETAIL_SUMMARY_CARDS,
  SPB_MASTER_COLUMNS,
  DynamicColumn,
  SummaryCardConfig,
} from "./spbTableConfig";

type SPBTableProps = {
  data: Callplan[];
  isLoading?: boolean;
  statusFilter: string;
  expandedRows: Record<string, boolean>;
  onToggleRow: (id: string) => void;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Override kolom master jika perlu (opsional) */
  masterColumns?: DynamicColumn<Callplan>[];
  detailColumns?: DynamicColumn<any>[];
  summaryCards?: SummaryCardConfig[];
};

export default function SPBTable({
  data,
  isLoading = false,
  statusFilter,
  expandedRows,
  onToggleRow,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  masterColumns = SPB_MASTER_COLUMNS,
  detailColumns = SPB_DETAIL_COLUMNS,
  summaryCards = SPB_DETAIL_SUMMARY_CARDS,
}: SPBTableProps) {
  const visibleMaster = getVisibleColumns(masterColumns);
  const visibleDetail = getVisibleColumns(detailColumns);
  const colSpan = visibleMaster.length + 1; // + expander

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const getDetailTotal = (row: Callplan) => {
    const qtyCol = visibleDetail.find((c) => c.id === "item_qty_suggestion");
    if (!qtyCol) return null;
    return (row.details || []).reduce((acc, curr) => {
      const value = resolveCellValue(qtyCol, curr);
      return acc + (Number(value) || 0);
    }, 0);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-orange-500 text-xs uppercase text-white">
            <tr>
              <th className="w-10 px-4 py-3" />
              {visibleMaster.map((col) => (
                <th
                  key={col.id}
                  className={`px-4 py-3 font-semibold tracking-wide ${getAlignClass(col.align)} ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {isLoading ? (
            <tbody>
              <tr>
                <td colSpan={colSpan} className="py-8 text-center text-gray-500">
                  Memuat data Callplan...
                </td>
              </tr>
            </tbody>
          ) : data.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={colSpan} className="py-8 text-center text-gray-500">
                  Tidak ada data Callplan untuk status {statusFilter}.
                </td>
              </tr>
            </tbody>
          ) : (
            data.map((row) => {
              const isExpanded = Boolean(expandedRows[row.id]);
              return (
                <tbody
                  key={row.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <tr
                    className={`cursor-pointer hover:bg-gray-50 ${
                      isExpanded ? "bg-gray-50" : ""
                    }`}
                    onClick={() => onToggleRow(row.id)}
                  >
                    <td className="px-4 py-4 text-orange-500">
                      {isExpanded ? (
                        <FaChevronDown size={14} />
                      ) : (
                        <FaChevronRight size={14} />
                      )}
                    </td>
                    {visibleMaster.map((col) => (
                      <td
                        key={col.id}
                        className={`px-4 py-4 ${getAlignClass(col.align)} ${col.cellClassName || ""}`}
                      >
                        {resolveCellValue(col, row)}
                      </td>
                    ))}
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td
                        colSpan={colSpan}
                        className="border-t border-gray-100 bg-white px-8 py-6"
                      >
                        <div className="mb-6 flex gap-4">
                          {summaryCards.map((card) => {
                            const isBlue = card.tone === "blue";
                            return (
                              <div
                                key={card.id}
                                className={`flex-1 rounded-lg border p-4 shadow-sm ${
                                  isBlue
                                    ? "border-blue-100 bg-blue-50"
                                    : "border-gray-200 bg-white"
                                }`}
                              >
                                <div
                                  className={`mb-2 text-xs font-semibold uppercase ${
                                    isBlue ? "text-blue-500" : "text-blue-400"
                                  }`}
                                >
                                  {card.label}
                                </div>
                                <div
                                  className={`text-2xl font-bold ${
                                    isBlue ? "text-blue-600" : "text-gray-800"
                                  }`}
                                >
                                  {card.getValue(row)}{" "}
                                  {card.unit && (
                                    <span
                                      className={`text-sm font-normal ${
                                        isBlue
                                          ? "text-blue-500"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      {card.unit}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {row.details && row.details.length > 0 ? (
                          <div className="overflow-hidden rounded-lg border border-gray-200">
                            <div className="max-h-[488px] overflow-y-auto">
                              <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                                  <tr>
                                    {visibleDetail.map((col) => (
                                      <th
                                        key={col.id}
                                        className={`px-6 py-3 ${getAlignClass(col.align)} ${col.headerClassName || ""}`}
                                      >
                                        {col.header}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {row.details.map((detail, index) => (
                                    <tr
                                      key={detail.id}
                                      className="hover:bg-gray-50"
                                    >
                                      {visibleDetail.map((col) => (
                                        <td
                                          key={col.id}
                                          className={`px-6 py-3 ${getAlignClass(col.align)} ${col.cellClassName || ""}`}
                                        >
                                          {resolveCellValue(
                                            col,
                                            detail,
                                            index,
                                          )}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                                {visibleDetail.some(
                                  (c) => c.id === "item_qty_suggestion",
                                ) && (
                                  <tfoot className="sticky bottom-0 z-10 border-t border-gray-200 bg-gray-50">
                                    <tr>
                                      <td
                                        colSpan={Math.max(
                                          1,
                                          visibleDetail.length - 1,
                                        )}
                                        className="px-6 py-3 text-right text-xs font-bold uppercase text-gray-600"
                                      >
                                        Total
                                      </td>
                                      <td className="px-6 py-3 text-right font-bold text-blue-600">
                                        {(getDetailTotal(row) || 0).toLocaleString(
                                          "id-ID",
                                        )}
                                      </td>
                                    </tr>
                                  </tfoot>
                                )}
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-gray-200 p-4 text-center text-gray-500">
                            Tidak ada detail SKU untuk Callplan ini.
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })
          )}
        </table>
      </div>

      {!isLoading && totalItems > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
            {totalItems} items
          </div>

          <div className="flex items-center gap-4">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none"
            >
              <option value={10}>Show 10</option>
              <option value={20}>Show 20</option>
              <option value={50}>Show 50</option>
            </select>

            <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                disabled={safeCurrentPage === 1}
                className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaChevronLeft size={12} />
              </button>
              <span>
                Page {safeCurrentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  onPageChange(Math.min(totalPages, safeCurrentPage + 1))
                }
                disabled={safeCurrentPage === totalPages}
                className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
