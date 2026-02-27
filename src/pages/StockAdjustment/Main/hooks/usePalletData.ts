import { useEffect, useMemo } from "react";
import { useStorePallet } from "../../../../DynamicAPI/stores/Store/MasterStore";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { EndPoint } from "../../../../utils/EndPoint";

interface PalletItem {
  id: string;
  pallet_code: string;
  item_id: string;
  item_name: string;
  uom: string;
  week_number: number;
  current_quantity: number;
  warehouse_sub_id: string;
  warehouse_sub_name: string;
  warehouse_bin_id: string;
  warehouse_bin_name: string;
}

export const usePalletData = (
  selectedPallets: string[],
  isDetailMode: boolean,
  setPalletItems: React.Dispatch<React.SetStateAction<PalletItem[]>>,
  getItemKey: (item: PalletItem) => string,
) => {
  const { fetchAll, list } = useStorePallet();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (isDetailMode || selectedPallets.length === 0) return;

    const fetchData = async () => {
      try {
        const responses = await Promise.all(
          selectedPallets.map(async (code) => {
            const res = await axiosInstance.get(
              `${EndPoint}master-pallet/by-code/${code}/current`,
            );
            return res.data.data.map((item: any) => ({
              ...item,
              pallet_code: code,
            }));
          }),
        );

        const newItems = responses
          .flat()
          .filter((it: any) => Number(it.current_quantity) > 0);

        setPalletItems((prevItems) => {
          const existingKeys = new Set(prevItems.map((item) => getItemKey(item)));
          const filteredNewItems = newItems.filter(
            (newItem) => !existingKeys.has(getItemKey(newItem)),
          );
          return [...prevItems, ...filteredNewItems];
        });
      } catch (error) {
        console.error("Gagal mengambil data pallet:", error);
      }
    };

    fetchData();
  }, [selectedPallets, isDetailMode, setPalletItems, getItemKey]);

  const palletOptions = useMemo(() => {
    if (!Array.isArray(list)) return [];
    return list
      .slice()
      .sort((a: any, b: any) =>
        String(a.pallet_code).localeCompare(String(b.pallet_code), undefined, {
          numeric: true,
        }),
      )
      .map((p: any) => ({
        label: p.pallet_code,
        value: p.pallet_code,
      }));
  }, [list]);

  return { palletOptions };
};
