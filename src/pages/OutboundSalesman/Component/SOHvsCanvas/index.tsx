import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { FaSearch, FaSyncAlt } from "react-icons/fa";
import DeferredMount from "../../../../components/common/DeferredMount";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { useCanvasVsGitData } from "./useCanvasVsGitData";
import type { SohVsCanvasRow } from "./mergeSohVsCanvas";

const formatQty = (value: number | null | undefined) => {
  if (value == null) return "—";
  return value.toLocaleString("id-ID");
};

function CanvasVsGitPage() {
  const user = usePersistAuthStore((s) => s.user);

  /** Session: organization_name="SMG" (bukan organization_code="SEMARANG") */
  const organizationCode = String(
    user?.userDetail?.organization?.organization_name || "",
  )
    .trim()
    .toUpperCase();

  const amoName = String(
    user?.userDetail?.organization?.organization_code ||
      user?.userDetail?.organization?.org_name ||
      organizationCode ||
      "Cabang",
  ).trim();

  const {
    rows,
    summary,
    sohCount,
    canvasCount,
    isLoading,
    error,
    fetchedAt,
    refetch,
  } = useCanvasVsGitData({
    organizationCode,
    enabled: Boolean(organizationCode),
  });

  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.item_code.toLowerCase().includes(q) ||
        row.item_number.toLowerCase().includes(q) ||
        row.item_description.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const fetchedLabel = fetchedAt
    ? dayjs(fetchedAt).format("DD MMM YYYY HH:mm:ss")
    : "—";

  return (
    <div className="min-h-screen space-y-5 p-4 sm:p-6">
      {/* <PageBreadcrumb breadcrumbs={[{ title: "SOH KECIL vs Locator GIT" }]} /> */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            SOH KECIL vs Locator GIT
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-medium text-slate-700">
              on-hand-meta (KECIL)
            </span>{" "}
            vs{" "}
            <span className="font-medium text-slate-700">
              on-hand-locator (CANVAS / GIT)
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {amoName} · {organizationCode || "—"} · Update: {fetchedLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isLoading || !organizationCode}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaSyncAlt className={isLoading ? "animate-spin" : ""} size={13} />
          {isLoading ? "Memuat..." : "Refresh"}
        </button>
      </div>

      {!organizationCode && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          organization_name cabang tidak ditemukan di session login.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Total SKU" value={summary.totalSku} />
        <SummaryCard
          label="Σ KECIL"
          value={formatQty(summary.totalKecil)}
          tone="sky"
        />
        <SummaryCard
          label="Σ GIT Avail"
          value={formatQty(summary.totalGitAvail)}
          tone="violet"
        />
        <SummaryCard
          label="Σ Diff (KECIL−GIT)"
          value={`${summary.totalDiff > 0 ? "+" : ""}${formatQty(summary.totalDiff)}`}
          tone="amber"
        />
      </div>

      <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <FaSearch
          className="pointer-events-none absolute top-1/2 left-7 -translate-y-1/2 text-slate-400"
          size={12}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari item code / number / deskripsi..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-9 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-1 focus:ring-orange-400"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3 text-right">KECIL</th>
                <th className="px-4 py-3 text-right">GIT Qty</th>
                <th className="px-4 py-3 text-right">GIT Avail</th>
                <th className="px-4 py-3 text-right">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Memuat on-hand-meta (KECIL) & on-hand-locator (GIT)...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Tidak ada data untuk ditampilkan
                    <br />
                    <span className="mt-1 inline-block text-[11px]">
                      KECIL: {sohCount.toLocaleString("id-ID")} · GIT:{" "}
                      {canvasCount.toLocaleString("id-ID")}
                    </span>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <CompareRow key={row.key} row={row} />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-400">
          Menampilkan {filteredRows.length.toLocaleString("id-ID")} /{" "}
          {rows.length.toLocaleString("id-ID")} SKU
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  tone?: "indigo" | "sky" | "violet" | "amber";
}) {
  const tones: Record<string, string> = {
    indigo: "border-indigo-100 bg-indigo-50/60 text-indigo-900",
    sky: "border-sky-100 bg-sky-50/60 text-sky-900",
    violet: "border-violet-100 bg-violet-50/60 text-violet-900",
    amber: "border-amber-100 bg-amber-50/60 text-amber-900",
  };

  return (
    <div className={`rounded-2xl border px-3.5 py-3 shadow-sm ${tones[tone]}`}>
      <p className="text-[10px] font-semibold tracking-wide uppercase opacity-70">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function CompareRow({ row }: { row: SohVsCanvasRow }) {
  const diffClass =
    row.diff == null
      ? "text-slate-400"
      : row.diff === 0
        ? "text-emerald-600"
        : row.diff > 0
          ? "text-amber-600"
          : "text-rose-600";

  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-4 py-3">
        <p className="font-semibold text-slate-800">{row.item_code || "—"}</p>
        <p className="text-xs text-slate-500">
          {row.item_number || "—"}
          {row.item_description ? ` · ${row.item_description}` : ""}
        </p>
      </td>
      <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-800">
        {formatQty(row.kecil_qty)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
        {formatQty(row.git_qty)}
      </td>
      <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-800">
        {formatQty(row.git_avail)}
      </td>
      <td className={`px-4 py-3 text-right font-bold tabular-nums ${diffClass}`}>
        {row.diff == null
          ? "—"
          : `${row.diff > 0 ? "+" : ""}${formatQty(row.diff)}`}
      </td>
    </tr>
  );
}

function RealTimeVsCanvasGIT() {
  return (
    <DeferredMount delayMs={120}>
      <CanvasVsGitPage />
    </DeferredMount>
  );
}

export default RealTimeVsCanvasGIT;
