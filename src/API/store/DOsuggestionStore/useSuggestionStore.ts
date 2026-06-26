import { create } from 'zustand';
import { SuggestionSummary } from '../../types/DOsuggestion';

interface SuggestionState {
  cache: Record<string, SuggestionSummary>;
  setCache: (nik: string, data: SuggestionSummary) => void;
  getCache: (nik: string) => SuggestionSummary | undefined;
}

export const useSuggestionStore = create<SuggestionState>((set, get) => ({
  cache: {},
  setCache: (nik, data) => set((state) => ({ 
    cache: { ...state.cache, [nik]: data } 
  })),
  getCache: (nik) => get().cache[nik],
}));