import { useState, useEffect } from 'react';
import { CallPlanBindings, SupervisorData } from '../../../../API/types/callPlan';
import { generateCallPlan } from '../../../../API/store/DOsuggestionServices/generateCallPlanService';

export const useGenerateCallPlan = (params: CallPlanBindings) => {
    const [data, setData] = useState<SupervisorData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateCallPlan(params);
            setData(result);
        } catch (err) {
            setError('Gagal memuat data call plan');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (params.CABANG && params.SALES_SUPERVISOR_NIK) {
            fetchData();
        }
    }, [params.CABANG, params.CALL_PLAN_START_DATE, params.SALES_SUPERVISOR_NIK]);

    return { data, isLoading, error, refetch: fetchData };
};