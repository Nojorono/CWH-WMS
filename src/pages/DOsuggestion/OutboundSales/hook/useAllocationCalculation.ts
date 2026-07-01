import { useMemo } from "react";
import { resolveSku, safeParse } from "../utils/sku";
import { GroupedSPBData } from "../MainTable";

type SkuMeta = {
    item_code?: string;
    item_number?: string;
    item_description?: string;
    inventory_item_id?: string | number;
    createdAt?: string;
};

export const useAllocationCalculation = (
    data: GroupedSPBData[],
    stockList: any[],
) => {
    return useMemo(() => {
        if (!Array.isArray(stockList) || !data) {
            return {
                calculatedData: [],
                skuSummary: [],
            };
        }

        const flatSalesmanList = data.flatMap((group) => group.salesmenDO);

        const skuMetaMap = new Map<string, SkuMeta>();

        const registerSkuMeta = (sku: string, source: any) => {
            if (!sku || skuMetaMap.has(sku)) return;

            skuMetaMap.set(sku, {
                item_code: source.item_code,
                item_number: source.item_number,
                item_description: source.item_description,
                inventory_item_id: source.inventory_item_id,
                createdAt: source.createdAt,
            });
        };

        /**
         * =========================
         * 1. Build SOH Map
         * =========================
         */
        const sohMap = stockList.reduce(
            (acc, item) => {
                const sku = resolveSku(item);

                if (!sku) return acc;

                registerSkuMeta(sku, item);

                acc[sku] = (acc[sku] || 0) + (item.quantity || 0);

                return acc;
            },
            {} as Record<string, number>,
        );

        /**
         * =========================
         * 2. Build Request Map
         * =========================
         */
        const totalSubmittedPerSku = flatSalesmanList
            .flatMap((salesman) => salesman.details)
            .reduce(
                (acc, detail) => {
                    const sku = resolveSku(detail);

                    if (!sku) return acc;

                    registerSkuMeta(sku, detail);

                    acc[sku] =
                        (acc[sku] || 0) + safeParse(detail.item_qty_submitted);

                    return acc;
                },
                {} as Record<string, number>,
            );

        /**
         * =========================
         * 3. Generate SKU Summary
         * =========================
         */
        const uniqueSkus = [
            ...new Set([
                ...Object.keys(sohMap),
                ...Object.keys(totalSubmittedPerSku),
            ]),
        ];

        const skuSummary = uniqueSkus.map((sku) => {
            const meta = skuMetaMap.get(sku);

            return {
                sku,
                soh: sohMap[sku] || 0,
                totalRequest: totalSubmittedPerSku[sku] || 0,
                item_code: meta?.item_code || sku,
                item_number: meta?.item_number || "-",
                item_description: meta?.item_description || "-",
                inventory_item_id: meta?.inventory_item_id || null,
                createdAt: meta?.createdAt || null,
            };
        });

        /**
         * =========================
         * 4. Allocation Calculation
         * =========================
         */
        const calculatedData = flatSalesmanList.map((salesman) => ({
            ...salesman,
            details: salesman.details
                .filter((detail) => resolveSku(detail))
                .map((detail) => {
                    const sku = resolveSku(detail);

                    const submitted = safeParse(detail.item_qty_submitted);
                    const qtyBtb = safeParse(detail.qty_btb || 0);

                    const totalReq = totalSubmittedPerSku[sku] || 0;
                    const soh = sohMap[sku] || 0;

                    const contribution =
                        totalReq > 0 ? submitted / totalReq : 0;

                    let finalQty = 0;
                    let allocationStatus = "NORMAL";

                    if (soh <= 0) {
                        finalQty = 0;
                        allocationStatus = "NO_STOCK";
                    } else if (soh >= totalReq) {
                        finalQty = submitted;
                        allocationStatus = "AVAILABLE";
                    } else {
                        finalQty = Math.round(contribution * soh);
                        allocationStatus = "LESS_STOCK";
                    }

                    const preparedQty = Math.max(
                        0,
                        finalQty - qtyBtb,
                    );

                    return {
                        ...detail,
                        resolved_sku: sku,
                        soh,
                        contribution_percentage: (
                            contribution * 100
                        ).toFixed(2),
                        allocation_status: allocationStatus,
                        item_qty_final: finalQty,
                        qty_btb: qtyBtb,
                        prepared_qty: preparedQty,
                    };
                }),
        }));

        return {
            calculatedData,
            skuSummary,
        };
    }, [data, stockList]);
};