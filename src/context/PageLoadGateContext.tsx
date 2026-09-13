import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router";

type PageLoadGateContextValue = {
  /** true = sidebar terkunci, halaman sedang dimuat */
  isPageLoading: boolean;
  /** Path tujuan navigasi saat loading */
  pendingPath: string | null;
  /** Mulai navigasi dari sidebar (kunci menu) */
  beginNavigation: (to: string) => void;
  /** Halaman siap — buka kunci sidebar */
  finishPageLoad: () => void;
  /** DeferredMount mendaftarkan diri; return unregister */
  registerDeferredMount: () => () => void;
};

const PageLoadGateContext = createContext<PageLoadGateContextValue | null>(
  null,
);

/** Halaman tanpa DeferredMount: lepas kunci setelah settle singkat */
const LIGHT_PAGE_SETTLE_MS = 320;
/** Safety: jangan kunci selamanya jika ada yang gagal finish */
const MAX_LOCK_MS = 4000;

export const PageLoadGateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const deferredCountRef = useRef(0);
  const [, bumpDeferred] = useState(0);
  const lockStartedAtRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  const finishPageLoad = useCallback(() => {
    clearTimers();
    setIsPageLoading(false);
    setPendingPath(null);
  }, [clearTimers]);

  const beginNavigation = useCallback(
    (to: string) => {
      clearTimers();
      lockStartedAtRef.current = Date.now();
      setPendingPath(to);
      setIsPageLoading(true);

      maxTimerRef.current = setTimeout(() => {
        finishPageLoad();
      }, MAX_LOCK_MS);
    },
    [clearTimers, finishPageLoad],
  );

  const registerDeferredMount = useCallback(() => {
    deferredCountRef.current += 1;
    bumpDeferred((n) => n + 1);
    return () => {
      deferredCountRef.current = Math.max(0, deferredCountRef.current - 1);
      bumpDeferred((n) => n + 1);
    };
  }, []);

  // Setelah route sampai: DeferredMount yang finish, atau settle untuk halaman ringan
  useEffect(() => {
    if (!isPageLoading || !pendingPath) return;
    if (location.pathname !== pendingPath) return;

    // Tunggu DeferredMount sempat register (useEffect child)
    const arm = window.setTimeout(() => {
      if (deferredCountRef.current > 0) {
        // Tunggu DeferredMount.finishPageLoad()
        return;
      }
      settleTimerRef.current = setTimeout(() => {
        finishPageLoad();
      }, LIGHT_PAGE_SETTLE_MS);
    }, 60);

    return () => {
      window.clearTimeout(arm);
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    };
  }, [location.pathname, isPageLoading, pendingPath, finishPageLoad]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const value = useMemo(
    () => ({
      isPageLoading,
      pendingPath,
      beginNavigation,
      finishPageLoad,
      registerDeferredMount,
    }),
    [
      isPageLoading,
      pendingPath,
      beginNavigation,
      finishPageLoad,
      registerDeferredMount,
    ],
  );

  return (
    <PageLoadGateContext.Provider value={value}>
      {children}
    </PageLoadGateContext.Provider>
  );
};

export const usePageLoadGate = (): PageLoadGateContextValue => {
  const ctx = useContext(PageLoadGateContext);
  if (!ctx) {
    return {
      isPageLoading: false,
      pendingPath: null,
      beginNavigation: () => undefined,
      finishPageLoad: () => undefined,
      registerDeferredMount: () => () => undefined,
    };
  }
  return ctx;
};
