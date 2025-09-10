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
    | "number";
  options?: Option[];
  element?: React.ReactNode;
  disabled?: boolean;
  validation?: RegisterOptions;
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

        return (
          <div key={field.name} className="flex flex-col">
            <label className="text-sm font-semibold text-gray-800 mb-1">
              {field.label}
            </label>

            {/* TEXT */}
            {field.type === "text" && (
              <input
                type="text"
                {...register(field.name, field.validation)}
                className={`${fieldError ? errorClasses : commonClasses} ${
                  isDisabled ? disabledClasses : ""
                }`}
                disabled={isDisabled}
                readOnly={isDisabled}
              />
            )}

            {/* NUMBER */}
            {field.type === "number" && (
              <input
                type="number"
                {...register(field.name, field.validation)}
                className={`${fieldError ? errorClasses : commonClasses} ${
                  isDisabled ? disabledClasses : ""
                }`}
                disabled={isDisabled}
                readOnly={isDisabled}
              />
            )}

            {/* TEXTAREA */}
            {field.type === "textarea" && (
              <textarea
                {...register(field.name, field.validation)}
                rows={3}
                className={`${fieldError ? errorClasses : commonClasses} ${
                  isDisabled ? disabledClasses : ""
                }`}
                disabled={isDisabled}
                readOnly={isDisabled}
              />
            )}

            {/* SELECT */}
            {field.type === "select" && field.options && (
              <Controller
                name={field.name}
                control={control}
                rules={field.validation}
                render={({ field: controllerField }) => (
                  <Select
                    {...controllerField}
                    options={field.options}
                    classNamePrefix="react-select"
                    isDisabled={isDisabled}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: isDisabled ? "#f3f4f6" : "white",
                        borderColor: fieldError ? "#f87171" : base.borderColor, // merah jika error
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
                rules={field.validation}
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
                {...register(field.name, field.validation)}
                className={`${fieldError ? errorClasses : commonClasses} ${
                  isDisabled ? disabledClasses : ""
                }`}
                disabled={isDisabled}
                readOnly={isDisabled}
              />
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

// import React, { useEffect } from "react";
// import { Controller, useFormContext, UseFormWatch, RegisterOptions } from "react-hook-form";
// import Select from "react-select";
// import DatePicker from "../../../form/date-picker";

// export interface Option {
//   value: string;
//   label: string;
// }

// export type FieldConfig = {
//   name: string;
//   label: string;
//   type: "text" | "textarea" | "select" | "custom" | "date" | "radio" | "file";
//   options?: Option[];
//   element?: React.ReactNode;
//   disabled?: boolean;
//   validation?: RegisterOptions; // Tambahkan ini
// };

// interface DynamicFormProps {
//   fields: FieldConfig[];
//   onSubmit: (data: any) => void;
//   defaultValues?: Record<string, any>;
//   control: any;
//   register: any;
//   setValue: any;
//   handleSubmit: any;
//   watch: UseFormWatch<any>;
//   isEditMode?: boolean;
//   onEditToggle?: () => void;
//   errors?: Record<string, any>; // Tambahkan ini jika ingin tampilkan error
// }

// const DynamicForm: React.FC<DynamicFormProps> = ({
//   fields,
//   onSubmit,
//   defaultValues = {},
//   control,
//   register,
//   setValue,
//   handleSubmit,
//   watch,
//   isEditMode,
//   errors = {},
// }) => {
//   const formContext = useFormContext?.();
//   const effectiveWatch = watch || formContext?.watch;
//   const selectedSource = effectiveWatch
//     ? effectiveWatch("selected_source") || "PO"
//     : "PO";

//   useEffect(() => {
//     Object.entries(defaultValues).forEach(([key, value]) => {
//       setValue(key, value);
//     });
//   }, [defaultValues, setValue]);

//   const commonClasses =
//     "w-full px-3 py-[6px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
//   const disabledClasses = "bg-gray-100 text-gray-500 cursor-not-allowed";

//   const shouldRenderField = (fieldName: string) => {
//     if (fieldName === "po_no") return selectedSource.value === "PO";
//     if (fieldName === "so_no") return selectedSource.value === "SO";
//     if (fieldName === "so_type") return selectedSource.value === "SO";
//     return true;
//   };

//   return (
//     <form
//       onSubmit={handleSubmit(onSubmit)}
//       className="grid grid-cols-1 md:grid-cols-4 gap-4"
//     >
//       {fields.map((field) => {
//         if (!shouldRenderField(field.name)) return null;

//         return (
//           <div key={field.name} className="flex flex-col">
//             <label className="text-sm font-semibold text-gray-800 mb-1">
//               {field.label}
//             </label>

//             {/* TEXT */}
//             {field.type === "text" && (
//               <input
//                 type="text"
//                 {...register(field.name, field.validation)}
//                 className={`${commonClasses} ${
//                   !isEditMode || field.disabled ? disabledClasses : ""
//                 }`}
//                 disabled={!isEditMode || field.disabled}
//                 readOnly={!isEditMode || field.disabled}
//               />
//             )}
//             {/* Error */}
//             {errors[field.name] && (
//               <span className="text-xs text-red-500">{errors[field.name].message}</span>
//             )}

//             {/* TEXTAREA */}
//             {field.type === "textarea" && (
//               <textarea
//                 {...register(field.name, field.validation)}
//                 rows={3}
//                 className={`${commonClasses} ${
//                   !isEditMode || field.disabled ? disabledClasses : ""
//                 }`}
//                 disabled={!isEditMode || field.disabled}
//                 readOnly={!isEditMode || field.disabled}
//               />
//             )}
//             {errors[field.name] && (
//               <span className="text-xs text-red-500">{errors[field.name].message}</span>
//             )}

//             {/* SELECT */}
//             {field.type === "select" && field.options && (
//               <Controller
//                 name={field.name}
//                 control={control}
//                 rules={field.validation}
//                 render={({ field: controllerField }) => (
//                   <Select
//                     {...controllerField}
//                     options={field.options}
//                     className={`react-select-container text-sm ${
//                       !isEditMode || field.disabled
//                         ? "bg-gray-100 text-gray-400"
//                         : ""
//                     }`}
//                     classNamePrefix="react-select"
//                     isDisabled={!isEditMode || field.disabled}
//                     styles={
//                       !isEditMode || field.disabled
//                         ? {
//                             control: (base) => ({
//                               ...base,
//                               backgroundColor: "#f3f4f6",
//                               color: "#9ca3af",
//                               cursor: "not-allowed",
//                             }),
//                             singleValue: (base) => ({
//                               ...base,
//                               color: "#9ca3af",
//                             }),
//                           }
//                         : undefined
//                     }
//                   />
//                 )}
//               />
//             )}
//             {errors[field.name] && (
//               <span className="text-xs text-red-500">{errors[field.name].message}</span>
//             )}

//             {/* DATE */}
//             {field.type === "date" && (
//               <Controller
//                 control={control}
//                 name={field.name}
//                 rules={field.validation}
//                 render={({ field: controllerField }) => (
//                   <DatePicker
//                     id={controllerField.name}
//                     label=""
//                     defaultDate={controllerField.value}
//                     onChange={([date]: Date[]) =>
//                       controllerField.onChange(date)
//                     }
//                     readOnly={!isEditMode || field.disabled}
//                   />
//                 )}
//               />
//             )}
//             {errors[field.name] && (
//               <span className="text-xs text-red-500">{errors[field.name].message}</span>
//             )}

//             {/* FILE */}
//             {field.type === "file" && (
//               <input
//                 type="file"
//                 {...register(field.name, field.validation)}
//                 className={`${commonClasses} ${
//                   !isEditMode || field.disabled ? disabledClasses : ""
//                 }`}
//                 disabled={!isEditMode || field.disabled}
//                 readOnly={!isEditMode || field.disabled}
//               />
//             )}
//             {errors[field.name] && (
//               <span className="text-xs text-red-500">{errors[field.name].message}</span>
//             )}

//             {/* CUSTOM */}
//             {field.type === "custom" && field.element && (
//               <div className="flex items-center gap-2">{field.element}</div>
//             )}
//           </div>
//         );
//       })}
//     </form>
//   );
// };

// export default DynamicForm;
