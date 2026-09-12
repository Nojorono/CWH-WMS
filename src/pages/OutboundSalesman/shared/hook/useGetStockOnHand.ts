import { useEffect } from "react";
import { useStockStore } from "../../../../API/store/DOsuggestionStore/useStockOnHandStore";
import { getStockOnHand } from "../../../../API/services/do-suggestion/StockOnHandService";

export const useGetStockOnHand = (params: {
  org: string;
  sub: string;
}) => {
  const { sohData, isLoadingSoh, setSohData, setIsLoadingSoh } = useStockStore();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingSoh(true);

      try {
        const result = await getStockOnHand({
          organization_code: params.org,
          subinventory_code: params.sub,
        });

        setSohData(result);
      } catch (err) {
        console.error(err);
        setSohData([]);
      } finally {
        setIsLoadingSoh(false);
      }
    };

    if (params.org) {
      fetchData();
    }
  }, [params.org, params.sub, setSohData, setIsLoadingSoh]);

  return { data: sohData, isLoading: isLoadingSoh };
};
