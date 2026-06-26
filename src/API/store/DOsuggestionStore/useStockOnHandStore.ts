import { create } from "zustand";
import { StockOnHand } from "../../types/stockOnHand";

interface StockStore {
  // State
  sohData: StockOnHand[];
  isLoadingSoh: boolean;
  
  // Actions
  setSohData: (data: StockOnHand[]) => void;
  setIsLoadingSoh: (loading: boolean) => void;
  clearSohData: () => void;
}

export const useStockStore = create<StockStore>((set) => ({
  sohData: [],
  isLoadingSoh: false,
  
  setSohData: (data) => set({ sohData: data }),
  setIsLoadingSoh: (loading) => set({ isLoadingSoh: loading }),
  clearSohData: () => set({ sohData: [], isLoadingSoh: false }),
}));