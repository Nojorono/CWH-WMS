import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "./Table";
import { useNavigate } from "react-router-dom";
import { CallPlanDetail } from "../../../../API/types/callPlan";
import { SuggestionSummary } from "../../../../API/types/DOsuggestion";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { FaEye, FaMagic } from "react-icons/fa";
import { useDOActions } from "../hook/useDOActions";
import ActIndicator from "../../../../components/ui/activityIndicator";
import StatusBadge from "../../../../common/statusBadge";
import { StatusMap } from "../../../../constants/statusMaps";
import { checkIsGenerated } from "../../../../API/services/DOsuggestionServices/checkIsGeneratedDO";
import { getDOsuggestion } from "../../../../API/services/DOsuggestionServices/DOsuggestionService";
import { postDOsuggestion } from "../../../../API/services/DOsuggestionServices/postDOsuggestion";
import {
  isGenerateDOAllowed,
  getGenerateErrorMessage,
} from "../global/allowedDate";

interface AdjustTableProps {
  data: CallPlanDetail[];
  globalFilter: string;
  setGlobalFilter: (val: string) => void;
}

export const STATUS_MAP_DO: StatusMap = {
  DRAFT: "dark",
  REVISED: "warning",
  SUBMITTED: "success",
};

const AdjustTable = ({
  data,
  globalFilter,
  setGlobalFilter,
}: AdjustTableProps) => {
  const navigate = useNavigate();
  const state = usePersistAuthStore.getState();
  const user = state.user;
  const organization_id = user?.userDetail?.organization?.id;

  const actions = useDOActions();

  const [loadingRowId, setLoadingRowId] = useState<string | null>(null);
  const [generatedCallPlans, setGeneratedCallPlans] = useState<Set<string>>(
    new Set(),
  );

  // Filter data berdasarkan globalFilter (Search)
  const filteredData = useMemo(() => {
    if (!globalFilter) return data;
    const lowerFilter = globalFilter.toLowerCase();
    return data.filter(
      (item) =>
        item.SALES_NIK.toLowerCase().includes(lowerFilter) ||
        item.SALES_NAME.toLowerCase().includes(lowerFilter) ||
        item.ROUTE_NUMBER.toLowerCase().includes(lowerFilter),
    );
  }, [data, globalFilter]);

  const columns: ColumnDef<CallPlanDetail>[] = useMemo(
    () => [
      {
        accessorKey: "SALES_NIK",
        header: () => <div className="text-left">NIK</div>,
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-slate-700">
            {row.original.SALES_NIK}
          </span>
        ),
      },
      {
        accessorKey: "SALES_NAME",
        header: () => <div className="text-left">NAMA SALES</div>,
        cell: ({ row }) => (
          <span className="text-sm font-medium text-slate-600">
            {row.original.SALES_NAME}
          </span>
        ),
      },
      {
        accessorKey: "ROUTE_NUMBER",
        header: () => <div className="text-center">ROUTE</div>,
        cell: ({ row }) => (
          <span className="text-sm text-center block text-slate-600">
            {row.original.ROUTE_NUMBER}
          </span>
        ),
      },
      {
        accessorKey: "CALL_PLAN_NUMBER",
        header: () => <div className="text-left">CALLPLAN NO</div>,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.CALL_PLAN_NUMBER}
          </span>
        ),
      },
      {
        accessorKey: "CALL_PLAN_START_DATE",
        header: () => <div className="text-left">CALLPLAN START DATE</div>,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.CALL_PLAN_START_DATE}
          </span>
        ),
      },
      {
        accessorKey: "CALL_PLAN_END_DATE",
        header: () => <div className="text-left">CALLPLAN END DATE</div>,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.CALL_PLAN_END_DATE}
          </span>
        ),
      },
      {
        accessorKey: "do_status",
        header: () => <div className="text-left">DO STATUS</div>,
        cell: ({ row }) => {
          const status = row.original.do_status;

          if (!status) {
            return <span className="text-slate-400 italic text-sm">-</span>;
          }

          return (
            <StatusBadge
              status={status}
              colorMap={STATUS_MAP_DO}
              variant="solid"
              size="sm"
            />
          );
        },
      },
      {
        accessorKey: "is_generated",
        header: () => <div className="text-left">Status Generate</div>,
        cell: ({ row }) => {
          const isGenerated = row.original.is_generated;

          if (!row.original.CALL_PLAN_NUMBER?.trim()) {
            return null;
          }

          return (
            <span
              className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                isGenerated
                  ? "bg-green-100 text-green-700"
                  : "bg-red-400 text-white"
              }`}
            >
              {isGenerated ? "Generated" : "Not Generated"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">Action</div>,
        cell: ({ row }) => {
          const isGenerated = row.original.is_generated;
          const startDate = row.original.CALL_PLAN_START_DATE;

          if (!row.original.CALL_PLAN_NUMBER?.trim()) {
            return null;
          }

          // 1. Cek izin menggunakan fungsi global
          const isAllowedToGenerate = isGenerateDOAllowed(startDate);
          const errorMessage = startDate
            ? getGenerateErrorMessage(startDate)
            : "Tanggal tidak valid";

          return (
            <div className="flex justify-center items-center">
              {isGenerated ? (
                <button
                  onClick={() =>
                    actions.handleAdjust(row.original, organization_id)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
                  title="View Detail"
                >
                  <FaEye className="text-slate-500" />
                  <span>View Detail</span>
                </button>
              ) : (
                <button
                  onClick={() => handleGenerateDO(row.original)}
                  disabled={!isAllowedToGenerate}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white border border-transparent rounded-lg transition-all focus:outline-none focus:ring-2 
                    ${
                      isAllowedToGenerate
                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm focus:ring-emerald-500/50"
                        : "bg-slate-300 cursor-not-allowed text-slate-500" // Visual jika terkunci
                    }`}
                  title={
                    isAllowedToGenerate ? "Generate Suggestion" : errorMessage
                  }
                >
                  <FaMagic />
                  <span>Generate</span>
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [navigate, loadingRowId],
  );

  const initialPayload = (
    suggestionData: SuggestionSummary,
    revisions: Map<string, number>,
    selectedSales: any,
  ) => {
    return {
      organization_id: organization_id || "",
      callplan_number: selectedSales?.CALL_PLAN_NUMBER || "",
      callplan_date_start: selectedSales?.CALL_PLAN_START_DATE || "",
      callplan_date_end: selectedSales?.CALL_PLAN_END_DATE || "",
      route_number: selectedSales?.ROUTE_NUMBER || "",
      trip_type: selectedSales?.trip_type || "",
      sales_nik: selectedSales?.SALES_NIK || "",
      sales_name: selectedSales?.SALES_NAME || "",
      sales_spv: selectedSales?.SALES_SUPERVISOR_NAME || "",
      sales_spv_nik: selectedSales?.SALES_SUPERVISOR_NIK || "",
      status: "DRAFT",
      created_by: selectedSales?.SALES_SUPERVISOR_NIK,
      lines: suggestionData.summary.map((item, index) => ({
        item_code: item.product_sku,
        item_qty_suggestion: item.total_suggestion_qty,
        item_uom: "BKS",
        line_number: index + 1,
        inventory_item_id: Number(item.inventoryid),
      })),
    };
  };

  const handleGenerateDO = async (rowData: any) => {
    if (!isGenerateDOAllowed(rowData.CALL_PLAN_START_DATE)) {
      showErrorToast(getGenerateErrorMessage(rowData.CALL_PLAN_START_DATE));
      return;
    }

    const rowId = rowData.CALL_PLAN_NUMBER;
    const existingData = await checkIsGenerated(rowId);

    if (existingData) {
      showSuccessToast("Data Sudah Generate");
      return;
    }

    setLoadingRowId(rowId);

    try {
      const params = {
        CABANG: rowData.CABANG,
        SALES_SUPERVISOR_NIK: rowData.SALES_SUPERVISOR_NIK,
        SALES_NIK: rowData.SALES_NIK,
        CALL_PLAN_START_DATE: rowData.CALL_PLAN_START_DATE,
        CALL_PLAN_END_DATE: rowData.CALL_PLAN_END_DATE,
      };

      const suggestionData = await getDOsuggestion(params);

      if (!suggestionData.summary || suggestionData.summary.length === 0) {
        showErrorToast("Tidak ada data DO Suggestion untuk Callplan ini.");
        return;
      }

      const payload = initialPayload(suggestionData, new Map(), rowData);
      await postDOsuggestion(payload);
      setGeneratedCallPlans((prev) => new Set(prev).add(rowId));
      showSuccessToast("DO Suggestion berhasil di-generate!");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate("generate_do", { state: { selectedSales: rowData } });
    } catch (error: any) {
      showErrorToast(error.message);
    } finally {
      setLoadingRowId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {loadingRowId ? (
        <ActIndicator />
      ) : (
        <TableComponent
          data={filteredData}
          columns={columns}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
      )}
    </div>
  );
};

export default AdjustTable;
