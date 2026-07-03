import { useMemo } from "react";
import { resolveSku, safeParse } from "../utils/sku";
import { GroupedSPBData } from "../MainTable";

type SkuMeta = {
    sku: string; // Tambahan field sku murni untuk visualisasi di UI
    item_code?: string;
    item_number?: string;
    item_description?: string;
    inventory_item_id?: string | number;
    createdAt?: string;
};

// Helper untuk mendapatkan key unik pencocokan (mengutamakan inventory_item_id)
const getItemKey = (item: any): string => {
    const itemId = item?.inventory_item_id;
    if (itemId !== undefined && itemId !== null && itemId !== "") {
        return String(itemId);
    }
    return resolveSku(item) || "";
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

        /**
         * ======================================
         * 1. Build SOH Map (Menggunakan Unique Key)
         * ======================================
         */
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

        /**
         * ======================================
         * 2. Build Request Map (Menggunakan Unique Key)
         * ======================================
         */
        const totalSubmittedPerSku = flatSalesmanList
            .flatMap((salesman) => salesman.details)
            .reduce(
                (acc, detail) => {
                    const key = getItemKey(detail);
                    if (!key) return acc;

                    registerSkuMeta(key, detail);
                    acc[key] = (acc[key] || 0) + safeParse(detail.item_qty_submitted);

                    return acc;
                },
                {} as Record<string, number>,
            );

        /**
         * ======================================
         * 3. Generate SKU Summary
         * ======================================
         */
        const uniqueKeys = [
            ...new Set([
                ...Object.keys(sohMap),
                ...Object.keys(totalSubmittedPerSku),
            ]),
        ];

        const skuSummary = uniqueKeys.map((key) => {
            const meta = skuMetaMap.get(key);
            const sku = meta?.sku || key;

            return {
                sku,
                soh: sohMap[key] || 0,
                totalRequest: totalSubmittedPerSku[key] || 0,
                item_code: meta?.item_code || sku,
                item_number: meta?.item_number || "-",
                item_description: meta?.item_description || "-",
                inventory_item_id: meta?.inventory_item_id || null,
                createdAt: meta?.createdAt || null,
            };
        });

        /**
         * ======================================
         * 4. Allocation Calculation (Unique Key)
         * ======================================
         */
        const calculatedData = flatSalesmanList.map((salesman) => ({
            ...salesman,
            details: salesman.details
                .filter((detail) => resolveSku(detail))
                .map((detail) => {
                    const sku = resolveSku(detail);
                    const key = getItemKey(detail); // Gunakan key unik untuk matching

                    const submitted = safeParse(detail.item_qty_submitted);
                    const qtyBtb = safeParse(detail.qty_btb || 0);

                    const totalReq = totalSubmittedPerSku[key] || 0;
                    const soh = sohMap[key] || 0;

                    const contribution = totalReq > 0 ? submitted / totalReq : 0;

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

                    const preparedQty = Math.max(0, finalQty - qtyBtb);

                    return {
                        ...detail,
                        resolved_sku: sku,
                        soh,
                        contribution_percentage: (contribution * 100).toFixed(2),
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