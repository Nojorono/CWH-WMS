import { useCallback, useEffect, useState } from "react";
import {
  GetRealTimeSOHParams,
  RealTimeSOHItem,
  RealTimeSOHMeta,
  realTimeSOHService,
} from "../Services/RealTimeSOH";

/**
 * Hook Realtime SOH via /outbound-sales/on-hand-meta
 */
export const useRealTimeSOH = (
  params: GetRealTimeSOHParams | null,
  options?: { enabled?: boolean },
) => {
  const enabled = options?.enabled !== false;
  const organizationCode =
    params?.organization_code || params?.organization_name || "";
  const [data, setData] = useState<RealTimeSOHItem[]>([]);
  const [meta, setMeta] = useState<RealTimeSOHMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!organizationCode) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await realTimeSOHService.getRealTimeSOH({
        organization_code: organizationCode,
      });
      setData(result.data);
      setMeta(result.meta);
    } catch (err) {
      console.error("Gagal fetch Realtime SOH:", err);
      setData([]);
      setMeta(null);
      setError(
        err instanceof Error ? err.message : "Gagal mengambil Realtime SOH",
      );
    } finally {
      setIsLoading(false);
    }
  }, [organizationCode]);

  useEffect(() => {
    if (!enabled || !organizationCode) return;
    refetch();
  }, [enabled, organizationCode, refetch]);

  return { data, meta, isLoading, error, refetch };
};
