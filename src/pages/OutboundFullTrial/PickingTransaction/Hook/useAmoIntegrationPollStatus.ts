import { useCallback, useState } from "react";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../../utils/EndPoint";
import {
  AMO_MUTASI_TRANSACTION_TYPE,
  AmoIntegrationPollData,
} from "../types/amoIntegrationPollTypes";
import { OutboundDo } from "../Helper/doTypes";

export const fetchAmoIntegrationPollStatus = async (
  outboundDoId: string,
  transactionType: string = AMO_MUTASI_TRANSACTION_TYPE,
): Promise<AmoIntegrationPollData> => {
  const response = await axiosInstance.get(
    `${EndPoint}outbound-integration-deliveries/poll-status/outbound-do/${outboundDoId}`,
    {
      params: { transaction_type: transactionType },
    },
  );

  const payload = response.data?.data ?? response.data;
  if (!payload) {
    throw new Error("Response poll status kosong");
  }

  return payload as AmoIntegrationPollData;
};

export const useAmoIntegrationPollStatus = () => {
  const [pollMap, setPollMap] = useState<
    Record<string, AmoIntegrationPollData | null>
  >({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  const pollByOutboundDoId = useCallback(
    async (
      outboundDoId: string,
      transactionType: string = AMO_MUTASI_TRANSACTION_TYPE,
    ) => {
      setLoadingMap((prev) => ({ ...prev, [outboundDoId]: true }));
      try {
        const data = await fetchAmoIntegrationPollStatus(
          outboundDoId,
          transactionType,
        );
        setPollMap((prev) => ({ ...prev, [outboundDoId]: data }));
        setErrorMap((prev) => ({ ...prev, [outboundDoId]: null }));
        return data;
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Gagal memeriksa status integrasi";
        setErrorMap((prev) => ({ ...prev, [outboundDoId]: message }));
        setPollMap((prev) => ({ ...prev, [outboundDoId]: null }));
        return null;
      } finally {
        setLoadingMap((prev) => ({ ...prev, [outboundDoId]: false }));
      }
    },
    [],
  );

  const syncAmoPollStatuses = useCallback(
    async (dos: OutboundDo[]) => {
      const amoDos = dos.filter((d) => d.outbound_type === "AMO");
      if (amoDos.length === 0) return;

      await Promise.all(
        amoDos.map((d) => pollByOutboundDoId(d.id, AMO_MUTASI_TRANSACTION_TYPE)),
      );
    },
    [pollByOutboundDoId],
  );

  return {
    pollMap,
    loadingMap,
    errorMap,
    pollByOutboundDoId,
    syncAmoPollStatuses,
  };
};
