import { useState, useEffect } from 'react';
import { CallPlanBindings } from '../../../../API/types/callPlan';
import { SuggestionSummary } from '../../../../API/types/DOsuggestion';
import { getDOsuggestion } from '../../../../API/store/DOsuggestionServices/DOsuggestionService';

export const useGetDoSuggestion = (params: CallPlanBindings) => {
    // Ubah tipe data menjadi SuggestionSummary | null
    const [data, setData] = useState<SuggestionSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getDOsuggestion(params);
            setData(result);
        } catch (err) {
            setError('Gagal memuat data suggestion');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Sesuaikan validasi params jika perlu (misalnya menyertakan NIK jika diperlukan)
        if (params.CABANG && params.SALES_SUPERVISOR_NIK) {
            fetchData();
        }
    }, [params.CABANG, params.CALL_PLAN_START_DATE, params.SALES_SUPERVISOR_NIK]);

    return { data, isLoading, error, refetch: fetchData };
};