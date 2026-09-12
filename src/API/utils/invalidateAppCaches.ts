import { invalidateAllCrudStores } from "../../DynamicAPI/stores/CreateCrudStore";
import { useOutboundSalesmanCache } from "../store/OutboundSalesmanStore/useOutboundSalesmanCache";

/**
 * Wipe in-memory API caches on logout / 401.
 * Tidak mengubah logic bisnis — hanya kosongkan Zustand agar sesi cabang berikutnya bersih.
 */
export const invalidateAllAppCaches = () => {
  try {
    invalidateAllCrudStores();
  } catch (err) {
    console.warn("[invalidateAllAppCaches] DynamicAPI stores:", err);
  }

  try {
    useOutboundSalesmanCache.getState().invalidateAll();
  } catch (err) {
    console.warn("[invalidateAllAppCaches] OSM cache:", err);
  }
};
