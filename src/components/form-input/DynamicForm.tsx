import React from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";

export interface Option {
  value: string;
  label: string;
}

export type FieldConfig = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "role_format"; // added role_format
  options?: Option[]; // hanya untuk select
};

interface DynamicFormProps {
  fields: FieldConfig[];
  onSubmit: (data: any) => void;
  defaultValues?: Record<string, any>; // Tambahkan defaultValues
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  defaultValues = {}, // Default ke objek kosong jika tidak ada
}) => {
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues, // Gunakan defaultValues untuk mengisi nilai awal
  });

  React.useEffect(() => {
    reset(defaultValues); // Reset form jika defaultValues berubah
  }, [reset, JSON.stringify(defaultValues)]);

  const commonClasses =
    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300";

  const formatRoleFormat = (val: any) => {
    if (val == null) return "";
    let s = String(val).toUpperCase();
    // ganti spasi/strip jadi underscore
    s = s.replace(/[\s-]+/g, "_");
    // izinkan hanya A-Z, 0-9 dan underscore
    s = s.replace(/[^A-Z0-9_]/g, "");
    // satukan multiple underscore jadi satu
    s = s.replace(/_+/g, "_");
    // jangan hapus leading/trailing underscore — biarkan pengguna mengetik "_"
    return s;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>

          {field.type === "text" && field.name === "name" && (
            <input
              type="text"
              {...register(field.name)}
              className={commonClasses}
              style={{ textTransform: "uppercase" }}
            />
          )}

          {field.type === "text" && field.name !== "name" && (
            <input
              type="text"
              {...register(field.name)}
              className={commonClasses}
            />
          )}

          {field.type === "textarea" && (
            <textarea {...register(field.name)} className={commonClasses} />
          )}

          {field.type === "select" && field.options && (
            <Controller
              name={field.name}
              control={control}
              render={({ field: controllerField }) => (
                <Select
                  {...controllerField}
                  options={field.options}
                  className="mt-1"
                  classNamePrefix="react-select"
                />
              )}
            />
          )}

          {field.type === "role_format" && (
            <Controller
              name={field.name}
              control={control}
              render={({ field: controllerField }) => (
                <input
                  type="text"
                  value={controllerField.value ?? ""}
                  onChange={(e) => {
                    const formatted = formatRoleFormat(e.target.value);
                    controllerField.onChange(formatted);
                  }}
                  className={commonClasses}
                  style={{ textTransform: "uppercase" }}
                  placeholder="Contoh: role_format atau NAMA_PENGEMUDI"
                />
              )}
            />
          )}
        </div>
      ))}
    </form>
  );
};

export default DynamicForm;
