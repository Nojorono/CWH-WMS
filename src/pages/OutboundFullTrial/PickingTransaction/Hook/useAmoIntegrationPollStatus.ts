import { useCallback, useState } from "react";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../../utils/EndPoint";
import {
  AmoIntegrationPollData,
  getPollTransactionTypes,
} from "../types/amoIntegrationPollTypes";
import { OutboundDo } from "../Helper/doTypes";

export const fetchAmoIntegrationPollStatus = async (
  outboundDoId: string,
  transactionType: string,
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

const mergePollResults = (
  outboundDoId: string,
  results: AmoIntegrationPollData[],
): AmoIntegrationPollData => {
  const sourceHeaders = results.flatMap((r) => r.source_headers ?? []);
  const deliveries = results.flatMap(
    (r) => r.outbound_integration_deliveries ?? [],
  );
  const hasError = results.some((r) => r.has_error);
  const firstWithStatus = results.find((r) => r.status);
  const reason =
    results.find((r) => r.reason)?.reason ??
    results.find((r) => r.has_error)?.reason ??
    null;

  return {
    status: hasError ? "E" : firstWithStatus?.status ?? "S",
    reason,
    outbound_do_id: outboundDoId,
    deliveries_updated: results.reduce(
      (sum, r) => sum + (r.deliveries_updated ?? 0),
      0,
    ),
    has_error: hasError,
    source_headers: sourceHeaders,
    outbound_integration_deliveries: deliveries,
  };
};

export const useAmoIntegrationPollStatus = () => {
  const [pollMap, setPollMap] = useState<
    Record<string, AmoIntegrationPollData | null>
  >({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  const pollByOutboundDoId = useCallback(
    async (outboundDoId: string, outboundType?: string | null) => {
      const transactionTypes = getPollTransactionTypes(outboundType);
      if (transactionTypes.length === 0) {
        setErrorMap((prev) => ({
          ...prev,
          [outboundDoId]: "Tipe outbound tidak didukung untuk poll integrasi",
        }));
        return null;
      }

      setLoadingMap((prev) => ({ ...prev, [outboundDoId]: true }));
      try {
        const results = await Promise.all(
          transactionTypes.map((transactionType) =>
            fetchAmoIntegrationPollStatus(outboundDoId, transactionType),
          ),
        );
        const data =
          results.length === 1
            ? results[0]
            : mergePollResults(outboundDoId, results);

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
      const pollableDos = dos.filter(
        (d) =>
          d.outbound_type === "AMO" || d.outbound_type === "SUBDIST",
      );
      if (pollableDos.length === 0) return;

      await Promise.all(
        pollableDos.map((d) => pollByOutboundDoId(d.id, d.outbound_type)),
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
