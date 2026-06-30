import React, { useState, useMemo, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { BaseTable } from "../component/BaseTable";
import {
  DOSuggestionData,
  DOSuggestionDetail,
} from "../../../../API/types/draftDOsuggestion";
import { PrintPreviewModal } from "../component/PrintPreviewModal";
import { FaPrint, FaDownload, FaCheckCircle } from "react-icons/fa";
import { useGetLocalDoSuggestion } from "../../Suggestion/hook/useGetLocalDoSuggestion";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { useGetBTB } from "../hook/useGetBTB";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

interface GoodsPreparationPageProps {
  targetDate: string;
}

// --- SUB-TABLE KHUSUS UNTUK GOODS PREPARATION ---
const PrepDetailTable = ({ details }: { details: DOSuggestionDetail[] }) => {
  if (!details || !Array.isArray(details) || details.length === 0) {
    return (
      <div className="text-center py-6 bg-slate-50 text-slate-400 text-sm italic border border-slate-200 rounded-lg mx-4 my-2">
        Data detail item tidak ditemukan atau kosong.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden my-2 mx-4">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Picking List ({details.length} Items)
        </h4>
        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
          <FaCheckCircle /> All items locked
        </span>
      </div>
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/90 text-slate-500 font-semibold text-[11px] uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-200 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3 w-12 text-center">No.</th>
              <th className="px-4 py-3">SKU Code</th>
              <th className="px-4 py-3 text-right">Qty Final SPB</th>
              <th className="px-4 py-3 text-right">Qty BTB</th>
              <th className="px-4 py-3 text-right font-extrabold text-orange-600">
                Top Up
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {details
              .map((item: any) => {
                const finalQty = Number(item.item_qty_final) || 0;
                // Sekarang qty_btb dari parent (hasil mapping) digunakan di sini
                const btbQty = Number(item.qty_btb) || 0;
                const qtyTopUp = finalQty - btbQty;
                return { ...item, finalQty, btbQty, qtyTopUp };
              })
              .filter((item: any) => item.qtyTopUp > 0)
              .map((item: any, idx: number) => (
                <tr
                  key={item.id || item.item_code || idx}
                  className="hover:bg-orange-50/40 transition-colors group"
                >
                  <td className="px-4 py-3 text-center text-slate-400 font-medium w-12">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {item.item_code}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-600 tabular-nums">
                    {item.finalQty}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-600 tabular-nums">
                    {item.btbQty}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-block px-3 py-1 bg-orange-100/50 text-orange-700 font-bold text-base rounded-lg tabular-nums border border-orange-200/50 group-hover:bg-orange-100 transition-colors">
                      {item.qtyTopUp}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export const GoodsPreparationPage = ({
  targetDate,
}: GoodsPreparationPageProps) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDataToPrint, setSelectedDataToPrint] =
    useState<DOSuggestionData | null>(null);

  const { user } = usePersistAuthStore.getState();
  const organization_id = user?.userDetail?.organizationId;
  const organization_name = user?.userDetail?.organization?.organization_name;

  const {
    submittedList,
    isLoading: isDOLoading,
    fetchSubmittedList,
  } = useGetLocalDoSuggestion();

  const paramGetBTB = useMemo(
    () => ({
      CABANG: String(organization_name),
      CALL_PLAN_START_DATE: targetDate,
    }),
    [organization_name, targetDate],
  );

  const { data: BTBdata, isLoading: isBTBLoading } = useGetBTB(paramGetBTB, {
    enabled: !!(organization_name && targetDate),
  });

  useEffect(() => {
    if (organization_id && targetDate) {
      fetchSubmittedList(targetDate, organization_id, "FINAL");
    }
  }, [organization_id, targetDate, fetchSubmittedList]);

  // --- LOGIKA MAPPING BTB (Penyelamat Refresh Halaman) ---
  const enrichedData = useMemo(() => {
    if (!submittedList || submittedList.length === 0) return [];

    return submittedList.map((doDocument) => {
      // 1. Cari data BTB salesman yang cocok
      const salesmanBTB = BTBdata?.find(
        (btb) => btb.SALES_NIK === doDocument.sales_nik,
      );

      // 2. Loop details-nya dan masukkan qty_btb jika SKU cocok
      const updatedDetails = doDocument.details.map((doDetail: any) => {
        const skuMatch = salesmanBTB?.details.find(
          (btbLine: any) => btbLine.PRODUCT_SKU === doDetail.item_code,
        );

        return {
          ...doDetail,
          qty_btb: skuMatch ? skuMatch.QTY_BTB : 0,
        };
      });

      return {
        ...doDocument,
        details: updatedDetails,
      };
    });
  }, [submittedList, BTBdata]);
  // ---------------------------------------------------------

  const handleOpenPrintPreview = async (rowData: DOSuggestionData) => {
    setSelectedDataToPrint(rowData);
    setIsModalOpen(true);

    const idData = rowData.id;

    try {
      const response = await axiosInstance.post(
        `/do-suggestion/${idData}/integrate`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const columns = useMemo<ColumnDef<DOSuggestionData>[]>(
    () => [
      { accessorKey: "spb_number", header: "SPB Number" },
      { accessorKey: "sales_name", header: "Sales Name" },
      { accessorKey: "sales_spv", header: "Supervisor" },
      {
        id: "total_items",
        header: "Total SKU to Pick",
        cell: ({ row }) => {
          const details = row.original.details || [];
          const count = details.filter(
            (d: any) => Number(d.item_qty_final) > 0,
          ).length;
          return <span className="font-semibold">{count}</span>;
        },
      },
      { accessorKey: "status", header: "Status SPB" },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <button
            onClick={() => handleOpenPrintPreview(row.original)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 hover:shadow-md transition-all"
          >
            <FaPrint /> Print SPB
          </button>
        ),
      },
    ],
    [],
  );

  const isLoading = isDOLoading || isBTBLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium">
          Memuat data persiapan barang & BTB...
        </p>
      </div>
    );
  }

  if (!enrichedData || enrichedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm mt-4">
        <p className="text-slate-500 font-medium">
          Belum ada data SPB dengan status FINAL.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <BaseTable
        data={enrichedData} // Gunakan data yang sudah di-enrich dengan BTB
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        isExpandable={true}
        // Pastikan melempar row.original.details
        renderSubComponent={(row) => <PrepDetailTable details={row.details} />}
        headerActions={
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              <FaDownload className="text-slate-400" /> Summary
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-orange-500 border border-transparent rounded-lg hover:bg-orange-600 transition-colors shadow-sm">
              <FaPrint /> Print All Picklists
            </button>
          </div>
        }
      />

      <PrintPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedDataToPrint}
      />
    </div>
  );
};
