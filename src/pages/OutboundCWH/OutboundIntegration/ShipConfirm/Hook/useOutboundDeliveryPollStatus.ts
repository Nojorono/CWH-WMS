import { useCallback, useState } from "react";
import axiosInstance from "../../../../../DynamicAPI/AxiosInstance";
import { showErrorToast } from "../../../../../components/toast";
import {
  AMO_MUTASI_TRANSACTION_TYPE,
  SUBDIST_PICK_RELEASE_TRANSACTION_TYPE,
  SUBDIST_SHIP_CONFIRM_TRANSACTION_TYPE,
  getPollTransactionTypes,
} from "../../../PickingTransaction/types/amoIntegrationPollTypes";
import { ShipConfirmPollResult } from "../component/ShipConfirmRowDetail";

export type OutboundPollType = "AMO" | "SUBDIST";

export {
  AMO_MUTASI_TRANSACTION_TYPE,
  SUBDIST_PICK_RELEASE_TRANSACTION_TYPE,
  SUBDIST_SHIP_CONFIRM_TRANSACTION_TYPE,
  getPollTransactionTypes,
};

export const buildDeliveryPollKey = (
  outboundDoId: string,
  transactionType: string,
) => `${outboundDoId}::${transactionType}`;

export const resolveOutboundTypeFromTransactionType = (
  transactionType?: string | null,
): OutboundPollType | null => {
  if (!transactionType) return null;
  if (transactionType === AMO_MUTASI_TRANSACTION_TYPE) return "AMO";
  if (
    transactionType === SUBDIST_PICK_RELEASE_TRANSACTION_TYPE ||
    transactionType === SUBDIST_SHIP_CONFIRM_TRANSACTION_TYPE
  ) {
    return "SUBDIST";
  }
  return null;
};

export const getPollButtonLabel = (
  transactionType?: string | null,
  isPolling = false,
): string => {
  if (isPolling) return "Polling...";
  if (transactionType === SUBDIST_PICK_RELEASE_TRANSACTION_TYPE) {
    return "Poll Subdist Pick Release";
  }
  if (transactionType === SUBDIST_SHIP_CONFIRM_TRANSACTION_TYPE) {
    return "Poll Subdist Shipconfirm";
  }
  // Default / AMO Mutasi Internal
  return "Poll Mutasi Internal";
};

export const normalizeDeliveryPollPayload = (
  payload: any,
  transactionType?: string,
): ShipConfirmPollResult => {
  const data =
    payload?.data?.status || payload?.data?.source_headers
      ? payload.data
      : payload?.data?.data?.status || payload?.data?.data?.source_headers
        ? payload.data.data
        : (payload?.data ?? payload ?? {});

  const sourceHeaders = Array.isArray(data?.source_headers)
    ? data.source_headers
    : Array.isArray(payload?.source_headers)
      ? payload.source_headers
      : Array.isArray(payload?.data?.source_headers)
        ? payload.data.source_headers
        : [];

  return {
    status: data.status ?? null,
    reason: data.reason ?? payload?.message ?? null,
    outbound_do_id: data.outbound_do_id ?? null,
    deliveries_updated: data.deliveries_updated ?? null,
    has_error: Boolean(data.has_error),
    transaction_type: transactionType ?? data.transaction_type ?? null,
    source_headers: sourceHeaders.map((header: any) => ({
      source_header_id: header.source_header_id ?? null,
      outbound_memo_id: header.outbound_memo_id ?? null,
      status: header.status ?? null,
      reason: header.reason ?? null,
      delivery_count: header.delivery_count ?? null,
    })),
  };
};

const mergeDeliveryPollResults = (
  outboundDoId: string,
  results: ShipConfirmPollResult[],
): ShipConfirmPollResult => {
  const hasError = results.some((r) => r.has_error);
  const firstWithStatus = results.find((r) => r.status);
  const reason =
    results.find((r) => r.has_error)?.reason ??
    results.find((r) => r.reason)?.reason ??
    null;

  return {
    status: hasError
      ? "ERROR"
      : firstWithStatus?.status ?? results[0]?.status ?? null,
    reason,
    outbound_do_id: outboundDoId,
    deliveries_updated: results.reduce(
      (sum, r) => sum + (r.deliveries_updated ?? 0),
      0,
    ),
    has_error: hasError,
    source_headers: results.flatMap((r) => r.source_headers ?? []),
    by_transaction_type: results,
  };
};

type PollOptions = {
  outboundDoId: string;
  /** Poll berdasarkan tipe outbound (AMO / SUBDIST) */
  outboundType?: OutboundPollType | string | null;
  /** Poll satu transaction_type spesifik (mis. dari log row) */
  transactionType?: string | null;
  /** Optional override list transaction_type */
  transactionTypes?: string[];
};

type UseOutboundDeliveryPollStatusOptions = {
  onSuccess?: () => void | Promise<void>;
};

export const useOutboundDeliveryPollStatus = (
  options: UseOutboundDeliveryPollStatusOptions = {},
) => {
  const { onSuccess } = options;
  const [pollingMap, setPollingMap] = useState<Record<string, boolean>>({});
  const [pollResultMap, setPollResultMap] = useState<
    Record<string, ShipConfirmPollResult>
  >({});

  const isPollingKey = useCallback(
    (key: string) => Boolean(pollingMap[key]),
    [pollingMap],
  );

  const isPollingDo = useCallback(
    (outboundDoId: string) =>
      Object.entries(pollingMap).some(
        ([key, loading]) => key.startsWith(`${outboundDoId}::`) && loading,
      ),
    [pollingMap],
  );

  const pollTransactionTypes = useCallback(
    async (
      outboundDoId: string,
      transactionTypes: string[],
    ): Promise<ShipConfirmPollResult | null> => {
      if (!outboundDoId) {
        showErrorToast("Outbound DO ID tidak ditemukan.");
        return null;
      }
      if (!transactionTypes.length) {
        showErrorToast("Tipe outbound / transaction_type tidak valid untuk poll.");
        return null;
      }

      const loadingKeys = transactionTypes.map((tx) =>
        buildDeliveryPollKey(outboundDoId, tx),
      );
      const aggregateKey = buildDeliveryPollKey(
        outboundDoId,
        transactionTypes.join("|"),
      );

      setPollingMap((prev) => {
        const next = { ...prev };
        loadingKeys.forEach((key) => {
          next[key] = true;
        });
        next[aggregateKey] = true;
        next[outboundDoId] = true;
        return next;
      });

      try {
        const settled = await Promise.all(
          transactionTypes.map(async (transactionType) => {
            const response = await axiosInstance.get(
              `outbound-integration-deliveries/poll-status/outbound-do/${outboundDoId}`,
              { params: { transaction_type: transactionType } },
            );
            return normalizeDeliveryPollPayload(response?.data, transactionType);
          }),
        );

        const merged =
          settled.length === 1
            ? settled[0]
            : mergeDeliveryPollResults(outboundDoId, settled);

        setPollResultMap((prev) => {
          const next = { ...prev };
          settled.forEach((result, index) => {
            const tx = transactionTypes[index];
            next[buildDeliveryPollKey(outboundDoId, tx)] = result;
          });
          next[aggregateKey] = merged;
          next[outboundDoId] = merged;
          return next;
        });

        if (onSuccess) {
          await onSuccess();
        }

        return merged;
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Gagal poll status outbound integration.";
        showErrorToast(msg);

        const errorResult: ShipConfirmPollResult = {
          status: "ERROR",
          has_error: true,
          error: msg,
          reason: msg,
          outbound_do_id: outboundDoId,
        };

        setPollResultMap((prev) => {
          const next = { ...prev, [outboundDoId]: errorResult, [aggregateKey]: errorResult };
          transactionTypes.forEach((tx) => {
            next[buildDeliveryPollKey(outboundDoId, tx)] = {
              ...errorResult,
              transaction_type: tx,
            };
          });
          return next;
        });

        return null;
      } finally {
        setPollingMap((prev) => {
          const next = { ...prev };
          loadingKeys.forEach((key) => {
            next[key] = false;
          });
          next[aggregateKey] = false;
          next[outboundDoId] = false;
          return next;
        });
      }
    },
    [onSuccess],
  );

  /**
   * Poll sesuai tipe outbound:
   * - AMO → Outbound GS Mutasi SO Internal
   * - SUBDIST → Pick Release + Ship Confirm
   */
  const pollByOutboundType = useCallback(
    async (
      outboundDoId: string,
      outboundType?: OutboundPollType | string | null,
    ) => {
      const types = getPollTransactionTypes(outboundType);
      return pollTransactionTypes(outboundDoId, types);
    },
    [pollTransactionTypes],
  );

  /** Poll satu transaction_type (untuk baris log spesifik) */
  const pollByTransactionType = useCallback(
    async (outboundDoId: string, transactionType: string) => {
      return pollTransactionTypes(outboundDoId, [transactionType]);
    },
    [pollTransactionTypes],
  );

  /**
   * Entry utama: prioritaskan transactionTypes → transactionType → outboundType.
   * Jika hanya transactionType dikirim, tetap bisa diinfer outbound type-nya.
   */
  const pollStatus = useCallback(
    async ({
      outboundDoId,
      outboundType,
      transactionType,
      transactionTypes,
    }: PollOptions) => {
      if (transactionTypes?.length) {
        return pollTransactionTypes(outboundDoId, transactionTypes);
      }

      if (transactionType) {
        return pollByTransactionType(outboundDoId, transactionType);
      }

      if (outboundType) {
        return pollByOutboundType(outboundDoId, outboundType);
      }

      showErrorToast("outboundType atau transactionType wajib diisi untuk poll.");
      return null;
    },
    [pollByOutboundType, pollByTransactionType, pollTransactionTypes],
  );

  const getPollResult = useCallback(
    (outboundDoId?: string, transactionType?: string | null) => {
      if (!outboundDoId) return undefined;
      if (transactionType) {
        return (
          pollResultMap[buildDeliveryPollKey(outboundDoId, transactionType)] ||
          pollResultMap[outboundDoId]
        );
      }
      return pollResultMap[outboundDoId];
    },
    [pollResultMap],
  );

  return {
    pollingMap,
    pollResultMap,
    isPollingKey,
    isPollingDo,
    pollStatus,
    pollByOutboundType,
    pollByTransactionType,
    pollTransactionTypes,
    getPollResult,
    buildDeliveryPollKey,
  };
};
