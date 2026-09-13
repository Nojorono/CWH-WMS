import React, { useMemo } from "react";
import { usePageLoadGate } from "../../context/PageLoadGateContext";
import { useDynamicSidebarItems } from "../../layout/useDynamicSidebarItems";

/** Ubah path jadi label yang lebih manusiawi */
const pathToFallbackLabel = (path: string) =>
  path
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean)
    .map((part) =>
      part
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    )
    .join(" / ");

/**
 * Overlay global di area konten utama saat navigasi sidebar.
 * Tidak perlu di-set per halaman — cukup pakai PageLoadGate.
 */
export default function PageLoadOverlay() {
  const { isPageLoading, pendingPath } = usePageLoadGate();
  const { menuItems, settingsItems } = useDynamicSidebarItems();

  const targetLabel = useMemo(() => {
    if (!pendingPath) return null;

    const all = [...menuItems, ...settingsItems];
    for (const item of all) {
      if (item.path === pendingPath) return item.name;
      const sub = item.subItems?.find((s) => s.path === pendingPath);
      if (sub) return sub.name;
    }
    return pathToFallbackLabel(pendingPath);
  }, [menuItems, pendingPath, settingsItems]);

  if (!isPageLoading) return null;

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-[60] flex items-start justify-center bg-slate-50/70 pt-24 backdrop-blur-[2px] dark:bg-slate-950/50"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-4 flex flex-col items-center rounded-2xl border border-slate-200/80 bg-white/10 px-6 py-4 shadow-md backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90">
        {/* Semi-Circle Gauge Arc */}
        <div className="relative flex h-12 w-24 justify-center overflow-hidden">
          <div className="h-24 w-24 rounded-full border-[5px] border-amber-500/20 border-t-amber-500 border-r-orange-500 animate-[spin_1.5s_linear_infinite] dark:border-amber-400/20 dark:border-t-amber-400 dark:border-r-orange-400" />
        </div>

        <div className="mt-2 text-center">
          <p className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">
            Memuat halaman…
          </p>
          {targetLabel && (
            <p className="max-w-[200px] truncate text-xs text-slate-500 dark:text-slate-400">
              {targetLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
