import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    const fetchBTB = async () => {
      setIsBTBLoading(true);
      setErrBTB(null);
      setIsBTBSuccess(false);

      try {
        const result = await btbService.getBTBLastDateInsert();
        // Label tanggal dari response API (bukan tanggal callplan/SPB)
        setBtbLastDateLabel(getLatestBtbDateLabel(result.data));

        // Filter cabang saja — matching sales_nik dilakukan saat enrich per SPB
        const filtered = result.data.filter(
          (row) =>
            matchesBtbOrganization(row, organizationId) ||
            matchesBtbOrganization(row, organizationCode),
        );

        setBtbData(normalizeBtbForGoodPrep(filtered));
        setIsBTBSuccess(true);
      } catch (error) {
        console.error("Gagal fetch BTB (last-date-insert):", error);
        const message =
          error instanceof Error ? error.message : "Gagal mengambil data BTB";
        setErrBTB(message);
        setBtbData([]);
        setBtbLastDateLabel(null);
        setIsBTBSuccess(false);
        showErrorToast(message);
      } finally {
        setIsBTBLoading(false);
      }
    };

    fetchBTB();
  }, [organizationId, organizationCode]);

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
  const isPrintDisabled = useMemo(
    () => !isBTBSuccess || isBTBEmpty,
    [isBTBSuccess, isBTBEmpty],
  );

  return {
    btbData,
    isBTBLoading,
    isBTBSuccess,
    errBTB,
    showLoading,
    isBTBEmpty,
    isPrintDisabled,
    btbLastDateLabel,
  };
};
