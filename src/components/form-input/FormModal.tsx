import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import Select from "react-select";
import DatePicker from "../form/date-picker";
import Button from "../ui/button/Button";
import Checkbox from "../form/input/Checkbox";

type FormField = {
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
    | "radio";
  options?: { value: string | boolean; label: string }[];
  validation?: {
    required?: boolean | string;
    [key: string]: any;
  };
  info?: string;
};

type FormValues = Record<string, any>;

type FormInputProps = {
  formFields: FormField[];
  onSubmit: SubmitHandler<FormValues>;
  onClose: () => void;
  defaultValues?: FormValues;
  isEditMode?: boolean;
};

const ModalForm: React.FC<FormInputProps> = ({
  formFields,
  onSubmit,
  onClose,
  defaultValues,
  isEditMode,
}) => {
  const {
    register,
    handleSubmit: handleFormSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues,
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);  

  const handleSubmit = (data: FormValues) => {
    onSubmit(data); // Kirim data ke parent
  };

  const renderField = (field: FormField) => {
    const commonClasses =
      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300";

    const errorClasses =
      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-red-300 bg-gray-100 cursor-not-allowed text-gray-500";

    const isDisabled = isEditMode && !isEditing;

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            {...register(field.name, field.validation)}
            className={isDisabled ? errorClasses : commonClasses}
            disabled={isDisabled}
          />
        );
      case "select":
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              validate: (value) =>
                (value !== undefined &&
                  value !== null &&
                  value !== "") ||
                field.validation?.required ||
                "Required",
              ...field.validation,
            }}
            render={({ field: controllerField }) => (
              <Select
                {...controllerField}
                options={field.options}
                placeholder="Select an option"
                className={isDisabled ? errorClasses : "react-select-container"}
                classNamePrefix="react-select"
                value={field.options?.find(
                  (option) => option.value === controllerField.value
                )}
                onChange={(selectedOption) => {
                  const value =
                    selectedOption?.value === false
                      ? false
                      : selectedOption?.value;
                  controllerField.onChange(value);
                }}
                menuPlacement="auto"
                isDisabled={isDisabled}
                styles={{
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999, // ⬅️ pastikan dropdown berada di atas modal
                  }),
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
            className={isDisabled ? errorClasses : commonClasses}
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
                id="date-picker"
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
          <div>
            <Controller
              name={field.name}
              control={control}
              render={({ field: controllerField }) => (
                <Checkbox
                  label={field.name}
                  checked={controllerField.value || false}
                  onChange={(checked) => controllerField.onChange(checked)}
                  disabled={isEditMode && !isEditing}
                />
              )}
            />
            {field.info && (
              <p className="text-sm text-gray-500 mt-1 italic">{field.info}</p>
            )}
          </div>
        );
      case "text":
        return (
          <input
            type={field.type}
            {...register(field.name, field.validation)}
            className={isDisabled ? errorClasses : commonClasses}
            disabled={isDisabled}
          />
        );
      default:
        return (
          <input
            type={field.type}
            {...register(field.name, field.validation)}
            className={isDisabled ? errorClasses : commonClasses}
            disabled={isDisabled}
          />
        );
    }
  };

  // Split fields into two columns only if there are more than 6 fields
  const leftFields =
    formFields.length > 6
      ? formFields.slice(0, Math.ceil(formFields.length / 2))
      : formFields;
  const rightFields =
    formFields.length > 6
      ? formFields.slice(Math.ceil(formFields.length / 2))
      : [];

  return (
    <div className="mx-auto mt-5 p-6 rounded-md bg-red">
      <form
        onSubmit={handleFormSubmit(handleSubmit)}
        className="space-y-4 mb-5"
      >
        <div
          className={`grid ${
            formFields.length > 6 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          } gap-6`}
        >
          <div>
            {leftFields.map((field) => (
              <div key={field.name} className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  {field.label}
                </label>
                {renderField(field)}
                {errors[field.name] && (
                  <p className="text-red-500 text-sm mt-1">
                    {(errors[field.name] as any).message}
                  </p>
                )}
              </div>
            ))}
          </div>
          {rightFields.length > 0 && (
            <div>
              {rightFields.map((field) => (
                <div key={field.name} className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                  </label>
                  {renderField(field)}
                  {errors[field.name] && (
                    <p className="text-red-500 text-sm mt-1">
                      {(errors[field.name] as any).message}
                    </p>
                  )}
                </div>
              ))}
            </div>
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
              onClick={() => {
                setIsEditing(true);
              }}
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
