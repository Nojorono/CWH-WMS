
import { useState, useEffect, useCallback } from 'react';
import { CallPlanBindings, SupervisorData } from '../../../../API/types/callPlan';
import { getCallPlan } from '../../../../API/services/DOsuggestionServices/callPlanService';

// Tambahkan interface untuk options
interface UseCallPlanOptions {
    enabled?: boolean;
}

export const useCallPlan = (
    params: CallPlanBindings,
    options: UseCallPlanOptions = { enabled: true }
) => {
    const [data, setData] = useState<SupervisorData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    console.log("Fetching CallPlan Date:", params.CALL_PLAN_START_DATE);

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
    }, [params.CABANG, params.CALL_PLAN_START_DATE, params.SALES_SUPERVISOR_NIK]);

    useEffect(() => {
        const isSpvValid = params.SALES_SUPERVISOR_NIK &&
            params.SALES_SUPERVISOR_NIK !== "null" &&
            params.SALES_SUPERVISOR_NIK !== "undefined";

        if (options.enabled && params.CABANG && isSpvValid) {
            fetchData();
        } else if (!options.enabled) {
            setData([]);
        }
    }, [fetchData, options.enabled, params.CABANG, params.SALES_SUPERVISOR_NIK]);

    return { data, isLoading, error, refetch: fetchData };
};