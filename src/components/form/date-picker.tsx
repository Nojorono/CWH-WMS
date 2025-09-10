import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "../../icons";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  value?: DateOption; // ⬅️ tambah value supaya controlled
  label?: string;
  placeholder?: string;
  readOnly?: boolean;
  hasError?: boolean;
  position?:
    | "auto"
    | "above"
    | "below"
    | "auto left"
    | "auto center"
    | "auto right"
    | "above left"
    | "above center"
    | "above right"
    | "below left"
    | "below center"
    | "below right";
};

export default function DatePicker({
  id,
  mode = "single",
  onChange,
  value,
  label,
  placeholder,
  readOnly = false,
  hasError = false,
  position = "auto",
}: PropsType) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      fpRef.current = flatpickr(inputRef.current, {
        mode,
        static: true,
        monthSelectorType: "static",
        dateFormat: "Y-m-d",
        defaultDate: value, // init
        onChange,
        clickOpens: !readOnly,
        position,
      });
    }

    return () => {
      fpRef.current?.destroy();
      fpRef.current = null;
    };
  }, [id, mode, onChange, readOnly, position]);

  // 🔑 update flatpickr jika value berubah (termasuk reset)
  useEffect(() => {
    if (fpRef.current) {
      fpRef.current.setDate(value ?? [], false);
    }
  }, [value]);

  const inputClass = `
    h-11 w-full rounded-lg appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400
    ${
      readOnly
        ? "bg-gray-100 text-gray-500 border-gray-100 cursor-not-allowed"
        : hasError
        ? "!border-red-500 !ring-1 !ring-red-400 text-gray-800"
        : "border border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
    }
  `;

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className={`relative ${readOnly ? "cursor-not-allowed" : ""}`}>
        <input
          id={id}
          ref={inputRef}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`${inputClass} flatpickr-input`}
          style={{
            ...(readOnly ? { cursor: "not-allowed" } : {}),
            ...(hasError ? { borderColor: "red", borderWidth: "1px" } : {}),
          }}
        />
        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
