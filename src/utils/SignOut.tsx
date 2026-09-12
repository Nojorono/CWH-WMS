// import { NavigateFunction } from "react-router-dom";
// import { useAuthStore } from "../API/store/AuthStore/authStore";

// export const signOut = (navigate: NavigateFunction) => {
//   const resetAuth = useAuthStore.getState().resetAuth;
//   resetAuth();
//   localStorage.clear();

//   navigate("/signin", { replace: true });
// };


import { NavigateFunction } from "react-router-dom";
import { usePersistAuthStore } from "../API/store/AuthStore/PersistAuthStore";
import { invalidateAllAppCaches } from "../API/utils/invalidateAppCaches";

export const signOut = (navigate: NavigateFunction) => {
  try {
    invalidateAllAppCaches();
    usePersistAuthStore.getState().resetAuth();
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    console.error("Error during side effects of sign out:", error);
  } finally {
    navigate("/signin", { replace: true });
  }
};