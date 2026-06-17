import React, { useEffect } from "react";
import {
  Controller,
  useFormContext,
  UseFormWatch,
  RegisterOptions,
} from "react-hook-form";
import Select from "react-select";
import DatePicker from "../../../form/date-picker";

export interface Option {
  value: string;
  label: string;
}

export type FieldConfig = {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "select"
    | "custom"
    | "date"
    | "radio"
    | "file"
    | "tel"
    | "number";
  options?: Option[];
  element?: React.ReactNode;
  disabled?: boolean;
  validation?: RegisterOptions;
  readonly?: boolean;
};

interface DynamicFormProps {
  fields: FieldConfig[];
  onSubmit: (data: any) => void;
  defaultValues?: Record<string, any>;
  control: any;
  register: any;
  setValue: any;
  handleSubmit: any;
  watch: UseFormWatch<any>;
  isEditMode?: boolean;
  onEditToggle?: () => void;
  errors?: Record<string, any>;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  defaultValues = {},
  control,
  register,
  setValue,
  handleSubmit,
  watch,
  isEditMode = true,
  errors,
}) => {
  const formContext = useFormContext();
  const effectiveWatch = watch || formContext?.watch;
  const effectiveErrors = errors || formContext?.formState?.errors || {};
  const selectedSource = effectiveWatch?.("selected_source") || { type: "" };

  useEffect(() => {
    Object.entries(defaultValues).forEach(([key, value]) => {
      setValue(key, value);
    });
  }, [defaultValues, setValue]);

  const commonClasses =
    "w-full px-3 py-[6px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const errorClasses =
    "w-full px-3 py-[6px] border border-red-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm";
  const disabledClasses = "bg-gray-100 text-gray-500 cursor-not-allowed";

  const shouldRenderField = (fieldName: string) => {
    if (fieldName === "po_no") return selectedSource.type === "PO";
    if (fieldName === "so_no" || fieldName === "so_type")
      return selectedSource.type === "SO";
    return true;
  };  

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 md:grid-cols-4 gap-4"
    >
      {fields.map((field) => {
        if (!shouldRenderField(field.name)) return null;

        const isDisabled = !isEditMode || field.disabled;
        const fieldError = effectiveErrors?.[field.name];
        const isReadOnly = field.readonly || (isDisabled && field.readonly !== false);

        return (
          <div key={field.name} className="flex flex-col">
            <label className="text-sm font-semibold text-gray-800 mb-1">
              {field.label}
            </label>

            {/* TEXT */}
            {field.type === "text" && (
              <input
                type="text"
                {...register(field.name, {
                  ...field.validation,
                  required: true,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    e.target.value = e.target.value.toUpperCase();
                  },
                  setValueAs: (v: string) => (v ? v.toUpperCase() : v),
                })}
                className={`${fieldError ? errorClasses : commonClasses} ${
                  isDisabled ? disabledClasses : ""
                }`}
                disabled={isDisabled && !isReadOnly}
                readOnly={isReadOnly}
              />
            )}

            {/* NUMBER */}
            {field.type === "number" && (
              <input
                type="number"
                {...register(field.name, {
                  ...field.validation,
                  required: true,
                })}
                className={`${fieldError ? errorClasses : commonClasses} ${
                  isDisabled ? disabledClasses : ""
                }`}
                disabled={isDisabled && !isReadOnly}
                readOnly={isReadOnly}
              />
            )}

            {/* TEXTAREA */}
            {field.type === "textarea" && (
              <textarea
                {...register(field.name, {
                  ...field.validation,
                  required: true,
                })}
                rows={3}
                className={`${fieldError ? errorClasses : commonClasses} ${
                  isDisabled ? disabledClasses : ""
                }`}
                disabled={isDisabled && !isReadOnly}
                readOnly={isReadOnly}
              />
            )}

            {/* SELECT */}
            {field.type === "select" && field.options && (
              <Controller
                name={field.name}
                control={control}
                rules={{ ...field.validation, required: true }}
                render={({ field: controllerField }) => (
                  <Select
                    {...controllerField}
                    options={field.options}
                    classNamePrefix="react-select"
                    isDisabled={isDisabled}
                    menuPortalTarget={document.body}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: isDisabled ? "#f3f4f6" : "white",
                        borderColor: fieldError ? "#f87171" : base.borderColor,
                        boxShadow: fieldError
                          ? "0 0 0 1px #f87171"
                          : state.isFocused
                            ? "0 0 0 1px #3b82f6"
                            : base.boxShadow,
                        "&:hover": {
                          borderColor: fieldError ? "#f87171" : "#3b82f6",
                        },
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: isDisabled ? "#9ca3af" : base.color,
                      }),
                      menuPortal: (base) => ({
                        ...base,
                        zIndex: 9999,
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 9999,
                      }),
                    }}
                  />
                )}
              />
            )}

            {/* DATE */}
            {field.type === "date" && (
              <Controller
                name={field.name}
                control={control}
                rules={{ ...field.validation, required: true }}
                render={({ field: controllerField, fieldState }) => (
                  <DatePicker
                    id={controllerField.name}
                    label=""
                    value={controllerField.value}
                    onChange={([date]: Date[]) =>
                      controllerField.onChange(date)
                    }
                    readOnly={isDisabled}
                    hasError={!!fieldState.error}
                  />
                )}
              />
            )}

            {/* FILE */}
            {field.type === "file" && (
              <input
                type="file"
                {...register(field.name, {
                  ...field.validation,
                  required: true,
                })}
                className={`${fieldError ? errorClasses : commonClasses} ${
                  isDisabled ? disabledClasses : ""
                }`}
                disabled={isDisabled && !isReadOnly}
                readOnly={isReadOnly}
              />
            )}

            {field.type === "tel" && (
              <div className="flex items-center w-full">
                <span className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 border-r-0 rounded-l-md select-none">
                  +62
                </span>

                <input
                  type="tel"
                  {...register(field.name, {
                    ...field.validation,
                    required: true,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.replace(/\D/g, "");
                    },
                    setValueAs: (v: string) =>
                      v ? `+62${v.replace(/^0+/, "")}` : "",
                  })}
                  placeholder="Masukkan nomor telepon"
                  className={`w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-r-md rounded-l-none transition-all ${
                    fieldError
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : ""
                  } ${
                    isDisabled
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={isDisabled && !isReadOnly}
                  readOnly={isReadOnly}
                />
              </div>
            )}

            {/* CUSTOM */}
            {field.type === "custom" && field.element && (
              <div className="flex items-center gap-2">{field.element}</div>
            )}

            {/* ERROR */}
            {fieldError && (
              <span className="text-xs text-red-500 mt-1">
                {fieldError.message}
              </span>
            )}
          </div>
        );
      })}
    </form>
  );
};

export default DynamicForm;
