import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import Select from "react-select";
import DatePicker from "../form/date-picker";
import Button from "../ui/button/Button";
import Checkbox from "../form/input/Checkbox";
import Radio from "../form/input/Radio";

type OptionType = { value: string | boolean; label: string };

export type FormField = {
  readOnly: boolean;
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "select"
    | "number"
    | "file"
    | "date"
    | "checkbox"
    | "radio"
    | "password"
    | "phone"
    | "email"
    | "username"
    | "custom";
  options?: OptionType[];
  validation?: {
    required?: boolean | string;
    [key: string]: any;
  };
  info?: string;
  hiddenWhen?: (values: Record<string, any>) => boolean;
  onChange?: (value: any) => void;
  placeholder?: string;
  description?: string;
  renderCustom?: (methods: {
    control: any;
    register: any;
    setValue?: any;
    watch: any;
    errors: any;
  }) => React.ReactNode;
};

export type FormValues = Record<string, any>;

type ModalFormProps = {
  formFields: FormField[];
  onSubmit: SubmitHandler<FormValues>;
  onClose: () => void;
  defaultValues?: FormValues;
  isEditMode?: boolean;
};

// ─── Password Field with show/hide toggle ────────────────────────────────────
const PasswordField: React.FC<{
  registerProps: any;
  isDisabled: boolean;
  inputCls: string;
  disabledCls: string;
}> = ({ registerProps, isDisabled, inputCls, disabledCls }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        {...registerProps}
        className={`${isDisabled ? disabledCls : inputCls} pr-10`}
        disabled={isDisabled}
        autoComplete="current-password"
        style={{ textTransform: "none" }}
      />
      {!isDisabled && (
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          tabIndex={-1}
        >
          {show ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7 0-1.14.504-2.17 1.3-3.07M6.1 6.1A9.956 9.956 0 0112 5c5 0 9 4 9 7a9.97 9.97 0 01-2.1 3.9M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

// ─── Username Field with snake_case hint ─────────────────────────────────────
const UsernameField: React.FC<{
  registerProps: any;
  isDisabled: boolean;
  inputCls: string;
  disabledCls: string;
}> = ({ registerProps, isDisabled, inputCls, disabledCls }) => {
  const [hint, setHint] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    registerProps.onChange?.(e);

    if (val.includes(" ")) {
      setHint("⚠️ Username tidak boleh mengandung spasi.");
    } else if (val && !/^[a-z0-9_]+$/.test(val)) {
      setHint(
        "💡 Disarankan menggunakan snake_case (kecil, angka, underscore).",
      );
    } else {
      setHint(null);
    }
  };

  return (
    <div>
      <input
        type="text"
        {...registerProps}
        onChange={handleChange}
        className={isDisabled ? disabledCls : inputCls}
        disabled={isDisabled}
        autoComplete="username"
        spellCheck={false}
      />
      {hint && (
        <p
          className={`text-xs mt-1 ${hint.startsWith("⚠️") ? "text-red-500" : "text-yellow-600"}`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

// ─── Main ModalForm ───────────────────────────────────────────────────────────
const ModalForm: React.FC<ModalFormProps> = ({
  formFields,
  onSubmit,
  onClose,
  defaultValues,
  isEditMode = false,
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormValues>({ defaultValues });

  const [isEditing, setIsEditing] = useState(false);
  const values = watch();

  useEffect(() => {
    if (isEditMode && defaultValues) {
      reset(defaultValues);
    } else if (!isEditMode) {
      reset({
        ...defaultValues,
        isActive: true,
      });
    }
  }, [defaultValues, reset, isEditMode]);

  const inputCls =
    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300 transition-all";
  const disabledCls =
    "w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed text-gray-500";

  const isDisabled = isEditMode && !isEditing;

  const renderField = (field: FormField) => {
    if (field.hiddenWhen?.(values)) return null;

    switch (field.type) {
      case "custom":
        return field.renderCustom
          ? field.renderCustom({ control, register, setValue, watch, errors })
          : null;

      case "textarea":
        return (
          <textarea
            {...register(field.name, field.validation)}
            className={isDisabled ? disabledCls : inputCls}
            disabled={isDisabled}
            rows={3}
          />
        );

      case "select":
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              ...(field.validation?.required
                ? {
                    validate: (v) => {
                      // Modifikasi pengecekan di sini:
                      // Izinkan null, tapi larang string kosong "" atau undefined
                      if (v === null) return true;
                      return (
                        (v !== undefined && v !== "") ||
                        field.validation?.required ||
                        "Required"
                      );
                    },
                  }
                : {}),
              ...field.validation,
            }}
            render={({ field: controllerField }) => (
              <Select
                {...controllerField}
                options={field.options}
                placeholder={field.placeholder || "Select..."}
                classNamePrefix="react-select"
                value={
                  field.options?.find(
                    (opt) => opt.value === controllerField.value,
                  ) ||
                  (controllerField.value === null
                    ? field.options?.find((opt) => opt.value === null)
                    : null)
                }
                isDisabled={isDisabled}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  control: (base) => ({
                    ...base,
                    borderColor: errors[field.name]
                      ? "#ef4444"
                      : base.borderColor,
                  }),
                }}
                menuPortalTarget={document.body}
                onChange={(opt) => {
                  const value = opt ? opt.value : "";
                  controllerField.onChange(value);
                  if (typeof (field as any).onChange === "function") {
                    (field as any).onChange(value);
                  }
                }}
              />
            )}
          />
        );

      case "email":
        return (
          <input
            type="email"
            {...register(field.name, {
              ...field.validation,
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Format email tidak valid",
              },
            })}
            className={isDisabled ? disabledCls : inputCls}
            disabled={isDisabled}
            placeholder="example@mail.com"
          />
        );

      case "phone":
        return (
          <input
            type="text"
            {...register(field.name, {
              ...field.validation,
              minLength: { value: 9, message: "Minimal 9 angka" },
              pattern: { value: /^[0-9]+$/, message: "Hanya boleh angka" },
            })}
            onInput={(e: any) =>
              (e.target.value = e.target.value.replace(/[^0-9]/g, ""))
            }
            className={isDisabled ? disabledCls : inputCls}
            disabled={isDisabled}
            placeholder={field.placeholder || "081234567..."}
          />
        );

      case "password":
        return (
          <PasswordField
            registerProps={register(field.name, field.validation)}
            isDisabled={isDisabled}
            inputCls={inputCls}
            disabledCls={disabledCls}
          />
        );

      case "username":
        return (
          <UsernameField
            registerProps={register(field.name, {
              ...field.validation,
              validate: {
                noSpaces: (v: string) =>
                  !v?.includes(" ") || "Tidak boleh ada spasi",
              },
            })}
            isDisabled={isDisabled}
            inputCls={inputCls}
            disabledCls={disabledCls}
          />
        );

      case "checkbox":
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: ctrl }) => (
              <Checkbox
                label={field.label}
                checked={ctrl.value || false}
                onChange={ctrl.onChange}
                disabled={isDisabled}
              />
            )}
          />
        );

      case "radio":
        return (
          <Controller
            name={field.name}
            control={control}
            // 🔑 TAMBAHKAN INI: Agar validasi 'required' terbaca oleh Controller
            rules={field.validation}
            render={({ field: { onChange, value } }) => (
              <div className="flex gap-4">
                {field.options?.map((opt) => {
                  const stringValue = String(opt.value);

                  return (
                    <Radio
                      key={stringValue}
                      id={`${field.name}-${stringValue}`}
                      label={opt.label}
                      value={stringValue}
                      checked={String(value) === stringValue}
                      onChange={(val) => {
                        const finalValue =
                          opt.value === true || opt.value === false
                            ? val === "true"
                            : val;
                        onChange(finalValue);
                      }}
                      disabled={isDisabled}
                    />
                  );
                })}
              </div>
            )}
          />
        );

      case "date":
        return (
          <Controller
            name={field.name}
            control={control}
            rules={field.validation}
            render={({ field: ctrl }) => (
              <DatePicker
                id={field.name}
                onChange={(date: any) =>
                  ctrl.onChange(Array.isArray(date) ? date[0] : date)
                }
                readOnly={isDisabled}
              />
            )}
          />
        );

      default:
        return (
          <div>
            <input
              type={field.type}
              {...register(field.name, field.validation)}
              className={isDisabled || field.readOnly ? disabledCls : inputCls}
              disabled={isDisabled || field.readOnly}
              placeholder={field.placeholder}
            />
            {field.description && (
              <p className="text-xs text-gray-600 mt-1">{field.description}</p>
            )}
          </div>
        );
    }
  };

  const splitFields = (fields: FormField[]) => {
    if (fields.length <= 6) return { left: fields, right: [] };
    const mid = Math.ceil(fields.length / 2);
    return { left: fields.slice(0, mid), right: fields.slice(mid) };
  };

  const { left, right } = splitFields(formFields);

  return (
    <div className="mx-auto p-4 rounded-md bg-white">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div
          className={`grid ${right.length > 0 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"} gap-x-8 gap-y-4`}
        >
          {[left, right].map((group, gIdx) => (
            <div key={gIdx} className="space-y-4">
              {group.map((field) => {
                // 1. TAMBAHKAN PENGECEKAN DI SINI
                const isHidden = field.hiddenWhen?.(values);
                if (isHidden) return null; // Jika hidden, maka satu blok div ini tidak dirender

                return (
                  <div key={field.name}>
                    {field.type !== "checkbox" && (
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {field.label}
                      </label>
                    )}
                    {renderField(field)}
                    {errors[field.name] && (
                      <p className="text-red-500 text-xs mt-1">
                        {(errors[field.name] as any).message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
          {(!isEditMode || isEditing) && (
            <Button type="submit" variant="secondary">
              Submit
            </Button>
          )}
          {isEditMode && !isEditing && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
          <Button type="button" variant="danger" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ModalForm;
