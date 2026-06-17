import { useState, useEffect } from 'react';
import { CallPlanBindings, BTBResponse } from '../../../../API/types/callPlan'; 
import { getBTB } from '../../../../API/store/DOsuggestionServices/getBTBservice';


export const useGetBTB = (params: CallPlanBindings) => {
    const [data, setData] = useState<BTBResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getBTB(params);
            setData(result);
        } catch (err) {
            setError('Gagal memuat data BTB');
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