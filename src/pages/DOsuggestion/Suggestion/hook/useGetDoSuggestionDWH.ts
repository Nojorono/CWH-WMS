import { useState, useEffect } from 'react';
import { CallPlanBindings } from '../../../../API/types/callPlan';
import { SuggestionSummary } from '../../../../API/types/DOsuggestion';
import { useSuggestionStore } from '../../../../API/store/DOsuggestionStore/useSuggestionStore';
import { getDOsuggestion } from '../../../../API/services/DOsuggestionServices/DOsuggestionService';

export const useGetDoSuggestionDWH = (params: CallPlanBindings) => {
    const salesNik = params.SALES_NIK ?? "";
    const { getCache, setCache } = useSuggestionStore();

    const [data, setData] = useState<SuggestionSummary | null>(getCache(salesNik) || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        if (!salesNik) return;

        const cachedData = getCache(salesNik);
        if (cachedData) {
            setData(cachedData);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const result = await getDOsuggestion(params);
            setCache(salesNik, result);
            setData(result);
        } catch (err) {
            setError('Gagal memuat data suggestion');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (params.CABANG && params.SALES_SUPERVISOR_NIK && salesNik) {
            fetchData();
        }
    }, [salesNik, params.CABANG, params.CALL_PLAN_START_DATE]);


    console.log("data DO sgst", data);
    

    return { data, isLoading, error, refetch: fetchData };
};