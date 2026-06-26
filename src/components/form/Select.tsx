import React from "react";
import ReactSelect, { MultiValue, SingleValue } from "react-select";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  // Ubah tipe data agar bisa menerima string atau array string
  onChange: (value: any) => void; 
  className?: string;
  value?: string | string[]; // Bisa string tunggal atau array
  width?: string | number;
  disabled?: boolean;
  isMulti?: boolean; // Tambahkan prop ini
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  value,
  width = "200px",
  disabled = false,
  isMulti = false, // Defaultnya false
}) => {
  // Logika untuk menentukan nilai yang terpilih
  const selectedOption = isMulti
    ? options.filter((opt) => (value as string[])?.includes(opt.value))
    : options.find((opt) => opt.value === value);

  const handleChange = (newValue: SingleValue<Option> | MultiValue<Option>) => {
    if (!disabled) {
      if (isMulti) {
        // Jika multi, kirim array ID saja ke parent
        const values = (newValue as MultiValue<Option>).map((opt) => opt.value);
        onChange(values);
      } else {
        // Jika single, kirim string ID saja
        onChange((newValue as SingleValue<Option>)?.value || "");
      }
    }
  };

  return (
    <ReactSelect
      isMulti={isMulti} // Teruskan ke react-select
      className={className}
      options={options}
      placeholder={placeholder}
      value={selectedOption || null}
      onChange={handleChange}
      classNamePrefix="react-select"
      menuPlacement="auto"
      menuPosition="fixed"
      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
      styles={{
        control: (base) => ({
          ...base,
          borderRadius: "0.5rem",
          borderColor: "#d1d5db",
          boxShadow: "none",
          "&:hover": { borderColor: "#a1a1aa" },
          minWidth: width, // Gunakan minWidth agar fleksibel saat multi-select memanjang
          backgroundColor: disabled ? "#f3f4f6" : base.backgroundColor,
          cursor: disabled ? "not-allowed" : "pointer",
        }),
        menuPortal: (base) => ({
          ...base,
          zIndex: 999999999999,
        }),
      }}
      isDisabled={disabled}
    />
  );
};

export default Select;