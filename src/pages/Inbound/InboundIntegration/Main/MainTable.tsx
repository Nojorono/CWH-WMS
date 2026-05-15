import { useState, useMemo } from "react";
import Input from "../../../../components/form/input/InputField";
import AdjustTable from "./AdjustTable";
import Label from "../../../../components/form/Label";
import { useDebounce } from "../../../../helper/useDebounce";
import Select from "../../../../components/form/Select";

const MainTable = () => {
  const [selectedIO, setSelectedIO] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);

  // 1. Ambil data dari localStorage dan format menjadi Options untuk Select
  const ioOptions = useMemo(() => {
    const listIO = localStorage.getItem("io_list");
    if (!listIO) return [{ value: "", label: "No Organization Found" }];

    try {
      const parsedIO = JSON.parse(listIO);
      const options = parsedIO.map((item: any) => ({
        value: item.id, // atau item.organization_id sesuai kebutuhan backend
        label: `${item.organization_name} - ${item.organization_code}`,
      }));
      return [{ value: "", label: "All Organization" }, ...options];
    } catch (error) {
      console.error("Error parsing io_list:", error);
      return [{ value: "", label: "Error Loading IO" }];
    }
  }, []);

  return (
    <>
      <div className="p-6 bg-white shadow-sm rounded-xl mb-6 border border-slate-100">
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

          {/* Placeholder untuk button atau filter tambahan jika nanti diperlukan */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setGlobalFilter("");
                setSelectedIO(null);
              }}
              className="text-xs text-blue-600 font-bold hover:underline py-2 px-4"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Utama */}
      <AdjustTable
        globalFilter={debouncedFilter}
        setGlobalFilter={setGlobalFilter}
        filteredIO={selectedIO} 
      />
    </>
  );
};

export default MainTable;
