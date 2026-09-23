import { useCallback, useEffect, useMemo, useState } from "react";
import { realTimeSOHService } from "../../../../API/services/outbound-salesman/RealTimeSOH";
import { onHandLocatorService } from "../../../../API/services/outbound-salesman/OnHandLocatorService";
import {
  mergeSohVsCanvas,
  summarizeSohVsCanvas,
  type SohVsCanvasRow,
  type SohVsCanvasSummary,
} from "./mergeSohVsCanvas";

export type UseCanvasVsGitDataParams = {
  organizationCode: string;
  enabled?: boolean;
};

export const useCanvasVsGitData = ({
  organizationCode,
  enabled = true,
}: UseCanvasVsGitDataParams) => {
  const [rows, setRows] = useState<SohVsCanvasRow[]>([]);
  const [sohCount, setSohCount] = useState(0);
  const [canvasCount, setCanvasCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const org = String(organizationCode || "").trim();
    if (!org) {
      setRows([]);
      setSohCount(0);
      setCanvasCount(0);
      setError("organization_code cabang tidak ditemukan");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [sohSettled, canvasSettled] = await Promise.allSettled([
        realTimeSOHService.getRealTimeSOH({ organization_code: org }),
        onHandLocatorService.getOnHandLocator({
          organization_code: org,
          subinventory_code: "CANVAS",
          locator: "GIT",
        }),
      ]);

      const sohItems =
        sohSettled.status === "fulfilled" ? sohSettled.value.data : [];
      const canvasItems =
        canvasSettled.status === "fulfilled" ? canvasSettled.value.data : [];

      setSohCount(sohItems.length);
      setCanvasCount(canvasItems.length);
      setRows(mergeSohVsCanvas(sohItems, canvasItems));
      setFetchedAt(new Date().toISOString());

      const errors: string[] = [];
      if (sohSettled.status === "rejected") {
        errors.push(
          `SOH Meta: ${
            sohSettled.reason instanceof Error
              ? sohSettled.reason.message
              : "gagal"
          }`,
        );
      }
      if (canvasSettled.status === "rejected") {
        errors.push(
          `Canvas GIT: ${
            canvasSettled.reason instanceof Error
              ? canvasSettled.reason.message
              : "gagal"
          }`,
        );
      }
      if (errors.length) setError(errors.join(" · "));
    } catch (err) {
      console.error("Gagal load SOH vs Canvas GIT:", err);
      setRows([]);
      setSohCount(0);
      setCanvasCount(0);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data SOH vs Canvas GIT",
      );
    } finally {
      setIsLoading(false);
    }
  }, [organizationCode]);

  useEffect(() => {
    if (!enabled || !organizationCode) return;
    void refetch();
  }, [enabled, organizationCode, refetch]);

  const summary: SohVsCanvasSummary = useMemo(
    () => summarizeSohVsCanvas(rows),
    [rows],
  );

  return {
    rows,
    summary,
    sohCount,
    canvasCount,
    isLoading,
    error,
    fetchedAt,
    refetch,
  };
};
