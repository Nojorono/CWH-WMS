import React, { useEffect, useState } from "react";
import { usePageLoadGate } from "../../context/PageLoadGateContext";

type DeferredMountProps = {
  children: React.ReactNode;
  /** Delay sebelum mount konten berat — batalkan jika unmount (pindah menu cepat) */
  delayMs?: number;
  fallback?: React.ReactNode;
};

const DefaultFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center bg-slate-50/50">
    <div className="flex flex-col items-center gap-3">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
      <p className="text-xs font-medium text-slate-400">Memuat halaman…</p>
    </div>
  </div>
);

/**
 * Tunda mount children sebentar. Saat klik menu cepat, cleanup clearTimeout
 * sehingga render berat / fetch di children tidak sempat jalan.
 * Juga memberi sinyal ke sidebar PageLoadGate saat halaman siap.
 */
export function DeferredMount({
  children,
  delayMs = 180,
  fallback = <DefaultFallback />,
}: DeferredMountProps) {
  const [ready, setReady] = useState(false);
  const { registerDeferredMount, finishPageLoad } = usePageLoadGate();

  useEffect(() => {
    const unregister = registerDeferredMount();
    return unregister;
  }, [registerDeferredMount]);

  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  useEffect(() => {
    if (ready) finishPageLoad();
  }, [ready, finishPageLoad]);

  if (!ready) return <>{fallback}</>;
  return <>{children}</>;
}

export default DeferredMount;
