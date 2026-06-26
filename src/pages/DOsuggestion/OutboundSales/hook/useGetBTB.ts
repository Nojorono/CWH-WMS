// File: src/API/store/DOsuggestionServices/hook/useGetBTB.ts

import { useState, useEffect, useCallback } from 'react';
import { getBTB } from '../../../../API/store/DOsuggestionServices/getBTBservice';
import { CallPlanBindings } from '../../../../API/types/callPlan';
import { BTBSalesmanGroup, BTBFlatItem } from '../../../../API/types/BTBdata';

interface UseGetBTBOptions {
    enabled?: boolean;
}

export const useGetBTB = (
    params: CallPlanBindings,
    options: UseGetBTBOptions = { enabled: true }
) => {
    const [data, setData] = useState<BTBSalesmanGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 1. Destructure parameter di luar agar referensinya stabil (mencegah infinite loop)
    const cabang = params.CABANG;
    const startDate = params.CALL_PLAN_START_DATE;
    const isEnabled = options.enabled;

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Gunakan variabel yang sudah diekstrak
            const flatResult: BTBFlatItem[] = await getBTB({
                CABANG: cabang,
                CALL_PLAN_START_DATE: startDate
            });

            // 2. Safety Check: Pastikan hasil API benar-benar sebuah Array
            if (!flatResult || !Array.isArray(flatResult)) {
                setData([]);
                return;
            }

            // 3. Proses Transformasi dengan pelindung data kotor
            const groupedData = flatResult.reduce((acc, curr) => {
                const salesNik = curr.SALES_NIK || "UNKNOWN_NIK"; // Fallback NIK kosong

                if (!acc[salesNik]) {
                    acc[salesNik] = {
                        SALES_NIK: salesNik,
                        SALES_NAME: curr.SALES_NAME || "Unknown Sales",
                        BTB_NUMBER: curr.BTB_NUMBER,
                        TANGGAL_BTB: curr.TANGGAL_BTB,
                        CABANG: curr.CABANG,
                        details: []
                    };
                }

                acc[salesNik].details.push({
                    PRODUCT_SKU: curr.PRODUCT_SKU,
                    PRODUCT_NAME: curr.PRODUCT_NAME,
                    INVENTORYID: curr.INVENTORYID,
                    QTY_BTB: curr.QTY_BTB
                });

                return acc;
            }, {} as Record<string, BTBSalesmanGroup>);

            setData(Object.values(groupedData));

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(String(err));
            }
            console.error("Fetch BTB Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [cabang, startDate]); // Dependency aman karena berupa string primitif

    useEffect(() => {
        const isValidBranch = cabang && cabang !== "null" && cabang !== "undefined";
        const isValidDate = startDate && startDate !== "null" && startDate !== "undefined";

        if (isEnabled && isValidBranch && isValidDate) {
            fetchData();
        } else if (!isEnabled) {
            setData([]);
        }
    }, [fetchData, isEnabled, cabang, startDate]);

    return { data, isLoading, error, refetch: fetchData };
};