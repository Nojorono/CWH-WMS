import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useMoveOrderIntegration } from "./hook/useMoveOrderIntegration";
import {
  MoveOrderIntegrationHeader,
  MoveOrderIntegrationParams,
} from "../../../API/types/DOsuggestionIntegration";
import { pollMoveOrderIntegration } from "../../../API/services/DOsuggestionServices/integrationMetaService";
import { DataTable } from "./component/Table";
import {
  FaFilter,
  FaExclamationCircle,
  FaCheckCircle,
  FaBox,
  FaClock,
  FaSyncAlt,
} from "react-icons/fa";
import { formatDateTimeIndo } from "../../../helper/FormatDateTime";
import { useStoreItem } from "../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast, showSuccessToast } from "../../../components/toast";
import DeferredMount from "../../../components/common/DeferredMount";

const StatusBadge = ({
  status,
  message,
}: {
  status: string;
  message: string;
}) => {
  const isIntegrated = status === "INTEGRATED" || status === "SUCCESS";
  const isError = status === "ERROR" || status === "TIMEOUT";

  const colorStyles = isIntegrated
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : isError
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colorStyles}`}
      >
        {isIntegrated ? (
          <FaCheckCircle size={12} />
        ) : (
          <FaExclamationCircle size={12} />
        )}
        {status}
      </span>
      <p
        className="text-[10px] text-slate-500 max-w-[220px] truncate leading-tight"
        title={message}
      >
        {message || "Tidak ada detail tambahan"}
      </p>
    </div>
  );
};

const IntegrationMonitoringPageInner = () => {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<
    "INTEGRATED" | "ERROR" | "TIMEOUT" | ""
  >("");
  const [skuFilter, setSkuFilter] = useState("");
  const [spbFilter, setSpbFilter] = useState("");
  const [salesFilter, setSalesFilter] = useState("");
  /** Akumulasi opsi dropdown dari data yang pernah dimuat */
  const [skuOptions, setSkuOptions] = useState<string[]>([]);
  const [spbOptions, setSpbOptions] = useState<string[]>([]);
  const [salesOptions, setSalesOptions] = useState<string[]>([]);

  const { list: itemList, fetchAll: fetchAllItem } = useStoreItem();

  useEffect(() => {
    const ac = new AbortController();
    void fetchAllItem({ signal: ac.signal });
    return () => ac.abort();
  }, [fetchAllItem]);

  useEffect(() => {
    setPage(1);
  }, [skuFilter, spbFilter, salesFilter, statusFilter]);

  const integrationParams = useMemo<MoveOrderIntegrationParams>(
    () => ({
      page,
      limit,
      sortBy: "updatedAt",
      sortOrder: "DESC",
      iface_status: statusFilter || undefined,
      source_system: "WMS",
    }),
    [page, limit, statusFilter],
  );

  const {
    data: response,
    isLoading,
    refetch,
  } = useMoveOrderIntegration(integrationParams);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pollingIds, setPollingIds] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePollIntegration = useCallback(
    async (id: string) => {
      if (!id) return;

      let alreadyPolling = false;
      setPollingIds((prev) => {
        if (prev[id]) {
          alreadyPolling = true;
          return prev;
        }
        return { ...prev, [id]: true };
      });
      if (alreadyPolling) return;

      try {
        await pollMoveOrderIntegration(id);
        showSuccessToast("Polling integrasi berhasil. Data sedang diperbarui.");
        await refetch();
      } catch (error: unknown) {
        const err = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        showErrorToast(
          err?.response?.data?.message ||
            err?.message ||
            "Gagal melakukan polling integrasi.",
        );
      } finally {
        setPollingIds((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [refetch],
  );

  const handleRefresh = useCallback(() => {
    if (isRefreshing || isLoading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setIsRefreshing(true);
    debounceRef.current = setTimeout(async () => {
      try {
        await refetch();
      } finally {
        setTimeout(() => setIsRefreshing(false), 600);
      }
    }, 300);
  }, [isRefreshing, isLoading, refetch]);

  const refreshBusy = isRefreshing || isLoading;

  const itemByInventoryId = useMemo(() => {
    const map = new Map<
      string,
      { sku: string; item_number?: string | null; description: string }
    >();
    (Array.isArray(itemList) ? itemList : []).forEach((item) => {
      const key = String(item.inventory_item_id ?? "").trim();
      if (!key) return;
      map.set(key, {
        sku: item.sku,
        item_number: item.item_number,
        description: item.description,
      });
    });
    return map;
  }, [itemList]);

  /** Opsi dropdown dari list data yang sudah dimuat (akumulasi antar halaman) */
  useEffect(() => {
    const list = response?.data || [];
    if (!list.length) return;

    const collator = new Intl.Collator("id", { sensitivity: "base" });
    const mergeUnique = (prev: string[], next: string[]) => {
      const set = new Set(prev);
      next.forEach((v) => {
        if (v) set.add(v);
      });
      return [...set].sort(collator.compare);
    };

    const nextSpbs: string[] = [];
    const nextSales: string[] = [];
    const nextSkus: string[] = [];

    list.forEach((row) => {
      const spb = String(row.request_number || "").trim();
      if (spb) nextSpbs.push(spb);

      const sales = String(row.description || "").trim();
      if (sales) nextSales.push(sales);

      (row.lines || []).forEach((line) => {
        const invKey = String(line.inventory_item_id ?? "").trim();
        const master = invKey ? itemByInventoryId.get(invKey) : undefined;
        const sku = String(master?.sku || "").trim();
        const itemNumber = String(master?.item_number || "").trim();
        if (sku) nextSkus.push(sku);
        else if (itemNumber) nextSkus.push(itemNumber);
        else if (invKey) nextSkus.push(invKey);
      });
    });

    setSpbOptions((prev) => mergeUnique(prev, nextSpbs));
    setSalesOptions((prev) => mergeUnique(prev, nextSales));
    setSkuOptions((prev) => mergeUnique(prev, nextSkus));
  }, [response?.data, itemByInventoryId]);

  /** Reset opsi saat ganti status (dataset beda) */
  useEffect(() => {
    setSkuOptions([]);
    setSpbOptions([]);
    setSalesOptions([]);
    setSkuFilter("");
    setSpbFilter("");
    setSalesFilter("");
  }, [statusFilter]);

  /** Sort updatedAt DESC + filter client (SKU / SPB / Sales) */
  const sortedData = useMemo(() => {
    const list = [...(response?.data || [])];

    const toTime = (row: MoveOrderIntegrationHeader) => {
      const raw = String(
        row.updatedAt ||
          row.last_update_date ||
          row.createdAt ||
          row.creation_date ||
          "",
      ).trim();
      if (!raw) return 0;
      const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
      const t = new Date(normalized).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    list.sort((a, b) => toTime(b) - toTime(a));

    const skuQ = skuFilter.trim();
    const spbQ = spbFilter.trim();
    const salesQ = salesFilter.trim();

    if (!skuQ && !spbQ && !salesQ) return list;

    return list.filter((row) => {
      if (spbQ && String(row.request_number || "").trim() !== spbQ) {
        return false;
      }

      if (salesQ && String(row.description || "").trim() !== salesQ) {
        return false;
      }

      if (skuQ) {
        const hit = (row.lines || []).some((line) => {
          const invKey = String(line.inventory_item_id ?? "").trim();
          const master = invKey ? itemByInventoryId.get(invKey) : undefined;
          const sku = String(master?.sku || "").trim();
          const itemNumber = String(master?.item_number || "").trim();
          return sku === skuQ || itemNumber === skuQ || invKey === skuQ;
        });
        if (!hit) return false;
      }

      return true;
    });
  }, [response?.data, skuFilter, spbFilter, salesFilter, itemByInventoryId]);

  const columns = useMemo<ColumnDef<MoveOrderIntegrationHeader>[]>(
    () => [
      {
        accessorKey: "request_number",
        header: "SPB / Request",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900">
              {row.original.request_number}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {row.original.operation} • {row.original.source_system}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Nama Sales / PIC",
      },
      {
        accessorKey: "updatedAt",
        header: "Waktu Update",
        cell: ({ row }) => {
          const waktu =
            row.original.updatedAt ||
            row.original.last_update_date ||
            row.original.createdAt ||
            row.original.creation_date;
          return (
            <div className="flex items-center gap-1.5 text-slate-600">
              <FaClock size={12} className="text-slate-400" />
              {formatDateTimeIndo(waktu)}
            </div>
          );
        },
      },
      {
        accessorKey: "iface_status",
        header: "Status Integrasi",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.iface_status}
            message={row.original.iface_message}
          />
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const id = row.original.id;
          const status = String(row.original.iface_status || "").toUpperCase();
          const isPolling = Boolean(pollingIds[id]);

          if (status !== "ERROR") {
            return <span className="text-xs text-slate-300">-</span>;
          }

          return (
            <button
              type="button"
              disabled={!id || isPolling}
              onClick={(event) => {
                event.stopPropagation();
                handlePollIntegration(id);
              }}
              title="Polling status integrasi ke server"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isPolling
                  ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                  : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95"
              }`}
            >
              <FaSyncAlt
                size={11}
                className={isPolling ? "animate-spin" : ""}
              />
              {isPolling ? "Polling..." : "Poll"}
            </button>
          );
        },
      },
    ],
    [handlePollIntegration, pollingIds],
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Monitoring Integrasi Move Order
            </h1>
            <p className="text-sm text-slate-500">
              Pusat kontrol dan pantauan integraasi data ke Meta.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshBusy}
            className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-200 ${refreshBusy ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FaSyncAlt
              className={`transition-transform duration-500 ${refreshBusy ? "animate-spin" : ""}`}
              size={14}
            />
            {refreshBusy ? "Memuat..." : "Refresh"}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              SKU
            </span>
            <select
              value={skuFilter}
              onChange={(e) => setSkuFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-400"
            >
              <option value="">Semua SKU</option>
              {skuOptions.map((sku) => (
                <option key={sku} value={sku}>
                  {sku}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              SPB Number
            </span>
            <select
              value={spbFilter}
              onChange={(e) => setSpbFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-400"
            >
              <option value="">Semua SPB</option>
              {spbOptions.map((spb) => (
                <option key={spb} value={spb}>
                  {spb}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              Nama Sales
            </span>
            <select
              value={salesFilter}
              onChange={(e) => setSalesFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-400"
            >
              <option value="">Semua Sales</option>
              {salesOptions.map((sales) => (
                <option key={sales} value={sales}>
                  {sales}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              <FaFilter size={10} /> Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-400"
            >
              <option value="">Semua Status</option>
              <option value="INTEGRATED">Berhasil</option>
              <option value="ERROR">Gagal</option>
              <option value="TIMEOUT">Timeout</option>
            </select>
          </label>
        </div>

        <DataTable
          columns={columns}
          data={sortedData}
          isLoading={isLoading}
          pageIndex={page}
          pageSize={limit}
          totalPages={response?.meta.totalPages || 0}
          onPageChange={setPage}
          onPageSizeChange={(l: number) => {
            setLimit(l);
            setPage(1);
          }}
          renderSubComponent={({ row }: any) => {
            const data = row.original as MoveOrderIntegrationHeader;
            return (
              <div className="p-6 bg-slate-50/50 border-b border-slate-200">
                <div className="flex items-center gap-2 text-slate-700 mb-4 font-bold text-sm">
                  <FaBox className="text-indigo-500" /> Detail Item Lines (
                  {data.lines.length} items)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.lines.map((line: any) => {
                    const invKey = String(line.inventory_item_id ?? "").trim();
                    const master = invKey
                      ? itemByInventoryId.get(invKey)
                      : undefined;

                    return (
                      <div
                        key={line.id}
                        className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="min-w-0">
                            {master ? (
                              <>
                                <p className="text-sm font-bold text-slate-900 truncate">
                                  {master.sku}
                                </p>
                                <p className="text-[11px] font-medium text-slate-500 truncate">
                                  {master.item_number || "-"}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {master.description}
                                </p>
                              </>
                            ) : (
                              <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                ITEM ID: {line.inventory_item_id || "-"}
                              </span>
                            )}
                            {master && (
                              <span className="inline-block mt-1 text-[10px] font-medium text-slate-400">
                                ID: {line.inventory_item_id}
                              </span>
                            )}
                          </div>
                          <span className="shrink-0 text-xs font-bold text-indigo-600">
                            {line.quantity} {line.uom_code}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400">
                            Subinventory:{" "}
                            <span className="text-slate-700 font-medium">
                              {line.from_subinventory_code} ➝{" "}
                              {line.to_subinventory_code}
                            </span>
                          </p>
                          <div
                            className={`text-[10px] font-semibold mt-2 pt-2 border-t ${line.iface_status === "SUCCESS" ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {line.iface_status}{" "}
                            {line.iface_message && `- ${line.iface_message}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

const IntegrationMonitoringPage = () => (
  <DeferredMount delayMs={180}>
    <IntegrationMonitoringPageInner />
  </DeferredMount>
);

export default IntegrationMonitoringPage;
