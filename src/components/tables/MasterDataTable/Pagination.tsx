import React from "react";
import {
  MdChevronLeft,
  MdChevronRight,
  MdFirstPage,
  MdLastPage,
} from "react-icons/md";

interface PaginationControlsProps {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  setPageSize: (size: number) => void;
  previousPage: () => void;
  nextPage: () => void;
  canPreviousPage: boolean;
  canNextPage: boolean;
  selectedRowCount: number;
  totalDataCount: number;
  gotoPage: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  pageIndex,
  pageSize,
  pageCount,
  setPageSize,
  previousPage,
  nextPage,
  canPreviousPage,
  canNextPage,
  selectedRowCount,
  totalDataCount,
  gotoPage,
}) => {
  // Logika untuk menampilkan angka halaman dengan Ellipsis (...)
  const getPageNumbers = () => {
    const pages = [];

    // 1. Selalu tampilkan halaman pertama jika kita tidak di halaman pertama
    if (pageIndex !== 0) {
      pages.push(0);
    }

    // 2. Tambahkan Ellipsis jika jarak antara halaman pertama dan current page cukup jauh
    if (pageIndex > 1) {
      pages.push("ellipsis-1");
    }

    // 3. Tampilkan halaman aktif (Current Page)
    pages.push(pageIndex);

    // 4. Tambahkan Ellipsis jika jarak antara current page dan halaman terakhir cukup jauh
    if (pageIndex < pageCount - 2) {
      pages.push("ellipsis-2");
    }

    // 5. Tampilkan halaman terakhir jika kita tidak di halaman terakhir
    if (pageIndex !== pageCount - 1 && pageCount > 0) {
      pages.push(pageCount - 1);
    }

    return pages;
  };

  const startRange = pageIndex * pageSize + 1;
  const endRange = Math.min((pageIndex + 1) * pageSize, totalDataCount);

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
      {/* Bagian Kiri: Info Row */}
      <div className="flex flex-col gap-1">
        <p className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {totalDataCount === 0 ? 0 : startRange}
          </span>{" "}
          to <span className="font-semibold text-gray-900">{endRange}</span> of{" "}
          <span className="font-semibold text-gray-900">{totalDataCount}</span>{" "}
          entries
        </p>
        {selectedRowCount > 0 && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full w-fit">
            {selectedRowCount} rows selected
          </span>
        )}
      </div>

      {/* Bagian Tengah: Navigasi Angka */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => gotoPage(0)}
          disabled={!canPreviousPage}
          className="p-2 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <MdFirstPage size={20} />
        </button>
        <button
          onClick={previousPage}
          disabled={!canPreviousPage}
          className="p-2 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <MdChevronLeft size={20} />
        </button>

        <div className="flex items-center space-x-1 px-2">
          {getPageNumbers().map((page, i) =>
            typeof page === "number" ? (
              <button
                key={i}
                onClick={() => gotoPage(page)}
                className={`w-9 h-9 flex items-center justify-center rounded-md text-sm font-medium transition-all ${
                  pageIndex === page
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-white border hover:border-orange-400 text-gray-600"
                }`}
              >
                {page + 1}
              </button>
            ) : (
              <span key={i} className="px-1 text-gray-400">
                ...
              </span>
            ),
          )}
        </div>

        <button
          onClick={nextPage}
          disabled={!canNextPage}
          className="p-2 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <MdChevronRight size={20} />
        </button>
        <button
          onClick={() => gotoPage(pageCount - 1)}
          disabled={!canNextPage}
          className="p-2 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <MdLastPage size={20} />
        </button>
      </div>

      {/* Bagian Kanan: Page Size Selector */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Show</span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="border rounded-md px-2 py-1.5 bg-white text-sm focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PaginationControls;
