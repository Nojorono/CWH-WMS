import { useMemo } from "react";
import { resolveSku, safeParse } from "../utils/sku";
import { GroupedSPBData } from "../MainTable";

type SkuMeta = {
    sku: string;
    item_code?: string;
    item_number?: string;
    item_description?: string;
    inventory_item_id?: string | number;
    createdAt?: string;
};

type AllocLineRef = {
    lineKey: string;
    skuKey: string;
    suggested: number;
};

const getItemKey = (item: any): string => {
    const itemId = item?.inventory_item_id;
    if (itemId !== undefined && itemId !== null && itemId !== "") {
        return String(itemId);
    }
    return resolveSku(item) || "";
};

export type AllocationCalculationOptions = {
    shouldAllocate?: (salesman: any) => boolean;
};

const passthroughDetail = (detail: any, sohMap: Record<string, number>) => {
    const sku = resolveSku(detail);
    const key = getItemKey(detail);
    const submitted = safeParse(detail.item_qty_submitted);
    const qtyBtb = safeParse(detail.qty_btb || 0);

    return {
        ...detail,
        resolved_sku: sku,
        soh: sohMap[key] || 0,
        contribution_percentage:
            detail.contribution_percentage != null &&
            detail.contribution_percentage !== ""
                ? String(detail.contribution_percentage)
                : "100.00",
        allocation_status: "ORIGINAL",
        item_qty_final: submitted,
        qty_btb: qtyBtb,
        prepared_qty: Math.max(0, submitted - qtyBtb),
    };
};

const defaultShouldAllocate = () => true;

const buildAllocLineKey = (
    salesmanId: string | number,
    detailId: string | number,
) => `${salesmanId}::${detailId}`;

/**
 * Distribusi proporsional dengan total pasti = SOH (largest remainder).
 * Mencegah Σ item_qty_final melebihi SOH akibat pembulatan per baris.
 */
const distributeProportional = (
    items: { id: string; weight: number }[],
    total: number,
): Map<string, number> => {
    const result = new Map<string, number>();
    if (items.length === 0) return result;

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0 || total <= 0) {
        items.forEach((item) => result.set(item.id, 0));
        return result;
    }

    if (total >= totalWeight) {
        items.forEach((item) => result.set(item.id, item.weight));
        return result;
    }

    const withRemainder = items.map((item) => {
        const exact = (item.weight / totalWeight) * total;
        const floor = Math.floor(exact);
        return { id: item.id, floor, remainder: exact - floor };
    });

    const remaining =
        total - withRemainder.reduce((sum, item) => sum + item.floor, 0);

    withRemainder.sort((a, b) => {
        if (b.remainder !== a.remainder) return b.remainder - a.remainder;
        return a.id.localeCompare(b.id);
    });

    withRemainder.forEach((item, index) => {
        result.set(item.id, item.floor + (index < remaining ? 1 : 0));
    });

    return result;
};

/** Σ item_qty_final per item_code — hanya baris hasil alokasi kontribusi. */
const sumFinalQtyByDisplaySku = (calculatedData: any[]) =>
    calculatedData
        .flatMap((salesman) => salesman.details)
        .reduce(
            (acc, detail) => {
                if (detail.allocation_status === "ORIGINAL") return acc;

                const sku = resolveSku(detail);
                if (!sku) return acc;
                acc[sku] =
                    (acc[sku] || 0) + safeParse(detail.item_qty_final);
                return acc;
            },
            {} as Record<string, number>,
        );

export const useAllocationCalculation = (
    data: GroupedSPBData[],
    stockList: any[],
    options?: AllocationCalculationOptions,
) => {
    const shouldAllocate = options?.shouldAllocate ?? defaultShouldAllocate;

    return useMemo(() => {
        if (!Array.isArray(stockList) || !data) {
            return {
                calculatedData: [],
                skuSummary: [],
            };
        }

        const flatSalesmanList = data.flatMap((group) => group.salesmenDO);
        const skuMetaMap = new Map<string, SkuMeta>();

        const registerSkuMeta = (key: string, source: any) => {
            if (!key || skuMetaMap.has(key)) return;

            skuMetaMap.set(key, {
                sku: resolveSku(source) || "",
                item_code: source.item_code,
                item_number: source.item_number,
                item_description: source.item_description,
                inventory_item_id: source.inventory_item_id,
                createdAt: source.createdAt,
            });
        };

        const sohMap = stockList.reduce(
            (acc, item) => {
                const key = getItemKey(item);
                if (!key) return acc;

                registerSkuMeta(key, item);
                acc[key] = (acc[key] || 0) + (item.quantity || 0);

                return acc;
            },
            {} as Record<string, number>,
        );

        const totalSuggestedPerSku = flatSalesmanList
            .filter(shouldAllocate)
            .flatMap((salesman) => salesman.details)
            .reduce(
                (acc, detail) => {
                    const key = getItemKey(detail);
                    if (!key) return acc;

                    registerSkuMeta(key, detail);
                    acc[key] =
                        (acc[key] || 0) + safeParse(detail.item_qty_suggestion);

                    return acc;
                },
                {} as Record<string, number>,
            );

        const uniqueKeys = [
            ...new Set([
                ...Object.keys(sohMap),
                ...Object.keys(totalSuggestedPerSku),
            ]),
        ];

        // Kumpulkan semua baris alokasi per SKU, lalu distribusikan SOH sekali
        const allocLineRefs: AllocLineRef[] = [];

        flatSalesmanList.forEach((salesman) => {
            if (!shouldAllocate(salesman)) return;

            salesman.details
                .filter((detail) => resolveSku(detail))
                .forEach((detail) => {
                    allocLineRefs.push({
                        lineKey: buildAllocLineKey(salesman.id, detail.id),
                        skuKey: getItemKey(detail),
                        suggested: safeParse(detail.item_qty_suggestion),
                    });
                });
        });

        const refsBySku = allocLineRefs.reduce(
            (acc, ref) => {
                if (!ref.skuKey) return acc;
                if (!acc[ref.skuKey]) acc[ref.skuKey] = [];
                acc[ref.skuKey].push(ref);
                return acc;
            },
            {} as Record<string, AllocLineRef[]>,
        );

        const finalQtyByLineKey = new Map<string, number>();

        Object.entries(refsBySku).forEach(([skuKey, refs]) => {
            const soh = sohMap[skuKey] || 0;
            const totalReq = refs.reduce((sum, ref) => sum + ref.suggested, 0);

            if (soh <= 0) {
                refs.forEach((ref) => finalQtyByLineKey.set(ref.lineKey, 0));
                return;
            }

            if (soh >= totalReq) {
                refs.forEach((ref) =>
                    finalQtyByLineKey.set(ref.lineKey, ref.suggested),
                );
                return;
            }

            const distributed = distributeProportional(
                refs.map((ref) => ({ id: ref.lineKey, weight: ref.suggested })),
                soh,
            );
            distributed.forEach((qty, lineKey) =>
                finalQtyByLineKey.set(lineKey, qty),
            );
        });

        const calculatedData = flatSalesmanList.map((salesman) => ({
            ...salesman,
            details: salesman.details
                .filter((detail) => resolveSku(detail))
                .map((detail) => {
                    if (!shouldAllocate(salesman)) {
                        return passthroughDetail(detail, sohMap);
                    }

                    const sku = resolveSku(detail);
                    const key = getItemKey(detail);
                    const lineKey = buildAllocLineKey(salesman.id, detail.id);

                    const suggested = safeParse(detail.item_qty_suggestion);
                    const qtyBtb = safeParse(detail.qty_btb || 0);
                    const totalReq = totalSuggestedPerSku[key] || 0;
                    const soh = sohMap[key] || 0;
                    const contribution = totalReq > 0 ? suggested / totalReq : 0;
                    const finalQty = finalQtyByLineKey.get(lineKey) ?? 0;

                    let allocationStatus = "NORMAL";
                    if (soh <= 0) {
                        allocationStatus = "NO_STOCK";
                    } else if (soh >= totalReq) {
                        allocationStatus = "AVAILABLE";
                    } else {
                        allocationStatus = "LESS_STOCK";
                    }

                    return {
                        ...detail,
                        resolved_sku: sku,
                        soh,
                        contribution_percentage: (contribution * 100).toFixed(2),
                        allocation_status: allocationStatus,
                        item_qty_final: finalQty,
                        qty_btb: qtyBtb,
                        prepared_qty: Math.max(0, finalQty - qtyBtb),
                    };
                }),
        }));

        const totalQtyByContributeByDisplaySku =
            sumFinalQtyByDisplaySku(calculatedData);

        const skuSummary = uniqueKeys.map((key) => {
            const meta = skuMetaMap.get(key);
            const sku = meta?.sku || key;
            const soh = sohMap[key] || 0;
            const totalRequest = totalSuggestedPerSku[key] || 0;
            const rawContribute = totalQtyByContributeByDisplaySku[sku] ?? 0;

            return {
                sku,
                soh,
                totalRequest,
                totalQtyByContribute:
                    totalRequest > soh ? Math.min(rawContribute, soh) : rawContribute,
                item_code: meta?.item_code || sku,
                item_number: meta?.item_number || "-",
                item_description: meta?.item_description || "-",
                inventory_item_id: meta?.inventory_item_id || null,
                createdAt: meta?.createdAt || null,
            };
        });

        return {
            calculatedData,
            skuSummary,
        };
    }, [data, stockList, shouldAllocate]);
};
