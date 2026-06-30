// File: src/pages/DOsuggestion/OutboundSales/hook/useGetStockOnHand.ts

import { useEffect } from 'react';
import { useStockStore } from '../../../../API/store/DOsuggestionStore/useStockOnHandStore';
import { getStockOnHand } from '../../../../API/services/DOsuggestionServices/StockOnHandService';

export const useGetStockOnHand = (params: {
    org: string;
    sub: string;
    date: string
}) => {
    // 1. Panggil state & setter dari Zustand
    const { sohData, isLoadingSoh, setSohData, setIsLoadingSoh } = useStockStore();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingSoh(true);
            try {
                const result = await getStockOnHand({
                    organization_code: params.org,
                    subinventory_code: params.sub,
                    date: params.date
                });

                // 2. Simpan hasil fetch langsung ke Zustand global!
                setSohData(result);
            } catch (err) {
                console.error(err);
                setSohData([]); // Reset jika error
            } finally {
                setIsLoadingSoh(false);
            }
        };

        if (params.org && params.date) {
            fetchData();
        }
    }, [params.org, params.sub, params.date, setSohData, setIsLoadingSoh]);

    // 3. Tetap return state dari Zustand agar komponen pemanggil hook bisa memantau loading
    return { data: sohData, isLoading: isLoadingSoh };
};