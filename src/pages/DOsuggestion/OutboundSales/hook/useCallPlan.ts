import { useState, useEffect, useCallback } from 'react';
// Pastikan path import ini mengarah ke file type Anda dengan benar
import { CallPlanBindings, SupervisorData } from '../../../../API/types/callPlan'; 
import { getCallPlan } from '../../../../API/services/DOsuggestionServices/callPlanService';

export const useCallPlan = (params: CallPlanBindings) => {
    const [data, setData] = useState<SupervisorData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getCallPlan(params);
            setData(result);
        } catch (err) {
            setError('Gagal memuat data Call Plan');
        } finally {
            setIsLoading(false);
        }
    }, [params.CABANG, params.SALES_SUPERVISOR_NIK, params.CALL_PLAN_START_DATE]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
};