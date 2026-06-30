import { useState,  } from "react";

declare const process: {
  env: {
    NODE_ENV: string;
  };
};

export const BypassTimeController = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [customTime, setCustomTime] = useState("");

  // Hanya tampilkan di non-production
  if (process.env.NODE_ENV === "production") return null;

  const handleApply = () => {
    if (customTime) {
      localStorage.setItem("BYPASS_SOP_TIME", "true");
      localStorage.setItem("BYPASS_CUSTOM_TIME", customTime);
      window.location.reload(); // Refresh untuk apply perubahan ke hook
    }
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
          onClick={() => setIsVisible(!isVisible)}
          className="text-xs font-bold text-yellow-800 underline"
        >
          {isVisible
            ? "Hide Bypass Controls"
            : "Show Bypass Controls (QA Tool)"}
        </button>

        {isVisible && (
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              className="px-2 py-1 text-sm border rounded"
              onChange={(e) => setCustomTime(e.target.value)}
              value={customTime}
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
