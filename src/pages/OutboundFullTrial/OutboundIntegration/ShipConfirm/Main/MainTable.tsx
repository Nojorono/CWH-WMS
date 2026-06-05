import { useState, useMemo } from "react";
import Input from "../../../../../components/form/input/InputField";
import AdjustTable from "./AdjustTable";
import Label from "../../../../../components/form/Label";
import { useDebounce } from "../../../../../helper/useDebounce";
import Select from "../../../../../components/form/Select";
import Button from "../../../../../components/ui/button/Button";
import { FaExchangeAlt, FaRecycle, FaSync } from "react-icons/fa";
import { useStoreShipConfirm } from "../../../../../DynamicAPI/stores/Store/MasterStore";

// KUNCI PERBAIKAN: Hubungkan ke Store Persistent baru Anda
import { usePersistAuthStore } from "../../../../../API/store/AuthStore/PersistAuthStore";

const MainTable = () => {
  const [selectedIO, setSelectedIO] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);

  const { fetchAll } = useStoreShipConfirm();

  // 1. Ambil data ioList secara reaktif langsung dari Zustand global state
  const ioList = usePersistAuthStore((state) => state.ioList);

  // 2. Format menjadi Options untuk Select secara aman tanpa boilerplate try-catch/JSON.parse
  const ioOptions = useMemo(() => {
    if (!ioList || ioList.length === 0) {
      return [{ value: "", label: "No Organization Found" }];
    }

    const options = ioList.map((item: any) => ({
      value: item.id,
      label: `${item.organization_name} - ${item.organization_code}`,
    }));

    return [{ value: "", label: "All Organization" }, ...options];
  }, [ioList]); // Otomatis mengkalkulasi ulang jika data IO berubah atau terisi setelah sign-in

  const handleRefresh = () => {
    fetchAll();
  };

  return (
    <>
      <div className="p-6 bg-white shadow-sm rounded-xl mb-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <FaExchangeAlt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Ship Confirm Log
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Monitor status Ship Confirm
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-6">
          {/* Filter Search */}
          <div className="flex-1 space-y-2">
            <Label
              htmlFor="search"
              className="text-slate-600 font-bold text-xs uppercase tracking-wider"
            >
              Search Data
            </Label>
            <Input
              onChange={(e) => setGlobalFilter(e.target.value)}
              type="text"
              id="search"
              placeholder="🔍 Cari No. Receipt, Plat, atau Item..."
              className="w-full border-slate-200 focus:ring-blue-500"
            />
          </div>

          {/* Filter Organization / IO */}
          <div className="flex-1 space-y-2">
            <Label
              htmlFor="io-filter"
              className="text-slate-600 font-bold text-xs uppercase tracking-wider"
            >
              Organization / IO
            </Label>
            <Select
              options={ioOptions}
              placeholder="Pilih Organization"
              onChange={(value) => setSelectedIO(value)}
              value={selectedIO}
            />
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setGlobalFilter("");
                setSelectedIO(null);
              }}
              startIcon={<FaRecycle className="size-5" />}
            >
              Reset Filter
            </Button>
          </div>

          <Button
            variant="action"
            size="sm"
            onClick={handleRefresh}
            startIcon={<FaSync className="size-5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabel Utama Integration Log */}
      <AdjustTable
        globalFilter={debouncedFilter}
        setGlobalFilter={setGlobalFilter}
        filteredIO={selectedIO}
      />
    </>
  );
};

export default MainTable;
