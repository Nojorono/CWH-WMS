
import { useState, useEffect, useCallback } from 'react';
import { CallPlanBindings, SupervisorData } from '../../../../API/types/callPlan';
import { getCallPlan } from '../../../../API/store/DOsuggestionServices/callPlanService';

// Tambahkan interface untuk options
interface UseCallPlanOptions {
    enabled?: boolean;
}

export const useCallPlan = (
    params: CallPlanBindings,
    options: UseCallPlanOptions = { enabled: true } // Default-nya true agar tidak merusak komponen lain yang pakai hook ini
) => {
    const [data, setData] = useState<SupervisorData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Gunakan useCallback agar reference function stabil
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getCallPlan(params);
            setData(result);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(String(err));
            }
            console.error("Fetch Callplan Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [params.CABANG, params.CALL_PLAN_START_DATE, params.SALES_SUPERVISOR_NIK]); // Dependencies untuk fetchData

    useEffect(() => {
        // Cek options.enabled DAN pastikan NIK bukan teks "null" atau "undefined"
        const isSpvValid = params.SALES_SUPERVISOR_NIK &&
            params.SALES_SUPERVISOR_NIK !== "null" &&
            params.SALES_SUPERVISOR_NIK !== "undefined";

        if (options.enabled && params.CABANG && isSpvValid) {
            fetchData();
        } else if (!options.enabled) {
            // Opsional: Kosongkan data jika hook dimatikan (disabled)
            setData([]);
        }
    }, [fetchData, options.enabled, params.CABANG, params.SALES_SUPERVISOR_NIK]);

    return { data, isLoading, error, refetch: fetchData };
};