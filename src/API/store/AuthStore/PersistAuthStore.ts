import { create, StateCreator } from "zustand";
import { persist, StorageValue } from "zustand/middleware";
import { persistLoginService } from "../../services/AuthServices/PersistAuthService";
import { AuthState, AuthPersistState } from "../../types/persistAuth.types";

const encryption = {
  encode: (val: string) => btoa(val),
  decode: (val: string) => atob(val),
};

const storeLogic: StateCreator<AuthState, [["zustand/persist", unknown]]> = (set) => ({
  // Default States
  _hasHydrated: false, // Tambahkan status hidrasi ini
  isLoading: false,
  error: null,
  accessToken: null,
  refreshToken: null,
  user: null,
  menus: null,

  ioList: null,


  authLogin: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await persistLoginService(payload);

      // Axios mengembalikan response.data yang berisi payload utama Anda
      const { accessToken, refreshToken, user, menus } = response.data;

      set({ accessToken, refreshToken, user, menus, isLoading: false });
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Login failed";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  setIOList: (ioList) => set({ ioList }),

  resetAuth: () => set({
    accessToken: null, refreshToken: null, user: null, menus: null, error: null
  }),
});

export const usePersistAuthStore = create<AuthState>()(
  persist(storeLogic, {
    name: "wms-persist-storage",
    // Callback penanda bahwa data dari disk sudah sukses dimuat ke memori
    onRehydrateStorage: () => (state) => {
      if (state) state._hasHydrated = true;
    },
    storage: {
      getItem: (name): StorageValue<AuthPersistState> | null => {
        const raw = localStorage.getItem(name);
        if (!raw) return null;
        try {
          return JSON.parse(encryption.decode(raw));
        } catch { return null; }
      },
      setItem: (name, value) => {
        localStorage.setItem(name, encryption.encode(JSON.stringify(value)));
      },
      removeItem: (name) => localStorage.removeItem(name),
    },
    partialize: (state) => ({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user: state.user,
      menus: state.menus,
      ioList: state.ioList,
    }),
  })
);