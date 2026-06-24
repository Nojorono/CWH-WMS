import { useMemo } from 'react';
import { resolveSku, safeParse } from '../utils/sku';
import { GroupedSPBData } from '../MainTable';

export const useAllocationCalculation = (data: GroupedSPBData[], stockList: any[]) => {
    return useMemo(() => {
        if (!stockList || !Array.isArray(stockList) || !data) {
            return { calculatedData: [], skuSummary: [] };
        }

        const flatSalesmanList = data.flatMap((g) => g.salesmenDO);

        // 1. Mapping Stok
        const skuMetaMap = new Map<string, any>();
        const sohMap = stockList.reduce((acc, item) => {
            const key = resolveSku(item);

            // Simpan metadata ke dalam Map berdasarkan key SKU
            if (!skuMetaMap.has(key)) {
                skuMetaMap.set(key, {
                    item_code: item.item_code,
                    item_number: item.item_number,
                    item_description: item.item_description,
                    inventory_item_id: item.inventory_item_id
                });
            }

            if (key) acc[key] = (acc[key] || 0) + (item.quantity || 0);
            return acc;
        }, {} as Record<string, number>);

        // 2. Mapping Total Permintaan
        const totalSubmittedPerSku = flatSalesmanList
            .flatMap((d) => d.details)
            .reduce((acc, curr) => {
                const key = resolveSku(curr);
                acc[key] = (acc[key] || 0) + safeParse(curr.item_qty_submitted);

                // Simpan metadata item jika belum ada di map
                if (!skuMetaMap.has(key)) {
                    skuMetaMap.set(key, {
                        item_code: curr.item_code,
                        item_number: curr.item_number,
                        item_description: curr.item_description,
                        inventory_item_id: curr.inventory_item_id
                    });
                }
                return acc;
            }, {} as Record<string, number>);

        // 3. Generate Summary untuk Panel
        const uniqueSkus = Array.from(
            new Set([...Object.keys(sohMap), ...Object.keys(totalSubmittedPerSku)])
        );

        const skuSummary = uniqueSkus.map((sku) => {
            const meta = skuMetaMap.get(sku) || {};
            return {
                sku,
                soh: sohMap[sku] || 0,
                totalRequest: totalSubmittedPerSku[sku] || 0,
                // Informasi tambahan:
                item_code: meta.item_code || sku,
                item_number: meta.item_number || "-",
                item_description: meta.item_description || "-",
                inventory_item_id: meta.inventory_item_id || null,
            };
        });


        // 4. Generate Calculated Data
        const calculatedData = flatSalesmanList.map((salesman) => ({
            ...salesman,
            details: salesman.details
                .filter((detail) => resolveSku(detail))
                .map((detail: any) => {
                    const key = resolveSku(detail);
                    const submitted = safeParse(detail.item_qty_submitted);
                    const qtyBtb = safeParse(detail.qty_btb || 0);

                    const totalReq = totalSubmittedPerSku[key] || 0;
                    const soh = sohMap[key] || 0;
                    const contribution = totalReq > 0 ? submitted / totalReq : 0;


                    let finalQty = 0;
                    let status = "NORMAL";

                    if (soh <= 0) {
                        finalQty = 0;
                        status = "NO_STOCK"; // Sesuai kesepakatan istilah
                    } else if (soh >= totalReq) {
                        finalQty = submitted;
                        status = "AVAILABLE";
                    } else {
                        finalQty = Math.round(contribution * soh);
                        status = "LESS_STOCK";
                    }

                    const preparedQty = Math.max(0, finalQty - qtyBtb);


                    return {
                        ...detail,
                        resolved_sku: key,
                        soh,
                        contribution_percentage: soh <= 0 ? "0" : (contribution * 100).toFixed(2),
                        allocation_status: status,
                        item_qty_final: finalQty,
                        qty_btb: qtyBtb,
                        prepared_qty: preparedQty
                    };
                }),
        }));

        return { calculatedData, skuSummary };
    }, [data, stockList]);
};