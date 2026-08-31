import dayjs from "dayjs";
import { BTB, BTBDetail } from "../../types/BTBtypes";

/** Cocokkan org user/callplan ke field org di BTB (UUID / code / name). */
export const matchesBtbOrganization = (
  row: BTB,
  organizationKey?: string,
): boolean => {
  if (!organizationKey) return true;
  const key = String(organizationKey).trim().toLowerCase();
  if (!key) return true;

  const candidates = [
    row.organization_id,
    row.organization_code,
    row.organization?.id,
    row.organization?.organization_id,
    row.organization?.organization_code,
    row.organization?.organization_name,
    row.organization?.org_name,
  ]
    .filter((v) => v !== undefined && v !== null && String(v).trim() !== "")
    .map((v) => String(v).trim().toLowerCase());

  return candidates.includes(key);
};

/** Gabungkan baris detail dengan SKU sama → jumlahkan btb_qty. */
export const aggregateBtbDetailsBySku = (
  details: BTBDetail[] = [],
): BTBDetail[] => {
  const map = new Map<string, BTBDetail>();

  details.forEach((detail) => {
    const sku = String(detail.item_code || "").trim();
    if (!sku) return;

    const qty = Number(detail.btb_qty) || 0;
    const existing = map.get(sku);

    if (!existing) {
      map.set(sku, { ...detail, item_code: sku, btb_qty: qty });
      return;
    }

    map.set(sku, {
      ...existing,
      btb_qty: (Number(existing.btb_qty) || 0) + qty,
    });
  });

  return Array.from(map.values());
};

/**
 * Satu BTB per sales_nik:
 * prioritas status APPLIED > DRAFT > lainnya,
 * lalu btb_date terbaru (tie-break: createdAt).
 */
export const normalizeBtbForGoodPrep = (rows: BTB[]): BTB[] => {
  const getStatusRank = (status?: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "APPLIED") return 2;
    if (s === "DRAFT") return 1;
    return 0;
  };

  const shouldReplace = (current: BTB, next: BTB) => {
    const rankDiff = getStatusRank(next.status) - getStatusRank(current.status);
    if (rankDiff !== 0) return rankDiff > 0;

    const currentDate = dayjs(current.btb_date);
    const nextDate = dayjs(next.btb_date);
    if (nextDate.isAfter(currentDate, "day")) return true;
    if (nextDate.isBefore(currentDate, "day")) return false;

    return dayjs(next.createdAt).isAfter(dayjs(current.createdAt));
  };

  const byNik = new Map<string, BTB>();

  rows.forEach((row) => {
    const nik = String(row.sales_nik || "").trim();
    if (!nik) return;

    const current = byNik.get(nik);
    if (!current || shouldReplace(current, row)) {
      byNik.set(nik, row);
    }
  });

  return Array.from(byNik.values()).map((row) => ({
    ...row,
    details: aggregateBtbDetailsBySku(row.details || []),
  }));
};

export const getLatestBtbDateLabel = (rows: BTB[]): string | null => {
  if (!rows.length) return null;
  const latest = rows.reduce((best, row) => {
    if (!best?.btb_date) return row;
    if (!row.btb_date) return best;
    return dayjs(row.btb_date).isAfter(dayjs(best.btb_date), "day")
      ? row
      : best;
  }, rows[0]);

  const raw = latest?.btb_date;
  if (!raw) return null;
  const parsed = dayjs(raw);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : String(raw);
};
