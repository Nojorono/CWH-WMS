// File: src/pages/DOsuggestion/OutboundSales/hook/useGetStockOnHand.ts

import { useState, useEffect } from 'react';
import { StockOnHand } from '../../../../API/types/stockOnHand';
import { getStockOnHand } from '../../../../API/store/DOsuggestionServices/StockOnHandService';

export const useGetStockOnHand = (params: {
    org: string;
    sub: string;
    date: string
}) => {
    const [data, setData] = useState<StockOnHand[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const result = await getStockOnHand({
                    organization_code: params.org,
                    subinventory_code: params.sub,
                    date: params.date
                });
                setData(result);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.org && params.date) {
            fetchData();
        }
    }, [params.org, params.sub, params.date]);

    return { data, isLoading };
};