import React, { forwardRef } from "react";

interface RadioProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  id: string;
  label: string;
  onChange: (value: string) => void;
  // Props lain seperti name, value, checked, disabled sudah masuk ke dalam InputHTMLAttributes
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      id,
      label,
      onChange,
      className = "",
      disabled = false,
      checked,
      value,
      ...props
    },
    ref,
  ) => {
    // Handler untuk memastikan value yang dikirim adalah string saat perubahan
    const handleChange = () => {
      if (!disabled && onChange) {
        onChange(String(value));
      }
    };

    return (
      <label
        htmlFor={id}
        className={`
          relative flex cursor-pointer select-none items-center gap-3 text-sm font-medium transition-all duration-200
          ${
            disabled
              ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
              : "text-gray-700 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400"
          } 
          ${className}
        `}
      >
        <input
          {...props}
          ref={ref}
          id={id}
          type="radio"
          value={value}
          checked={checked}
          onChange={handleChange}
          className="sr-only"
          disabled={disabled}
        />

        {/* Outer Circle */}
        <span
          className={`
            flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] transition-all duration-200
            ${
              checked
                ? "border-brand-500 bg-brand-500 shadow-sm shadow-brand-200"
                : "bg-transparent border-gray-300 dark:border-gray-700"
            } 
            ${
              disabled
                ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-800"
                : ""
            }
          `}
        >
          {/* Inner Dot */}
          <span
            className={`
              h-2 w-2 rounded-full bg-white transition-transform duration-200
              ${checked ? "scale-100 opacity-100" : "scale-0 opacity-0"}
            `}
          ></span>
        </span>

        {label}
      </label>
    );
  },
);

Radio.displayName = "Radio";

export default Radio;
