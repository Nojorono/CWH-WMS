import { useEffect, useState } from "react";
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
 * Sumber khusus Form Retur:
 * Get All SPB by date + org → filter status FINAL | VOID → enrich BTB.
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

  useEffect(() => {
    if (!enabled || !organizationId || !targetDate) {
      setReturCallplans([]);
      setReturSourceError(null);
      return;
    }

    let cancelled = false;

    const fetchAll = async () => {
      setIsReturSourceLoading(true);
      setReturSourceError(null);
      try {
        const data = await callplanService.getAllCallplansByDateOrg({
          dateStart: targetDate,
          organizationId,
        });
        // Form Retur: hanya FINAL + VOID
        const filtered = data.filter((cp) => {
          const status = String(cp.status || "").toUpperCase();
          return status === "FINAL" || status === "VOID";
        });
        if (!cancelled) setReturCallplans(filtered);
      } catch (error) {
        console.error("Gagal fetch Get All SPB untuk Form Retur:", error);
        if (!cancelled) {
          setReturCallplans([]);
          setReturSourceError(
            error instanceof Error
              ? error.message
              : "Gagal mengambil data SPB untuk Form Retur",
          );
        }
      } finally {
        if (!cancelled) setIsReturSourceLoading(false);
      }
    };

    fetchAll();
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
  };
};
