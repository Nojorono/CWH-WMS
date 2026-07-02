import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { useEffect, useRef, useState } from "react";

declare const process: {
  env: {
    NODE_ENV: string;
  };
};

export const BypassTimeController = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [customTime, setCustomTime] = useState(
    localStorage.getItem("BYPASS_CUSTOM_TIME") || "",
  );

  const inputRef = useRef<HTMLInputElement>(null);

  // Hanya tampilkan di non-production
  if (process.env.NODE_ENV === "production") return null;

  useEffect(() => {
    if (!isVisible || !inputRef.current) return;

    const fp = flatpickr(inputRef.current, {
      enableTime: true,
      enableSeconds: false,
      time_24hr: true,
      dateFormat: "Y-m-d H:i",
      defaultDate: customTime || undefined,
      onChange: (_, dateStr) => {
        setCustomTime(dateStr);
      },
    });

    return () => fp.destroy();
  }, [isVisible]);

  const handleApply = () => {
    if (!customTime) return;

    localStorage.setItem("BYPASS_SOP_TIME", "true");
    localStorage.setItem("BYPASS_CUSTOM_TIME", customTime);

    window.location.reload();
  };

  const handleReset = () => {
    localStorage.removeItem("BYPASS_SOP_TIME");
    localStorage.removeItem("BYPASS_CUSTOM_TIME");

    window.location.reload();
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg shadow-sm mb-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsVisible((prev) => !prev)}
          className="text-xs font-bold text-yellow-800 underline"
        >
          {isVisible
            ? "Hide Bypass Controls"
            : "Show Bypass Controls (QA Tool)"}
        </button>

        {isVisible && (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              className="px-2 py-1 text-sm border rounded w-56"
              placeholder="Select date & time"
            />

            <button
              onClick={handleApply}
              className="px-3 py-1 bg-yellow-600 text-white text-xs rounded font-bold"
            >
              Apply Bypass
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded font-bold"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
