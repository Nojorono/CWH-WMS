import React, { useEffect, useMemo, useRef, useState } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import {
  FaCalendarAlt,
  FaEnvelope,
  FaFileExcel,
  FaPaperPlane,
  FaSyncAlt,
} from "react-icons/fa";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { Callplan } from "../../types/CallplanTypes";
import { callplanService } from "../../Services/CallplanService";
import SPBTable from "../SPB/SPBTable";
import { SortDirection, sortCallplans } from "../SPB/spbTableConfig";
import {
  REKAP_DETAIL_COLUMNS,
  REKAP_DETAIL_SUMMARY_CARDS,
  REKAP_MASTER_COLUMNS,
} from "./rekapSpbTableConfig";
import { exportRekapSpbFinalExcel } from "./exportRekapSpbFinalExcel";

dayjs.locale("id");

const TODAY = () => dayjs().format("YYYY-MM-DD");

function RekapSPBFinal() {
  const user = usePersistAuthStore((s) => s.user);
  const { list: itemList, fetchAll: fetchItems } = useStoreItem();

  const organizationId =
    user?.userDetail?.organizationId ||
    user?.userDetail?.organization?.id ||
    "";
  const amoName =
    user?.userDetail?.organization?.organization_name ||
    user?.userDetail?.organization?.org_name ||
    user?.userDetail?.organization?.organization_code ||
    "—";

  const [callplans, setCallplans] = useState<Callplan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draftDate, setDraftDate] = useState(TODAY);
  const [reportDate, setReportDate] = useState(TODAY);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("spb_number");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const dateInputRef = useRef<HTMLInputElement>(null);
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const fetchFinalSpb = async () => {
    if (!organizationId || !reportDate) {
      setCallplans([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await callplanService.getCallplans({
        dateStart: reportDate,
        organizationId: String(organizationId),
        status: "FINAL",
      });
      setCallplans(data);
      setExpandedRows(data[0] ? { [data[0].id]: true } : {});
    } catch (err) {
      console.error("Gagal load Rekap SPB Final:", err);
      setCallplans([]);
      setExpandedRows({});
      showErrorToast("Gagal mengambil data SPB FINAL");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchFinalSpb();
  }, [organizationId, reportDate]);

  useEffect(() => {
    if (!dateInputRef.current) return;
    const fp = flatpickr(dateInputRef.current, {
      enableTime: false,
      dateFormat: "Y-m-d",
      defaultDate: draftDate,
      allowInput: false,
      onChange: (selectedDates) => {
        if (!selectedDates?.[0]) return;
        const picked = dayjs(selectedDates[0]);
        if (picked.isValid()) setDraftDate(picked.format("YYYY-MM-DD"));
      },
    });
    flatpickrRef.current = fp;
    return () => {
      fp.destroy();
      flatpickrRef.current = null;
    };
  }, []);

  const handleApplyDate = () => {
    if (!draftDate) return;
    setReportDate(draftDate);
    setCurrentPage(1);
  };

  const handleResetToday = () => {
    const today = TODAY();
    setDraftDate(today);
    setReportDate(today);
    flatpickrRef.current?.setDate(today, false);
    setCurrentPage(1);
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /** Urutkan detail SKU per SPB sesuai abjad (nama master → fallback SKU) */
  const callplansWithSortedItems = useMemo(() => {
    const nameBySku = new Map<string, string>();
    (Array.isArray(itemList) ? itemList : []).forEach(
      (m: { sku?: string; description?: string }) => {
        const sku = String(m.sku || "").trim().toUpperCase();
        const name = String(m.description || "").trim();
        if (sku && name) nameBySku.set(sku, name);
      },
    );

    const sortKeyOf = (itemCode: string) => {
      const sku = String(itemCode || "").trim();
      return (nameBySku.get(sku.toUpperCase()) || sku).toLocaleLowerCase("id");
    };

    return callplans.map((doc) => ({
      ...doc,
      details: [...(doc.details || [])].sort((a, b) =>
        sortKeyOf(a.item_code).localeCompare(sortKeyOf(b.item_code), "id", {
          numeric: true,
          sensitivity: "base",
        }),
      ),
    }));
  }, [callplans, itemList]);

  const sortedCallplans = useMemo(
    () => sortCallplans(callplansWithSortedItems, sortKey, sortDirection),
    [callplansWithSortedItems, sortKey, sortDirection],
  );

  const totalItems = sortedCallplans.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCallplans = sortedCallplans.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, totalItems, sortKey, sortDirection]);

  const reportDateLabel = dayjs(reportDate).isValid()
    ? dayjs(reportDate).format("DD MMMM YYYY")
    : reportDate;

  const handleExportExcel = () => {
    exportRekapSpbFinalExcel({
      callplans: sortedCallplans,
      amoName,
      reportDate,
      itemList: Array.isArray(itemList) ? itemList : [],
    });
  };

  const handleEmailFas = () => {
    showSuccessToast("Email to FAS — coming soon.");
  };


  return (
    <div className="min-h-screen p-6 font-sans text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Rekap SPB Final{" "}
              <span className="font-semibold text-slate-500">(Bungkus / Bks)</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {amoName} · {reportDateLabel}
            </p>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3.5 py-2 shadow-sm">
            <FaCalendarAlt className="text-indigo-500" size={14} />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                Tanggal Callplan
              </div>
              <div className="text-xs font-bold text-indigo-700">{reportDate}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-800">
                  Filter Tanggal
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Menampilkan SPB status <strong>FINAL</strong> untuk tanggal:{" "}
                <strong className="text-slate-700">{reportDate}</strong>
                {draftDate !== reportDate && (
                  <span className="ml-1 text-amber-600">
                    (Draft belum diterapkan: {draftDate})
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                ref={dateInputRef}
                type="text"
                readOnly
                defaultValue={draftDate}
                className="w-44 cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Pilih tanggal"
              />
              <button
                type="button"
                onClick={handleApplyDate}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
              >
                Terapkan
              </button>
              <button
                type="button"
                onClick={handleResetToday}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
              >
                Reset Hari Ini
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                FINAL · {totalItems} SPB
              </span>
              <button
                type="button"
                onClick={() => void fetchFinalSpb()}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                <FaSyncAlt
                  size={12}
                  className={isLoading ? "animate-spin text-indigo-600" : "text-slate-400"}
                />
                Refresh
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleEmailFas}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <FaEnvelope size={12} className="text-amber-500" />
                Email to FAS
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isLoading || sortedCallplans.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaFileExcel size={14} />
                Export ke Excel
              </button>
            </div>
          </div>

          <div className="p-2">
            <SPBTable
              data={paginatedCallplans}
              isLoading={isLoading}
              statusFilter="FINAL"
              expandedRows={expandedRows}
              onToggleRow={toggleRow}
              currentPage={safeCurrentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSortChange={(nextKey, nextDirection) => {
                setSortKey(nextKey);
                setSortDirection(nextDirection);
              }}
              masterColumns={REKAP_MASTER_COLUMNS}
              detailColumns={REKAP_DETAIL_COLUMNS}
              summaryCards={REKAP_DETAIL_SUMMARY_CARDS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RekapSPBFinal;
