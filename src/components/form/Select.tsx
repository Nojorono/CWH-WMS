import React from "react";
import ReactSelect, { SingleValue } from "react-select";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  value?: string;
  width?: string | number; // ✅ bisa dikirim dari luar, misal "100%" atau 300
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  value,
  width = "200px", // ✅ default width 200px
}) => {
  const selectedOption = options.find((option) => option.value === value);

  const handleChange = (selectedOption: SingleValue<Option>) => {
    onChange(selectedOption?.value || "");
  };

  return (
    <ReactSelect
      className={className}
      options={options}
      placeholder={placeholder}
      value={selectedOption || null}
      onChange={handleChange}
      classNamePrefix="react-select"
      styles={{
        control: (base) => ({
          ...base,
          borderRadius: "0.5rem",
          borderColor: "#d1d5db",
          boxShadow: "none",
          "&:hover": { borderColor: "#a1a1aa" },
          width, // ✅ dinamis: pakai prop width dari luar
        }),
        menu: (base) => ({
          ...base,
          width,
        }),
        placeholder: (base) => ({
          ...base,
          color: "#9ca3af",
        }),
        singleValue: (base) => ({
          ...base,
          width,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }),
      }}
    />
  );
};

export default Select;
