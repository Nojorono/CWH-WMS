import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useOpeningStockStore } from "../../../DynamicAPI/services/Service/OpeningStockBalanceService";
import { usePersistAuthStore } from "../../../API/store/AuthStore/PersistAuthStore";
import OpeningStockTable from "./OpeningStockTable";

export default function OpeningStockListPage() {
  const { data, meta, isLoading, fetchOpeningStockList } =
    useOpeningStockStore();
  const user = usePersistAuthStore((state) => state.user);
  const organizationId =
    user?.userDetail?.organizationId ||
    user?.userDetail?.organization?.id ||
    "";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (organizationId) {
      fetchOpeningStockList({
        search: search || undefined,
        status: status || undefined,
        source: source || undefined,
        organization_id: organizationId,
        page,
        limit,
      });
    }
  }, [search, status, source, page, organizationId]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-8xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Opening Stock List
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Riwayat saldo awal inventaris dan detail baris material/item.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="relative">
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
            Search Document
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari code atau notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
            <FaSearch className="absolute left-3 top-3 text-slate-400 w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
            Source Origin
          </label>
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
          >
            <option value="">All Source</option>
            <option value="MANUAL">MANUAL</option>
            <option value="EXCEL">EXCEL</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              setSearch("");
              setStatus("");
              setSource("");
              setPage(1);
            }}
            className="w-full md:w-auto px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <OpeningStockTable
        data={data}
        isLoading={isLoading}
        expandedRows={expandedRows}
        onToggleRow={toggleRow}
        meta={meta}
        onPageChange={setPage}
      />
    </div>
  );
}
