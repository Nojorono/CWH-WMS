import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { getStockOnHand } from "../../../../API/services/DOsuggestionServices/StockOnHandService";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast } from "../../../../components/toast";
import { callplanService } from "../../Services/CallplanService";
import { btbService } from "../../Services/BTBService";
import { realTimeSOHService } from "../../Services/RealTimeSOH";
import { Callplan } from "../../types/CallplanTypes";
import { BTB } from "../../types/BTBtypes";
import {
  matchesBtbOrganization,
  normalizeBtbForGoodPrep,
} from "../GoodPreparation/utils/normalizeBtbForGoodPrep";
import { useGoodPrepEnrichedData } from "../GoodPreparation/hooks/useGoodPrepEnrichedData";
import { getItemKey } from "../GoodPreparation/utils/getItemKey";
import { buildLhsRows, skuKey } from "./buildLhsRows";
import { computeRows, sumRows } from "./compute";
import { LhsReportContext } from "./types";

const SUBINVENTORY = "KECIL";

const filterCallplansByOrg = (
  list: Callplan[],
  organizationId: string,
  organizationCode: string,
) => {
  const id = String(organizationId || "").trim().toLowerCase();
  const code = String(organizationCode || "").trim().toLowerCase();
  if (!id && !code) return list;

  return list.filter((doc) => {
    const candidates = [
      doc.organization_id,
      doc.organization?.id,
      doc.organization?.organization_id,
      doc.organization?.organization_code,
      doc.organization?.organization_name,
      doc.organization?.org_name,
    ]
      .filter(Boolean)
      .map((v) => String(v).trim().toLowerCase());
    return (
      (id && candidates.includes(id)) || (code && candidates.includes(code))
    );
  });
};

/**
 * Ambil data LHS 1 cabang:
 * - Stock Awal: SOH Calculation (`/outbound-sales/on-hand`) — sama Calculation SPB
 * - META: SOH latest Good Prep (`/outbound-sales/on-hand-meta` / useRealTimeSOH)
 * - SPB FINAL semua sales cabang + Retur + BTB
 */
export const useLhsReportData = (reportDate: string) => {
  const user = usePersistAuthStore((s) => s.user);
  const { list: itemList, fetchAll: fetchItems } = useStoreItem();

  const organizationId =
    user?.userDetail?.organizationId ||
    user?.userDetail?.organization?.id ||
    "";
  /** Samakan dengan CalculationView: SOH pakai organization_name */
  const organizationName =
    user?.userDetail?.organization?.organization_name ||
    user?.userDetail?.organization?.org_name ||
    "";
  const organizationCode =
    user?.userDetail?.organization?.organization_code ||
    organizationName ||
    "";
  const amoName = organizationName || organizationCode || "—";

  const context: LhsReportContext = useMemo(
    () => ({
      amoName,
      organizationId: String(organizationId || ""),
      organizationCode: String(organizationCode || ""),
      reportDate,
    }),
    [amoName, organizationId, organizationCode, reportDate],
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalCallplans, setFinalCallplans] = useState<Callplan[]>([]);
  const [returCallplans, setReturCallplans] = useState<Callplan[]>([]);
  const [btbList, setBtbList] = useState<BTB[]>([]);
  const [stockAwalByKey, setStockAwalByKey] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [metaByKey, setMetaByKey] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [nameByKey, setNameByKey] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [kodeByKey, setKodeByKey] = useState<Map<string, string>>(
    () => new Map(),
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const refetch = useCallback(async () => {
    if (!context.organizationId || !reportDate) {
      setFinalCallplans([]);
      setReturCallplans([]);
      setBtbList([]);
      setError("Organisasi user tidak ditemukan.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Wajib organization_name — sama seperti CalculationView / useGetStockOnHand
      const orgForSoh = organizationName || context.organizationCode;
      if (!orgForSoh) {
        throw new Error(
          "organization_name tidak ditemukan untuk fetch Stock On Hand",
        );
      }

      const [finalRaw, returRaw, btbRaw, sohCalc, sohMeta] =
        await Promise.all([
          callplanService.getCallplans({
            dateStart: reportDate,
            organizationId: context.organizationId,
            status: "FINAL",
          }),
          callplanService.getReturReport(reportDate),
          btbService.getBTBLastDateInsert(),
          getStockOnHand({
            organization_code: orgForSoh,
            subinventory_code: SUBINVENTORY,
            // current date (default service) — LHS tidak pilih tanggal
          }).catch((err) => {
            console.error("SOH Calculation gagal:", err);
            return [];
          }),
          // META = SOH latest Good Prep (current date)
          realTimeSOHService
            .getRealTimeSOH({
              organization_name: orgForSoh,
              organization_code: orgForSoh,
            })
            .catch((err) => {
              console.error("SOH Realtime (META) gagal:", err);
              return { data: [], meta: null };
            }),
        ]);

      const finalFiltered = filterCallplansByOrg(
        finalRaw,
        context.organizationId,
        context.organizationCode,
      );
      const returFiltered = filterCallplansByOrg(
        returRaw,
        context.organizationId,
        context.organizationCode,
      );

      // BTB: sama Good Prep — last-date-insert + filter org
      // (jangan filter btb_date === callplan date: tanggal BTB sering beda dari callplan)
      const btbFiltered = normalizeBtbForGoodPrep(
        (btbRaw.data || []).filter(
          (row) =>
            matchesBtbOrganization(row, context.organizationId) ||
            matchesBtbOrganization(row, context.organizationCode) ||
            matchesBtbOrganization(row, organizationName),
        ),
      );

      const awalMap = new Map<string, number>();
      const awalBySku = new Map<string, number>();
      const metaMap = new Map<string, number>();
      const metaBySku = new Map<string, number>();
      const names = new Map<string, string>();
      const kodes = new Map<string, string>();

      sohCalc.forEach((item) => {
        const sku = String(item.item_code || item.item_number || "").trim();
        const invId = String(item.inventory_item_id || "").trim();
        if (!sku && !invId) return;
        const key = skuKey(sku, invId);
        const qty = Number(item.quantity) || 0;
        awalMap.set(key, qty);
        if (sku) {
          const s = sku.toUpperCase();
          awalBySku.set(s, (awalBySku.get(s) || 0) + qty);
        }
        kodes.set(key, sku || invId);
        names.set(key, item.item_description || sku || invId);
      });

      // META: agregasi sama Good Prep — key = inventory_item_id || item_code
      // qty sudah di-normalize service ke avail_to_reserve (latest on-hand-meta)
      (sohMeta.data || []).forEach((item) => {
        const key = getItemKey(item);
        if (!key) return;
        const sku = String(
          item.item_code || item.sku || item.item_number || "",
        ).trim();
        const invId = String(item.inventory_item_id || "").trim();
        const qty = Number(item.quantity) || 0;

        metaMap.set(key, (metaMap.get(key) || 0) + qty);
        if (sku) {
          const s = sku.toUpperCase();
          metaBySku.set(s, (metaBySku.get(s) || 0) + qty);
        }
        // Juga index composite agar buildLhsRows bisa match
        const composite = skuKey(sku, invId);
        if (composite && composite !== key) {
          metaMap.set(composite, (metaMap.get(composite) || 0) + qty);
        }

        if (!kodes.has(key)) kodes.set(key, sku || key);
        if (!names.has(key)) {
          names.set(key, item.item_description || sku || key);
        }
      });

      // Merge fallback SKU ke map utama tanpa membuat baris dobel di builder
      awalBySku.forEach((qty, sku) => {
        if (!awalMap.has(sku)) awalMap.set(sku, qty);
      });
      metaBySku.forEach((qty, sku) => {
        if (!metaMap.has(sku)) metaMap.set(sku, qty);
      });

      setFinalCallplans(finalFiltered);
      setReturCallplans(returFiltered);
      setBtbList(btbFiltered);
      setStockAwalByKey(awalMap);
      setMetaByKey(metaMap);
      setNameByKey(names);
      setKodeByKey(kodes);
    } catch (err) {
      console.error("Gagal load Laporan Harian Stock:", err);
      const message =
        err instanceof Error ? err.message : "Gagal memuat data laporan";
      setError(message);
      showErrorToast(message);
      setFinalCallplans([]);
      setReturCallplans([]);
      setBtbList([]);
    } finally {
      setIsLoading(false);
    }
  }, [context, reportDate, organizationName]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const { enrichedData: returEnriched } = useGoodPrepEnrichedData({
    prepCallplans: returCallplans,
    btbData: btbList,
  });

  const rows = useMemo(() => {
    const built = buildLhsRows({
      finalCallplans,
      returCallplans: returEnriched,
      btbList,
      stockAwalByKey,
      metaByKey,
      nameByKey,
      kodeByKey,
      itemList: Array.isArray(itemList) ? itemList : [],
    });
    return computeRows(built);
  }, [
    finalCallplans,
    returEnriched,
    btbList,
    stockAwalByKey,
    metaByKey,
    nameByKey,
    kodeByKey,
    itemList,
  ]);

  const totals = useMemo(() => sumRows(rows), [rows]);

  return {
    context,
    rows,
    totals,
    isLoading,
    error,
    refetch,
    salesCount: finalCallplans.length,
    reportDateLabel: dayjs(reportDate).isValid()
      ? dayjs(reportDate).format("DD MMMM YYYY")
      : reportDate,
  };
};
