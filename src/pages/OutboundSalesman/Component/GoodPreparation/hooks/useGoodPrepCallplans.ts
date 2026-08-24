import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { callplanService } from "../../../Services/CallplanService";
import { Callplan } from "../../../types/CallplanTypes";

type UseGoodPrepCallplansParams = {
  callplans: Callplan[];
  organizationId: string;
  onCallplansUpdated?: (fresh: Callplan[]) => void;
};

export const useGoodPrepCallplans = ({
  callplans,
  organizationId,
  onCallplansUpdated,
}: UseGoodPrepCallplansParams) => {
  const [prepCallplans, setPrepCallplans] = useState<Callplan[]>(callplans);

  useEffect(() => {
    setPrepCallplans(callplans);
  }, [callplans]);

  const targetDate = useMemo(() => {
    return (
      prepCallplans[0]?.callplan_date_start || dayjs().format("YYYY-MM-DD")
    );
  }, [prepCallplans]);

  const btbDateLabel = useMemo(
    () => dayjs(targetDate).format("YYYY-MM-DD"),
    [targetDate],
  );

  const salesNikList = useMemo(() => {
    return [
      ...new Set(
        prepCallplans
          .map((cp) => cp.sales_nik?.trim())
          .filter((nik): nik is string => Boolean(nik)),
      ),
    ];
  }, [prepCallplans]);

  const refetchPrepCallplans = async (): Promise<Callplan[]> => {
    if (!organizationId || !targetDate) return prepCallplans;
    const fresh = await callplanService.getCallplans({
      dateStart: targetDate,
      organizationId,
      status: "FINAL",
    });
    setPrepCallplans(fresh);
    onCallplansUpdated?.(fresh);
    return fresh;
  };

  return {
    prepCallplans,
    targetDate,
    btbDateLabel,
    salesNikList,
    refetchPrepCallplans,
  };
};
