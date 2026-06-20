import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DOSuggestionData } from "../../../../API/types/draftDOsuggestion";
import { BaseTable } from "../component/BaseTable";
import { PrintPreviewModal } from "../component/PrintPreviewModal";

interface GoodsPreparationPageProps {
  data: DOSuggestionData[];
}

export const GoodsPreparationPage = ({ data }: GoodsPreparationPageProps) => {
  const [globalFilter, setGlobalFilter] = useState("");

  // 2. State untuk mengontrol Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDataToPrint, setSelectedDataToPrint] =
    useState<DOSuggestionData | null>(null);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  };

  const handleOpenPrintPreview = (rowData: DOSuggestionData) => {
    setSelectedDataToPrint(rowData);
    setIsModalOpen(true);
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
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <button
            // 3. Panggil fungsi buka modal dengan mengirimkan data baris (row) ini
            onClick={() => handleOpenPrintPreview(row.original)}
            className="px-4 py-1.5 text-xs font-semibold text-orange-500 border border-orange-500 rounded-md hover:bg-orange-50 transition-colors"
          >
            Print Preview
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <BaseTable
        data={data}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        isExpandable={false}
        headerActions={
          <div className="flex gap-2">
            <button className="px-4 py-2 text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
              Download Summary SPB
            </button>
            <button className="px-4 py-2 text-xs font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20">
              Print Qty Per SPB
            </button>
          </div>
        }
        footerAction={null}
      />

      {/* 4. Render Modal di luar tabel */}
      <PrintPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedDataToPrint}
      />
    </>
  );
};
