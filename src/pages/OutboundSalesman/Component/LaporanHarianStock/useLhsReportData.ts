import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import {
  lhsReportService,
  type LhsApiDetailData,
} from "../../../../API/services/outbound-salesman/LhsReportService";
import { isRequestAborted } from "../../../../DynamicAPI/services/CreateCrudService";
import { showErrorToast } from "../../../../components/toast";
import { sumRows } from "./logic";
import {
  buildIncomingOutgoingLines,
  mapLhsApiItemsToRows,
} from "./mapLhsApi";
import { LhsMovementLine, LhsReportContext, LhsStockComputed } from "./types";

/**
 * LHS: GET /outbound-sales/report/lhs + /lhs/detail
 * Query hanya `date` = hari ini (tanpa date picker).
 */
export const useLhsReportData = (reportDate: string) => {
  const user = usePersistAuthStore((s) => s.user);

  const organizationId =
    user?.userDetail?.organizationId ||
    user?.userDetail?.organization?.id ||
    "";
  const organizationName =
    user?.userDetail?.organization?.organization_name ||
    user?.userDetail?.organization?.org_name ||
    "";
  const organizationCode =
    user?.userDetail?.organization?.organization_code ||
    organizationName ||
    "";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<LhsStockComputed[]>([]);
  const [detail, setDetail] = useState<LhsApiDetailData | null>(null);
  const [apiOrgName, setApiOrgName] = useState("");
  const [apiDate, setApiDate] = useState(reportDate);
  const [previousDate, setPreviousDate] = useState<string | null>(null);

  const amoName = apiOrgName || organizationName || organizationCode || "—";

  const context: LhsReportContext = useMemo(
    () => ({
      amoName,
      organizationId: String(organizationId || ""),
      organizationCode: String(organizationCode || ""),
      reportDate: apiDate || reportDate,
      previousDate,
    }),
    [amoName, organizationId, organizationCode, apiDate, reportDate, previousDate],
  );

  const refetch = useCallback(
    async (options?: { force?: boolean; signal?: AbortSignal }) => {
      if (!reportDate) {
        setRows([]);
        setDetail(null);
        setPreviousDate(null);
        setError("Tanggal laporan tidak valid.");
        return;
      }

      const signal = options?.signal;
      setIsLoading(true);
      setError(null);

      try {
        const [summary, detailRes] = await Promise.all([
          lhsReportService.getSummary(reportDate, { signal }),
          lhsReportService.getDetail(reportDate, { signal }).catch((err) => {
            if (isRequestAborted(err) || signal?.aborted) throw err;
            console.error("LHS detail gagal:", err);
            return null;
          }),
        ]);

        if (signal?.aborted) return;

        setApiOrgName(String(summary.organization_name || "").trim());
        setApiDate(String(summary.date || reportDate).trim() || reportDate);
        setPreviousDate(
          String(summary.previous_date || "").trim() ||
            String(detailRes?.previous_date || "").trim() ||
            null,
        );
        setRows(mapLhsApiItemsToRows(summary.items));
        setDetail(detailRes);
      } catch (err: unknown) {
        if (isRequestAborted(err) || signal?.aborted) return;
        console.error("Gagal load Laporan Stock Harian:", err);
        const message =
          err instanceof Error ? err.message : "Gagal memuat data laporan";
        setError(message);
        showErrorToast(message);
        setRows([]);
        setDetail(null);
        setPreviousDate(null);
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [reportDate],
  );

  useEffect(() => {
    const ac = new AbortController();
    void refetch({ signal: ac.signal });
    return () => ac.abort();
  }, [refetch]);

  const { incoming, outgoing } = useMemo((): {
    incoming: LhsMovementLine[];
    outgoing: LhsMovementLine[];
  } => buildIncomingOutgoingLines(detail, rows, reportDate), [
    detail,
    reportDate,
    rows,
  ]);

  const totals = useMemo(() => sumRows(rows), [rows]);

  const reportDateLabel = dayjs(context.reportDate).isValid()
    ? dayjs(context.reportDate).format("DD MMMM YYYY")
    : context.reportDate;
  const previousDateLabel = context.previousDate
    ? dayjs(context.previousDate).isValid()
      ? dayjs(context.previousDate).format("DD MMMM YYYY")
      : context.previousDate
    : null;

  return {
    context,
    rows,
    totals,
    detail,
    incoming,
    outgoing,
    isLoading,
    error,
    refetch,
    salesCount: 0,
    reportDateLabel,
    previousDateLabel,
  };
};
