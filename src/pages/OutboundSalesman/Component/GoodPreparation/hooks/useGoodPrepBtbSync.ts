import { useEffect, useMemo, useState } from "react";
import { showErrorToast } from "../../../../../components/toast";
import { btbService } from "../../../Services/BTBService";
import { BTB } from "../../../types/BTBtypes";

type UseGoodPrepBtbSyncParams = {
  salesNikList: string[];
  targetDate: string;
  organizationId?: string;
};

export const useGoodPrepBtbSync = ({
  salesNikList,
  targetDate,
  organizationId,
}: UseGoodPrepBtbSyncParams) => {
  const [btbData, setBtbData] = useState<BTB[]>([]);
  const [isBTBLoading, setIsBTBLoading] = useState(false);
  const [isBTBSuccess, setIsBTBSuccess] = useState(false);
  const [errBTB, setErrBTB] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const fetchBTB = async () => {
      if (!salesNikList.length || !targetDate) {
        setBtbData([]);
        setIsBTBSuccess(false);
        return;
      }

      setIsBTBLoading(true);
      setErrBTB(null);
      setIsBTBSuccess(false);

      try {
        const results = await Promise.all(
          salesNikList.map((sales_nik) =>
            btbService.getBTB({
              page: 1,
              limit: 100,
              sortOrder: "DESC",
              sales_nik,
              organization_id: organizationId || undefined,
              date_from: targetDate,
              date_to: targetDate,
            }),
          ),
        );

        const merged = results.flatMap((r) => r.data);
        setBtbData(merged);
        setIsBTBSuccess(true);
      } catch (error) {
        console.error("Gagal fetch BTB:", error);
        const message =
          error instanceof Error ? error.message : "Gagal mengambil data BTB";
        setErrBTB(message);
        setBtbData([]);
        setIsBTBSuccess(false);
        showErrorToast(message);
      } finally {
        setIsBTBLoading(false);
      }
    };

    fetchBTB();
  }, [salesNikList, targetDate, organizationId]);

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
  };
};
