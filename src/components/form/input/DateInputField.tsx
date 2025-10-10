import React, { FC, ChangeEvent } from "react";
import { FiCalendar } from "react-icons/fi";

interface DateInputProps {
  label?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  value?: string;
  className?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
}

const DateInputField: FC<DateInputProps> = ({
  label,
  placeholder = "Select date",
  onChange,
  value = "",
  className = "",
  disabled = false,
  min,
  max,
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          min={min}
          max={max}
          className={`h-10 w-[200px] border border-gray-300 rounded-lg px-3 pr-10 text-sm text-gray-700
            placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-0
            ${disabled ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""}`}
        />

        <FiCalendar
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          size={18}
        />
      </div>
    </div>
  );
};

export default DateInputField;
