import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useOutboundSalesmanCache } from "../../../../../API/store/OutboundSalesmanStore/useOutboundSalesmanCache";
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

  /** Setelah aksi mutasi — selalu force agar data FINAL terbaru */
  const refetchPrepCallplans = async (): Promise<Callplan[]> => {
    if (!organizationId || !targetDate) return prepCallplans;
    const fresh = await useOutboundSalesmanCache.getState().getCallplans(
      {
        dateStart: targetDate,
        organizationId,
        status: "FINAL",
      },
      { force: true },
    );
    setPrepCallplans(fresh);
    onCallplansUpdated?.(fresh);
    return fresh;
  };

  /** Patch lokal segera setelah Adjust — Form Tambahan/Retur update tanpa tunggu refetch */
  const applyLocalDetailPatch = (
    callplanId: string,
    lines: Array<{
      id: string;
      item_qty_revision: number;
      item_qty_final: number;
    }>,
  ) => {
    const lineMap = new Map(lines.map((line) => [String(line.id), line]));
    setPrepCallplans((prev) => {
      const next = prev.map((cp) => {
        if (cp.id !== callplanId) return cp;
        return {
          ...cp,
          details: (cp.details || []).map((detail) => {
            const upd = lineMap.get(String(detail.id));
            if (!upd) return detail;
            return {
              ...detail,
              item_qty_revision: String(upd.item_qty_revision),
              item_qty_final: String(upd.item_qty_final),
            };
          }),
        };
      });
      onCallplansUpdated?.(next);
      return next;
    });
  };

  return {
    prepCallplans,
    targetDate,
    btbDateLabel,
    salesNikList,
    refetchPrepCallplans,
    applyLocalDetailPatch,
  };
};
