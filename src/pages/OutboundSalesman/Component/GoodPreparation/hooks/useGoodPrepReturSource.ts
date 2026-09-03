import { useCallback, useEffect, useState } from "react";
import { callplanService } from "../../../Services/CallplanService";
import { Callplan } from "../../../types/CallplanTypes";
import { BTB } from "../../../types/BTBtypes";
import { useGoodPrepEnrichedData } from "./useGoodPrepEnrichedData";

type UseGoodPrepReturSourceParams = {
  organizationId: string;
  targetDate: string;
  btbData: BTB[];
  /** Skip fetch saat BTB belum siap / loading */
  enabled?: boolean;
};

/**
 * Sumber Form Retur:
 * GET /do-suggestion/report/retur?callplanDateStart=...
 * (data SPB sudah dibentuk BE), lalu enrich BTB cara lama:
 * match sales_nik → per SKU item_code, fallback inventory_item_id.
 */
export const useGoodPrepReturSource = ({
  organizationId,
  targetDate,
  btbData,
  enabled = true,
}: UseGoodPrepReturSourceParams) => {
  const [returCallplans, setReturCallplans] = useState<Callplan[]>([]);
  const [isReturSourceLoading, setIsReturSourceLoading] = useState(false);
  const [returSourceError, setReturSourceError] = useState<string | null>(null);

  const refetchReturSource = useCallback(async () => {
    if (!enabled || !organizationId || !targetDate) {
      setReturCallplans([]);
      setReturSourceError(null);
      return [];
    }

    setIsReturSourceLoading(true);
    setReturSourceError(null);
    try {
      const data = await callplanService.getReturReport(targetDate);
      setReturCallplans(data);
      return data;
    } catch (error) {
      console.error("Gagal fetch report retur:", error);
      setReturCallplans([]);
      setReturSourceError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data Form Retur",
      );
      throw error;
    } finally {
      setIsReturSourceLoading(false);
    }
  }, [enabled, organizationId, targetDate]);

  useEffect(() => {
    if (!enabled || !organizationId || !targetDate) {
      setReturCallplans([]);
      setReturSourceError(null);
      return;
    }

    let cancelled = false;

    const fetchRetur = async () => {
      setIsReturSourceLoading(true);
      setReturSourceError(null);
      try {
        const data = await callplanService.getReturReport(targetDate);
        if (!cancelled) setReturCallplans(data);
      } catch (error) {
        console.error("Gagal fetch report retur:", error);
        if (!cancelled) {
          setReturCallplans([]);
          setReturSourceError(
            error instanceof Error
              ? error.message
              : "Gagal mengambil data Form Retur",
          );
        }
      } finally {
        if (!cancelled) setIsReturSourceLoading(false);
      }
    };

    fetchRetur();
    return () => {
      cancelled = true;
    };
  }, [organizationId, targetDate, enabled]);

  const { enrichedData: returEnrichedData } = useGoodPrepEnrichedData({
    prepCallplans: returCallplans,
    btbData,
  });

  return {
    returCallplans,
    returEnrichedData,
    isReturSourceLoading,
    returSourceError,
    refetchReturSource,
  };
};
