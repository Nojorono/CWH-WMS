import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  DOSuggestionData,
  DOSuggestionDetail,
} from "../../../../API/types/draftDOsuggestion";
import { BaseTable } from "../component/BaseTable";
import { FaArrowRight, FaChevronLeft, FaChevronRight, FaRegArrowAltCircleRight } from "react-icons/fa";
import Button from "../../../../components/ui/button/Button";

interface SPBSubmittedPageProps {
  data: DOSuggestionData[];
  onProceed: () => void;
}

// Komponen SubTable langsung me-return UI
const StandardSubTable = ({
  details,
  status, // Status sengaja saya pertahankan sebagai props jaga-jaga kalau mau dipakai lagi
}: {
  details: DOSuggestionDetail[];
  status: string;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Kalkulasi Pagination
  const totalItems = details?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleDetails =
    details?.slice(startIndex, startIndex + itemsPerPage) || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-4 bg-slate-50/50">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Sub-Table Header Action */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
          <h4 className="font-semibold text-slate-800 text-sm">
            Product Detail
          </h4>
        </div>

        {/* Sub-Table Content (Scrollable) */}
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-left text-sm text-slate-600 relative">
            <thead className="bg-slate-50 text-slate-500 font-medium text-xs sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-100">
              <tr>
                <th className="px-5 py-3">SKU Name</th>
                <th className="px-5 py-3">Locked Qty</th>
                <th className="px-5 py-3">BTB Qty</th>
                <th className="px-5 py-3">UoM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleDetails.length > 0 ? (
                visibleDetails.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {item.item_code}
                    </td>
                    <td className="px-5 py-3">
                      {item.item_qty_suggestion || "0"}
                    </td>
                    <td className="px-5 py-3">0</td>
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {item.item_uom}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-4 text-center text-slate-400 text-sm"
                  >
                    Tidak ada detail produk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-white">
            <span className="text-xs text-slate-400">
              {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}{" "}
              items
            </span>

            {/* Kontrol Navigasi Angka */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                >
                  <FaChevronLeft size={10} />
                </button>

                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    totalPages > 5 &&
                    pageNumber !== 1 &&
                    pageNumber !== totalPages &&
                    Math.abs(pageNumber - currentPage) > 1
                  ) {
                    if (Math.abs(pageNumber - currentPage) === 2) {
                      return (
                        <span
                          key={pageNumber}
                          className="text-slate-400 text-xs px-1 font-bold"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors border ${
                        currentPage === pageNumber
                          ? "bg-slate-100 border-slate-300 text-slate-700"
                          : "border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                >
                  <FaChevronRight size={10} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const SPBSubmittedPage = ({
  data,
  onProceed,
}: SPBSubmittedPageProps) => {
  const [globalFilter, setGlobalFilter] = useState("");

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  };

  const columns = useMemo<ColumnDef<DOSuggestionData>[]>(
    () => [
      { accessorKey: "callplan_number", header: "Call Plan Number" },
      { accessorKey: "sales_nik", header: "NIK Sales" },
      { accessorKey: "sales_name", header: "Nama Sales" },
      {
        id: "total_sku",
        header: "Total SKU",
        cell: ({ row }) => row.original.details?.length || 0,
      },
      {
        accessorKey: "callplan_date_start",
        header: "Start Date",
        cell: (info) => formatDate(info.getValue<string>()),
      },
      {
        accessorKey: "callplan_date_end",
        header: "End Date",
        cell: (info) => formatDate(info.getValue<string>()),
      },
    ],
    [],
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      isExpandable={true}
      renderSubComponent={(row) => (
        <StandardSubTable details={row.details} status={row.status} />
      )}
      footerAction={
        <Button onClick={onProceed} variant="primary" endIcon={<FaArrowRight/>}>
          Proceed to Allocation & Calculation
        </Button>
      }
    />
  );
};
