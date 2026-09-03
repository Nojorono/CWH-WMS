import { useCallback, useEffect, useMemo, useState } from "react";
import { showErrorToast } from "../../../../../components/toast";
import { btbService } from "../../../Services/BTBService";
import { BTB } from "../../../types/BTBtypes";
import {
  getLatestBtbDateLabel,
  matchesBtbOrganization,
  normalizeBtbForGoodPrep,
} from "../utils/normalizeBtbForGoodPrep";

type UseGoodPrepBtbSyncParams = {
  /** Prefer UUID org dari callplan; boleh juga code/name — matching longgar */
  organizationId?: string;
  organizationCode?: string;
};

export const useGoodPrepBtbSync = ({
  organizationId,
  organizationCode,
}: UseGoodPrepBtbSyncParams) => {
  const [btbData, setBtbData] = useState<BTB[]>([]);
  const [isBTBLoading, setIsBTBLoading] = useState(false);
  const [isBTBSuccess, setIsBTBSuccess] = useState(false);
  const [errBTB, setErrBTB] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(true);
  const [btbLastDateLabel, setBtbLastDateLabel] = useState<string | null>(null);

  const refetchBtb = useCallback(async (options?: { silent?: boolean }) => {
    const silent = Boolean(options?.silent);
    if (!silent) {
      setIsBTBLoading(true);
      setIsBTBSuccess(false);
    }
    setErrBTB(null);

    try {
      const result = await btbService.getBTBLastDateInsert();
      setBtbLastDateLabel(getLatestBtbDateLabel(result.data));

      const filtered = result.data.filter(
        (row) =>
          matchesBtbOrganization(row, organizationId) ||
          matchesBtbOrganization(row, organizationCode),
      );

      const normalized = normalizeBtbForGoodPrep(filtered);
      setBtbData(normalized);
      setIsBTBSuccess(true);
      return normalized;
    } catch (error) {
      console.error("Gagal fetch BTB (last-date-insert):", error);
      const message =
        error instanceof Error ? error.message : "Gagal mengambil data BTB";
      setErrBTB(message);
      if (!silent) {
        setBtbData([]);
        setBtbLastDateLabel(null);
        setIsBTBSuccess(false);
      }
      showErrorToast(message);
      throw error;
    } finally {
      if (!silent) setIsBTBLoading(false);
    }
  }, [organizationId, organizationCode]);

  useEffect(() => {
    void refetchBtb().catch(() => {
      // toast sudah di refetchBtb
    });
  }, [refetchBtb]);

  useEffect(() => {
    if (isBTBLoading) {
      setShowLoading(true);
      return;
    }
    const timer = setTimeout(() => setShowLoading(false), 300);
    return () => clearTimeout(timer);
  }, [isBTBLoading]);

  const isBTBEmpty = useMemo(
    () => isBTBSuccess && btbData.length === 0,
    [isBTBSuccess, btbData.length],
  );
  // BTB kosong / belum ada tidak mengunci action — hitungan pakai qty_btb = 0
  const isPrintDisabled = false;

  return {
    btbData,
    isBTBLoading,
    isBTBSuccess,
    errBTB,
    showLoading,
    isBTBEmpty,
    isPrintDisabled,
    btbLastDateLabel,
    refetchBtb,
  };
};
