import { useEffect, useMemo, useRef, useState } from "react";
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

  // ✅ Simpan pallet code yang valid (punya setidaknya 1 item qty > 0)
  const [validPalletCodes, setValidPalletCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const prevSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isDetailMode) return;

    const key = Array.isArray(selectedPallets)
      ? selectedPallets.join("|")
      : "";

    if (prevSelectedRef.current === key) return;
    prevSelectedRef.current = key;

    if (!selectedPallets || selectedPallets.length === 0) {
      setPalletItems([]);
      return;
    }

    setPalletItems((prevItems) => {
      const afterRemove = prevItems.filter((item) =>
        selectedPallets.includes(item.pallet_code),
      );

      const existingPalletCodes = new Set(
        afterRemove.map((item) => item.pallet_code),
      );
      const newPalletCodes = selectedPallets.filter(
        (code) => !existingPalletCodes.has(code),
      );

      if (newPalletCodes.length === 0) return afterRemove;

      (async () => {
        try {
          const responses = await Promise.all(
            newPalletCodes.map(async (code) => {
              const res = await axiosInstance.get(
                `${EndPoint}master-pallet/by-code/${code}/current`,
              );
              return res.data.data.map((item: any) => ({
                ...item,
                pallet_code: code,
              }));
            }),
          );

          // ✅ Filter: hanya item dengan current_quantity > 0
          const newItems = responses
            .flat()
            .filter((it: any) => Number(it.current_quantity) > 0);

          if (newItems.length === 0) return;

          setPalletItems((latest) => {
            const existingKeys = new Set(latest.map((item) => getItemKey(item)));
            const filteredNewItems = newItems.filter(
              (newItem: PalletItem) => !existingKeys.has(getItemKey(newItem)),
            );
            return [...latest, ...filteredNewItems];
          });
        } catch (error) {
          console.error("Gagal mengambil data pallet:", error);
        }
      })();

      return afterRemove;
    });
  }, [selectedPallets, isDetailMode, setPalletItems]);

  // ✅ Fetch semua pallet untuk cek validitas (ada item qty > 0)
  useEffect(() => {
    if (!Array.isArray(list) || list.length === 0) return;

    const checkAllPallets = async () => {
      try {
        const results = await Promise.all(
          list.map(async (p: any) => {
            try {
              const res = await axiosInstance.get(
                `${EndPoint}master-pallet/by-code/${p.pallet_code}/current`,
              );
              const items: any[] = res.data.data || [];
              // ✅ Pallet valid jika ada minimal 1 item dengan qty > 0
              const hasStock = items.some(
                (it) => Number(it.current_quantity) > 0,
              );
              return { code: p.pallet_code, valid: hasStock };
            } catch {
              return { code: p.pallet_code, valid: false };
            }
          }),
        );

        const validCodes = new Set(
          results.filter((r) => r.valid).map((r) => r.code),
        );
        setValidPalletCodes(validCodes);
      } catch (error) {
        console.error("Gagal validasi pallet options:", error);
      }
    };

    checkAllPallets();
  }, [list]);

  const palletOptions = useMemo(() => {
    if (!Array.isArray(list)) return [];
    return list
      .slice()
      .filter((p: any) => validPalletCodes.has(p.pallet_code)) // ✅ Hanya pallet valid
      .sort((a: any, b: any) =>
        String(a.pallet_code).localeCompare(String(b.pallet_code), undefined, {
          numeric: true,
        }),
      )
      .map((p: any) => ({
        label: p.pallet_code,
        value: p.pallet_code,
      }));
  }, [list, validPalletCodes]);

  return { palletOptions };
};