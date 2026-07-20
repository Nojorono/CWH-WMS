// File: useGetBTB.ts
import { useState, useEffect, useCallback } from 'react';
import { CallPlanBindings } from '../../../../API/types/callPlan';
import { BTBSalesmanGroup, BTBFlatItem } from '../../../../API/types/BTBdata';
import { getBTB } from '../../../../API/services/DOsuggestionServices/getBTBservice';
import { showErrorToast } from '../../../../components/toast';
import dayjs from 'dayjs';

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
    const [isSuccess, setIsSuccess] = useState(false);

    const cabang = params.CABANG;
    const startDate = params.CALL_PLAN_START_DATE;
    const isEnabled = options.enabled;

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setIsSuccess(false);

        const btbDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

        try {
            const flatResult: BTBFlatItem[] = await getBTB({
                CABANG: cabang,
                CALL_PLAN_START_DATE: btbDate
            });

            if (!flatResult || !Array.isArray(flatResult)) {
                setData([]);
                setIsSuccess(true);
                return;
            }

            const groupedData = flatResult.reduce((acc, curr) => {
                const salesNik = curr.SALES_NIK || "UNKNOWN_NIK";
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
            setIsSuccess(true);

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            setError(errorMsg);
            showErrorToast("Gagal sinkronisasi data BTB dari DWH: " + errorMsg);
            console.error("Fetch BTB Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [cabang]);

    useEffect(() => {
        const isValidBranch = cabang && cabang !== "null" && cabang !== "undefined";
        const isValidDate = startDate && startDate !== "null" && startDate !== "undefined";

        // Tarik data secara langsung tanpa pembatasan jam DWH
        if (isEnabled && isValidBranch && isValidDate) {
            fetchData();
        } else if (!isEnabled) {
            setData([]);
        }
    }, [fetchData, isEnabled, cabang, startDate]);

    return { data, isLoading, error, isSuccess, refetch: fetchData };
};