import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../component/Table"; // Pastikan path ini benar

// --- DUMMY DATA (15 Items) ---
const DUMMY_DATA = Array.from({ length: 15 }).map((_, index) => {
  const statuses = ["Not Created", "Created", "Created", "Created"];
  const spbStatuses = ["-", "In Progress", "Final", "Submitted"];
  const names = [
    "Agus Setiawan",
    "Dedi Kurnia",
    "Rina Marliana",
    "Budi Firmansyah",
  ];
  const selectTexts = ["Selected", "Locked", "Locked", "Choose"];

  return {
    id: index + 1,
    selectText: selectTexts[index % selectTexts.length],
    nik: `100${2451 + index * 111}`,
    statusCallPlan: statuses[index % statuses.length],
    namaSales: names[index % names.length],
    spbStatus: spbStatuses[index % spbStatuses.length],
    actionType: index === 0 ? "Generate" : "Unavailable",
  };
});

const AdjustTable = ({ globalFilter, setGlobalFilter }: any) => {
  // Setup pagination lokal untuk dummy data
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filter dummy data berdasarkan globalFilter (Search)
  const filteredData = useMemo(() => {
    let result = DUMMY_DATA;
    if (globalFilter) {
      const lowerFilter = globalFilter.toLowerCase();
      result = result.filter(
        (item) =>
          item.nik.toLowerCase().includes(lowerFilter) ||
          item.namaSales.toLowerCase().includes(lowerFilter),
      );
    }
    return result;
  }, [globalFilter]);

  // --- DEFINISI KOLOM SESUAI GAMBAR ---
  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        id: "select",
        header: () => <div className="text-left pl-4">SELECT</div>,
        cell: ({ row }) => (
          <div className="flex items-center gap-4 pl-4">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              defaultChecked={row.original.selectText === "Selected"}
              disabled={row.original.selectText === "Locked"}
            />
            <span className="text-sm font-medium text-slate-600 w-16">
              {row.original.selectText}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "nik",
        header: () => <div className="text-left">NIK</div>,
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-slate-700">
            {row.original.nik}
          </span>
        ),
      },
      {
        accessorKey: "statusCallPlan",
        header: () => <div className="text-center">STATUS CALL PLAN</div>,
        cell: ({ row }) => {
          const status = row.original.statusCallPlan;
          const isCreated = status === "Created";
          return (
            <div className="flex justify-center">
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-semibold w-28 text-center transition-colors ${
                  isCreated
                    ? "bg-orange-50 text-orange-500"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {status}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "namaSales",
        header: () => <div className="text-left">NAMA SALES</div>,
        cell: ({ row }) => (
          <span className="text-sm font-medium text-slate-600">
            {row.original.namaSales}
          </span>
        ),
      },
      {
        accessorKey: "spbStatus",
        header: () => <div className="text-center">SPB STATUS</div>,
        cell: ({ row }) => {
          const status = row.original.spbStatus;
          let style = "bg-slate-100 text-slate-500"; // default (-)

          if (status === "In Progress") style = "bg-amber-50 text-amber-600";
          else if (status === "Final") style = "bg-green-50 text-green-500";
          else if (status === "Submitted")
            style = "bg-indigo-50 text-indigo-600";

          return (
            <div className="flex justify-center">
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-semibold w-28 text-center transition-colors ${style}`}
              >
                {status}
              </span>
            </div>
          );
        },
      },
      {
        id: "action",
        header: () => <div className="text-center">ACTION</div>,
        cell: ({ row }) => {
          const isGenerate = row.original.actionType === "Generate";
          return (
            <div className="flex justify-center">
              <button
                disabled={!isGenerate}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold w-36 text-center transition-all duration-200 ${
                  isGenerate
                    ? "bg-[#F97316] hover:bg-orange-600 text-white shadow-sm"
                    : "bg-[#E2E8F0] text-slate-500 cursor-not-allowed opacity-80"
                }`}
              >
                {isGenerate ? "Generate Suggestion" : "Unavailable"}
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <TableComponent
          data={filteredData}
          columns={columns}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          pageSize={pageSize}
          pageIndex={pageIndex}
          totalPages={Math.ceil(filteredData.length / pageSize)}
          onPageChange={(page: number, size: number) => {
            setPageIndex(page);
            setPageSize(size);
          }}
        />
      </div>
    </div>
  );
};

export default AdjustTable;
