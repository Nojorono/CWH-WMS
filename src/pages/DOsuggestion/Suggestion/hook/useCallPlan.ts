import { useState, useEffect } from 'react';
import { CallPlanBindings, CallPlanItem } from '../../../../API/types/callPlan';
import { getCallPlan } from '../../../../API/store/DOsuggestionServices/callPlanService';

export const useCallPlan = (params: CallPlanBindings) => {
    const [data, setData] = useState<CallPlanItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const result = await getCallPlan(params);
            setData(result);
        } catch (err) {
            setError('Gagal memuat data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [params.CABANG, params.CALL_PLAN_START_DATE]); // Auto-fetch jika parameter berubah

    return { data, isLoading, error, refetch: fetchData };
};