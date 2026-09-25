import { Callplan } from "../../types/CallplanTypes";
import {
  DynamicColumn,
  SPB_DETAIL_COLUMNS,
  SPB_DETAIL_SUMMARY_CARDS,
  SummaryCardConfig,
} from "../SPB/spbTableConfig";

/** Master columns — tanpa Action (Rekap COMPLETED read-only) */
export const REKAP_MASTER_COLUMNS: DynamicColumn<Callplan>[] = [
  {
    id: "callplan_number",
    header: "Callplan Number",
    sortable: true,
    cellClassName: "text-gray-600",
  },
  {
    id: "spb_number",
    header: "SPB Number",
    sortable: true,
    cellClassName: "text-gray-600",
  },
  {
    id: "mo_type",
    header: "FPPR Type",
    sortable: true,
    cellClassName: "text-gray-600",
    getValue: (row) => row.mo_type?.trim() || "-",
  },
  {
    id: "sales_nik",
    header: "NIK Sales",
    sortable: true,
    cellClassName: "text-gray-600",
  },
  {
    id: "sales_name",
    header: "Nama Sales",
    sortable: true,
    cellClassName: "text-gray-800 font-medium",
  },
  {
    id: "total_sku",
    header: "Total SKU",
    cellClassName: "text-gray-800",
    getValue: (row) => row.details?.length || 0,
  },
  {
    id: "status",
    header: "Status",
    cellClassName: "font-semibold text-emerald-700",
  },
];

/** Detail + summary card — sama dengan SPB Overview */
export const REKAP_DETAIL_COLUMNS = SPB_DETAIL_COLUMNS;
export const REKAP_DETAIL_SUMMARY_CARDS: SummaryCardConfig[] =
  SPB_DETAIL_SUMMARY_CARDS;
