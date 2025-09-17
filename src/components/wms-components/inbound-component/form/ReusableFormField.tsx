import { useFormContext, Controller } from "react-hook-form";
import DatePicker from "../../../form/date-picker";

const ReusableFormField = ({
  name,
  label,
  required = false,
  as = "input",
  type,
  children,
  ...props
}: any) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const fieldProps = {
    ...register(name, { required }),
    ...props,
    className: `w-full border rounded-lg px-3 py-2 ${
      errors[name] ? "border-red-500" : "border-gray-300"
    }`,
  };

  return (
    <div>
      <label className="font-semibold text-gray-700 mb-1 block">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      {/* Conditional rendering based on element type */}
      {type === "date" ? (
        <Controller
          control={control}
          name="tanggal_po"
          rules={{ required: true }}
          render={({ field }) => (
            <DatePicker
              id="tanggal-po"
              label=""
              value={field.value}
              onChange={([date]: Date[]) => field.onChange(date)}
            />
          )}
        />
      ) : as === "select" ? (
        <select {...fieldProps}>{children}</select>
      ) : (
        <input {...fieldProps} type={type} />
      )}

      {errors[name]?.message && (
        <p className="text-sm text-red-500 mt-1">
          {String(errors[name].message)}
        </p>
      )}
    </div>
  );
};

export default ReusableFormField;
