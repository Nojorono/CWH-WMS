import { useEffect, useState } from "react";
import { callplanService } from "../../../Services/CallplanService";
import { Callplan } from "../../../types/CallplanTypes";
import { BTB } from "../../../types/BTBtypes";
import { useGoodPrepEnrichedData } from "./useGoodPrepEnrichedData";

type UseGoodPrepReturSourceParams = {
  organizationId: string;
  targetDate: string;
  btbData: BTB[];
  /** Skip fetch saat BTB belum siap / loading */
  enabled?: boolean;
};

const getCallplanDocKey = (cp: Callplan) => {
  const key =
    String(cp.callplan_number || "").trim() ||
    String(cp.spb_number || "").trim() ||
    String(cp.id || "").trim();
  return key.toUpperCase();
};

/** VOID dianggap valid untuk menang jika minimal 1 line punya item_qty_void > 0 */
const hasVoidQtyValue = (cp: Callplan) =>
  (cp.details || []).some((d) => {
    const raw = Number(
      (d as { item_qty_void?: string | null }).item_qty_void,
    );
    return !Number.isNaN(raw) && Math.abs(raw) > 0;
  });

const statusPriority = (cp: Callplan) => {
  const s = String(cp.status || "").toUpperCase();
  // VOID menang atas FINAL HANYA jika qty void ada value
  if (s === "VOID" && hasVoidQtyValue(cp)) return 2;
  if (s === "VOID") return 0; // VOID tanpa qty void → kalah dari FINAL
  if (s === "FINAL") return 1;
  return 0;
};

/**
 * 1 nomor Callplan/SPB hanya 1 dokumen.
 * Jika muncul ganda (FINAL + VOID / duplikat):
 * VOID menang hanya bila item_qty_void ada value; selain itu FINAL.
 */
const dedupeCallplansByNumber = (rows: Callplan[]): Callplan[] => {
  const map = new Map<string, Callplan>();

  rows.forEach((cp) => {
    const key = getCallplanDocKey(cp);
    if (!key) return;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, cp);
      return;
    }

    const nextPriority = statusPriority(cp);
    const prevPriority = statusPriority(existing);
    if (nextPriority > prevPriority) {
      map.set(key, cp);
      return;
    }
    if (nextPriority < prevPriority) return;

    // Status sama → ambil yang updatedAt lebih baru
    const nextUpdated = Date.parse(String(cp.updatedAt || "")) || 0;
    const prevUpdated = Date.parse(String(existing.updatedAt || "")) || 0;
    if (nextUpdated >= prevUpdated) map.set(key, cp);
  });

  return Array.from(map.values());
};

/**
 * Sumber khusus Form Retur:
 * Get All SPB by date + org → filter status FINAL | VOID →
 * dedupe per nomor Callplan → enrich BTB.
 */
export const useGoodPrepReturSource = ({
  organizationId,
  targetDate,
  btbData,
  enabled = true,
}: UseGoodPrepReturSourceParams) => {
  const [returCallplans, setReturCallplans] = useState<Callplan[]>([]);
  const [isReturSourceLoading, setIsReturSourceLoading] = useState(false);
  const [returSourceError, setReturSourceError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !organizationId || !targetDate) {
      setReturCallplans([]);
      setReturSourceError(null);
      return;
    }

    let cancelled = false;

    const fetchAll = async () => {
      setIsReturSourceLoading(true);
      setReturSourceError(null);
      try {
        const data = await callplanService.getAllCallplansByDateOrg({
          dateStart: targetDate,
          organizationId,
        });
        // Form Retur: hanya FINAL + VOID, lalu dedupe per nomor Callplan/SPB
        const filtered = data.filter((cp) => {
          const status = String(cp.status || "").toUpperCase();
          return status === "FINAL" || status === "VOID";
        });
        const deduped = dedupeCallplansByNumber(filtered);
        if (!cancelled) setReturCallplans(deduped);
      } catch (error) {
        console.error("Gagal fetch Get All SPB untuk Form Retur:", error);
        if (!cancelled) {
          setReturCallplans([]);
          setReturSourceError(
            error instanceof Error
              ? error.message
              : "Gagal mengambil data SPB untuk Form Retur",
          );
        }
      } finally {
        if (!cancelled) setIsReturSourceLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [organizationId, targetDate, enabled]);

  const { enrichedData: returEnrichedData } = useGoodPrepEnrichedData({
    prepCallplans: returCallplans,
    btbData,
  });

  return {
    returCallplans,
    returEnrichedData,
    isReturSourceLoading,
    returSourceError,
  };
};
