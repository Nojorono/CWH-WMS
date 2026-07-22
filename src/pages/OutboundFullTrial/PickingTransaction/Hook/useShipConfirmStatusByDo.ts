import { useCallback, useState } from "react";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../../utils/EndPoint";
import { OutboundDo } from "../Helper/doTypes";

const isShipConfirmSuccessStatus = (status?: string | null) =>
  status === "S" || status === "SUCCESS";

/**
 * Cek apakah Outbound DO sudah Ship Confirm
 * via GET /outbound-integration-deliveries/outbound-do/:id
 */
export const fetchShipConfirmStatusByDoId = async (
  outboundDoId: string,
): Promise<boolean> => {
  try {
    const response = await axiosInstance.get(
      `${EndPoint}outbound-integration-deliveries/outbound-do/${outboundDoId}`,
    );

    const rows = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
        ? response.data
        : [];

    if (!rows.length) return false;

    // Semua line harus punya ship_confirm_status success
    return rows.every((row: any) =>
      isShipConfirmSuccessStatus(row?.ship_confirm_status),
    );
  } catch {
    return false;
  }
};

export const useShipConfirmStatusByDo = () => {
  const [shipConfirmStatusMap, setShipConfirmStatusMap] = useState<
    Record<string, boolean>
  >({});
  const [isLoadingShipConfirmStatus, setIsLoadingShipConfirmStatus] =
    useState(false);

  const checkShipConfirmByDoId = useCallback(async (outboundDoId: string) => {
    const isDone = await fetchShipConfirmStatusByDoId(outboundDoId);
    setShipConfirmStatusMap((prev) => ({
      ...prev,
      [outboundDoId]: isDone,
    }));
    return isDone;
  }, []);

  const syncShipConfirmStatuses = useCallback(async (dos: OutboundDo[]) => {
    const amoDos = dos.filter((d) => d.outbound_type === "AMO");
    if (amoDos.length === 0) return;

    setIsLoadingShipConfirmStatus(true);
    try {
      const entries = await Promise.all(
        amoDos.map(async (d) => {
          const isDone = await fetchShipConfirmStatusByDoId(d.id);
          return [d.id, isDone] as const;
        }),
      );

      setShipConfirmStatusMap((prev) => ({
        ...prev,
        ...Object.fromEntries(entries),
      }));
    } finally {
      setIsLoadingShipConfirmStatus(false);
    }
  }, []);

  const markShipConfirmDone = useCallback((outboundDoId: string) => {
    setShipConfirmStatusMap((prev) => ({
      ...prev,
      [outboundDoId]: true,
    }));
  }, []);

  return {
    shipConfirmStatusMap,
    isLoadingShipConfirmStatus,
    checkShipConfirmByDoId,
    syncShipConfirmStatuses,
    markShipConfirmDone,
  };
};
