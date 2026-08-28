import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { showErrorToast } from "../../../../components/toast";
import { getBTBPagination } from "../services/BTBservice";
import { BTB, BTBMeta } from "../services/types";
import {
  BTB_LIST_DETAIL_COLUMNS,
  createBtbListMasterColumns,
  getAlignClass,
  getVisibleColumns,
  resolveCellValue,
} from "./listBTBTableConfig";

const BTB_LIST_STATUS = "APPLIED" as const;
const LIMIT_OPTIONS = [10, 20, 50, 100];
/** Tinggi viewport tabel: ~15 baris data, sisanya scroll */
const TABLE_VISIBLE_ROWS = 15;
const TABLE_ROW_HEIGHT_REM = 3.25;

const todayYmd = () => new Date().toISOString().slice(0, 10);

const ListBTB = () => {
  const [dateFrom, setDateFrom] = useState(todayYmd);
  const [getAllMode, setGetAllMode] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [rows, setRows] = useState<BTB[]>([]);
  const [meta, setMeta] = useState<BTBMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const dateInputRef = useRef<HTMLInputElement>(null);
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);

  const masterColumns = useMemo(
    () => createBtbListMasterColumns(BTB_LIST_STATUS),
    [],
  );
  const visibleMaster = useMemo(
    () => getVisibleColumns(masterColumns),
    [masterColumns],
  );
  const visibleDetail = useMemo(
    () => getVisibleColumns(BTB_LIST_DETAIL_COLUMNS),
    [],
  );
  const colSpan = visibleMaster.length + 1;

  useEffect(() => {
    if (!dateInputRef.current) return;

    const fp = flatpickr(dateInputRef.current, {
      enableTime: false,
      dateFormat: "Y-m-d",
      allowInput: false,
      clickOpens: true,
      disableMobile: true,
      defaultDate: dateFrom || undefined,
      onChange: (_dates, dateStr) => {
        setDateFrom(dateStr || "");
        setPage(1);
      },
    });

    flatpickrRef.current = fp;

    return () => {
      fp.destroy();
      flatpickrRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchList = useCallback(async () => {
    if (!getAllMode && !dateFrom.trim()) {
      showErrorToast("Harap pilih Date From");
      return;
    }

    setIsLoading(true);
    try {
      const result = await getBTBPagination({
        page,
        limit,
        status: BTB_LIST_STATUS,
        ...(getAllMode
          ? {}
          : {
              date_from: dateFrom.trim(),
              date_to: dateFrom.trim(),
            }),
        sortOrder: "DESC",
      });

      if (!result.success) {
        setRows([]);
        setMeta(null);
        showErrorToast(result.message);
        return;
      }

      setRows(result.data.data);
      setMeta(result.data.meta);
    } catch (error: unknown) {
      setRows([]);
      setMeta(null);
      const message =
        error instanceof Error ? error.message : "Gagal mengambil data BTB";
      showErrorToast(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, dateFrom, getAllMode]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const rowKey = (row: BTB, index: number) =>
    row.btb_number || `${row.sales_nik}-${row.btb_date}-${index}`;

  const getDetails = (row: BTB) => row.details ?? row.btb_details ?? [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
            Date {getAllMode ? "" : "*"}
          </label>
          <input
            ref={dateInputRef}
            type="text"
            readOnly
            disabled={getAllMode}
            defaultValue={dateFrom}
            placeholder="YYYY-MM-DD"
            className={`w-full text-sm px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 ${
              getAllMode
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : "cursor-pointer bg-white"
            }`}
            onFocus={() => {
              if (!getAllMode) flatpickrRef.current?.open();
            }}
          />
        </div>

        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 cursor-pointer sm:mb-0">
          <input
            type="checkbox"
            checked={getAllMode}
            onChange={(e) => {
              setGetAllMode(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          Get All
        </label>

        <div className="flex sm:justify-end">
          <button
            type="button"
            onClick={fetchList}
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#F97316] hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-lg disabled:opacity-60"
          >
            {isLoading ? "Memuat..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div
          className="overflow-x-auto overflow-y-auto"
          style={{
            maxHeight: `calc(${TABLE_ROW_HEIGHT_REM}rem * ${TABLE_VISIBLE_ROWS})`,
          }}
        >
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 border-b border-slate-200 shadow-[0_1px_0_0_rgb(226_232_240)]">
              <tr>
                <th className="px-4 py-3 font-semibold w-10" />
                {visibleMaster.map((col) => (
                  <th
                    key={col.id}
                    className={`px-4 py-3 font-semibold ${getAlignClass(col.align)} ${col.headerClassName || ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Memuat data BTB...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-4 py-10 text-center text-slate-400 italic"
                  >
                    Tidak ada data BTB APPLIED
                    {getAllMode ? "" : ` untuk tanggal ${dateFrom}`}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const key = rowKey(row, index);
                  const details = getDetails(row);
                  const expanded = Boolean(expandedRows[key]);
                  const rowNumber = (page - 1) * limit + index + 1;

                  return (
                    <React.Fragment key={key}>
                      <tr className="border-b border-slate-100 hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleRow(key)}
                            className="text-slate-400 hover:text-orange-500"
                            title={expanded ? "Tutup detail" : "Lihat detail"}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-4 w-4 transition-transform ${
                                expanded ? "rotate-90" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </td>
                        {visibleMaster.map((col) => (
                          <td
                            key={col.id}
                            className={`px-4 py-3 ${getAlignClass(col.align)} ${col.cellClassName || ""}`}
                          >
                            {resolveCellValue(
                              col,
                              row,
                              col.id === "row_no" ? rowNumber : index,
                            )}
                          </td>
                        ))}
                      </tr>

                      {expanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={colSpan} className="px-4 py-4">
                            {details.length === 0 ? (
                              <p className="text-sm text-slate-400 italic px-2">
                                Tidak ada detail item
                              </p>
                            ) : (
                              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                    <tr>
                                      {visibleDetail.map((col) => (
                                        <th
                                          key={col.id}
                                          className={`px-3 py-2 font-semibold ${getAlignClass(col.align)} ${col.headerClassName || ""}`}
                                        >
                                          {col.header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {details.map((item, itemIdx) => (
                                      <tr
                                        key={`${item.item_code}-${item.inventory_item_id}-${itemIdx}`}
                                        className="border-b border-slate-100 last:border-0"
                                      >
                                        {visibleDetail.map((col) => (
                                          <td
                                            key={col.id}
                                            className={`px-3 py-2 ${getAlignClass(col.align)} ${col.cellClassName || ""}`}
                                          >
                                            {resolveCellValue(
                                              col,
                                              item,
                                              itemIdx,
                                            )}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Halaman {meta?.page ?? page} dari {meta?.totalPages || 1} (
              {meta?.total ?? 0} data)
            </span>
            <label className="inline-flex items-center gap-2">
              <span className="text-slate-500">Rows per page</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                disabled={isLoading}
                className="text-sm px-2 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
              >
                {LIMIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!meta?.hasPreviousPage || isLoading || page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!meta?.hasNextPage || isLoading}
              onClick={() => setPage((prev) => prev + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListBTB;
