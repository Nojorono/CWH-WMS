import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import Select from "react-select";
import DatePicker from "../form/date-picker";
import Button from "../ui/button/Button";
import Checkbox from "../form/input/Checkbox";

type OptionType = { value: string | boolean; label: string };

export type FormField = {
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
    | "username";
  options?: OptionType[];
  validation?: {
    required?: boolean | string;
    [key: string]: any;
  };
  info?: string;
  hiddenWhen?: (values: Record<string, any>) => boolean;
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
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            // Eye-off icon
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
            // Eye icon
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

    // Call original onChange if exists
    registerProps.onChange?.(e);

    if (val.includes(" ")) {
      setHint("⚠️ Username tidak boleh mengandung spasi.");
    } else if (val && !/^[a-z0-9_]+$/.test(val)) {
      setHint(
        "💡 Disarankan menggunakan snake_case (huruf kecil, angka, dan underscore saja).",
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
          className={`text-xs mt-1 ${
            hint.startsWith("⚠️") ? "text-red-500" : "text-yellow-600"
          }`}
        >
          {hint}
        </p>
      )}
      {!hint && !isDisabled && (
        <p className="text-xs mt-1 text-gray-400">
          Gunakan snake_case, contoh:{" "}
          <span className="font-mono">john_doe</span>
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
  } = useForm<FormValues>({ defaultValues });

  const [isEditing, setIsEditing] = useState(false);
  const values = watch();

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  const inputCls =
    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300";
  const disabledCls =
    "w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed text-gray-500";

  const isDisabled = isEditMode && !isEditing;

  const renderField = (field: FormField) => {
    if (field.hiddenWhen?.(values)) return null;

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            {...register(field.name, field.validation)}
            className={isDisabled ? disabledCls : inputCls}
            disabled={isDisabled}
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
                    validate: (value) =>
                      (value !== undefined && value !== null && value !== "") ||
                      field.validation?.required ||
                      "Required",
                  }
                : {}),
              ...field.validation,
            }}
            render={({ field: controllerField }) => (
              <Select
                {...controllerField}
                options={field.options}
                placeholder="Select an option"
                className="react-select-container"
                classNamePrefix="react-select"
                value={field.options?.find(
                  (opt) => opt.value === controllerField.value,
                )}
                onChange={(option) =>
                  controllerField.onChange(option?.value ?? "")
                }
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
            )}
          />
        );

      case "file":
        return (
          <input
            type="file"
            {...register(field.name, field.validation)}
            className={isDisabled ? disabledCls : inputCls}
            disabled={isDisabled}
          />
        );

      case "date":
        return (
          <Controller
            name={field.name}
            control={control}
            rules={field.validation}
            render={({ field: controllerField }) => (
              <DatePicker
                id={`date-${field.name}`}
                placeholder="Select a date"
                onChange={(date: Date | Date[]) =>
                  controllerField.onChange(Array.isArray(date) ? date[0] : date)
                }
                readOnly={isDisabled}
              />
            )}
          />
        );

      case "checkbox":
        return (
          <>
            <Controller
              name={field.name}
              control={control}
              render={({ field: controllerField }) => (
                <Checkbox
                  label={field.label}
                  checked={controllerField.value || false}
                  onChange={controllerField.onChange}
                  disabled={isDisabled}
                />
              )}
            />
            {field.info && (
              <p className="text-sm text-gray-500 mt-1 italic">{field.info}</p>
            )}
          </>
        );

      // ── NEW: password with show/hide ───────────────────────────────────────
      case "password":
        return (
          <PasswordField
            registerProps={register(field.name, field.validation)}
            isDisabled={isDisabled}
            inputCls={inputCls}
            disabledCls={disabledCls}
          />
        );

      // ── NEW: username – freetext, no spaces, snake_case recommended ────────
      case "username":
        return (
          <UsernameField
            registerProps={register(field.name, {
              ...field.validation,
              validate: {
                noSpaces: (v: string) =>
                  !v?.includes(" ") || "Username tidak boleh mengandung spasi",
                ...(field.validation?.validate ?? {}),
              },
            })}
            isDisabled={isDisabled}
            inputCls={inputCls}
            disabledCls={disabledCls}
          />
        );

      default:
        return (
          <input
            type={field.type}
            {...register(field.name, field.validation)}
            className={isDisabled ? disabledCls : inputCls}
            disabled={isDisabled}
          />
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
    <div className="mx-auto mt-5 p-6 rounded-md bg-white shadow">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-5">
        <div
          className={`grid ${
            right.length > 0 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          } gap-6`}
        >
          {[left, right].map(
            (fields, idx) =>
              fields.length > 0 && (
                <div key={idx}>
                  {fields.map((field) => {
                    if (field.hiddenWhen?.(values)) return null;

                    return (
                      <div key={field.name} className="mb-4">
                        {field.type !== "checkbox" && (
                          <label className="block text-sm font-medium mb-1">
                            {field.label}
                          </label>
                        )}
                        {renderField(field)}
                        {errors[field.name] && (
                          <p className="text-red-500 text-sm mt-1">
                            {(errors[field.name] as any).message}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ),
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
          {(!isEditMode || isEditing) && (
            <Button type="submit" variant="secondary" size="md">
              Submit
            </Button>
          )}
          {isEditMode && !isEditing && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setIsEditing(true)}
            >
              Update
            </Button>
          )}
          <Button type="button" variant="danger" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ModalForm;
